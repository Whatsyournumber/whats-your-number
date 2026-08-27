/**
 * Verificador automático de backlinks.
 *
 * Para cada destino con URL de publicación guardada descarga el HTML, busca un
 * enlace a whatsyour-number.com y comprueba si pasa autoridad (dofollow) o
 * lleva rel="nofollow"/"ugc"/"sponsored". Actualiza el estado en la tabla
 * `backlink_submissions` para que el panel lo muestre sin intervención manual.
 */

import { backlinkTargets, priorityOf } from "@/lib/backlink-targets";

const DOMAINS = ["whatsyour-number.com", "whatsyournumber.lovable.app"];

export type BacklinkCheck = {
  targetId: string;
  url: string;
  found: boolean;
  dofollow: boolean;
  httpStatus: number | null;
  error: string | null;
};

/** Extrae las etiquetas <a> que apuntan a nuestro dominio. */
function findOurAnchors(html: string): string[] {
  const anchors = html.match(/<a\b[^>]*>/gi) ?? [];
  return anchors.filter((tag) =>
    DOMAINS.some((domain) => tag.toLowerCase().includes(domain)),
  );
}

function isDofollow(tag: string): boolean {
  const rel = /rel\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
  return !/(nofollow|ugc|sponsored)/.test(rel);
}

export async function checkBacklink(targetId: string, url: string): Promise<BacklinkCheck> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WhatsYourNumberBacklinkBot/1.0; +https://whatsyour-number.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const status = response.status;
    if (!response.ok) {
      return { targetId, url, found: false, dofollow: false, httpStatus: status, error: `HTTP ${status}` };
    }
    const html = await response.text();
    const anchors = findOurAnchors(html);
    return {
      targetId,
      url,
      found: anchors.length > 0,
      dofollow: anchors.some(isDofollow),
      httpStatus: status,
      error: anchors.length > 0 ? null : "Enlace a whatsyour-number.com no encontrado en la página",
    };
  } catch (error) {
    return {
      targetId,
      url,
      found: false,
      dofollow: false,
      httpStatus: null,
      error: error instanceof Error ? error.message : "Error de red",
    };
  }
}

export type VerifyReport = {
  checked: number;
  published: number;
  pending: number;
  checks: BacklinkCheck[];
  at: string;
};

/** Comprueba todos los envíos con URL guardada y actualiza su estado. */
export async function verifyBacklinks(): Promise<VerifyReport> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("backlink_submissions")
    .select("target_id, link_url, status");
  if (error) throw new Error(error.message);

  const rows = (data ?? []).filter(
    (row: { link_url: string | null }) => !!row.link_url && /^https?:\/\//i.test(row.link_url),
  ) as { target_id: string; link_url: string; status: string }[];

  const checks = await Promise.all(
    rows.map((row) => checkBacklink(row.target_id, row.link_url)),
  );

  const now = new Date().toISOString();
  for (const check of checks) {
    const target = backlinkTargets.find((item) => item.id === check.targetId);
    await supabaseAdmin
      .from("backlink_submissions")
      .upsert(
        {
          target_id: check.targetId,
          status: check.found ? "publicado" : "enviado",
          link_url: check.url,
          verified: check.found,
          dofollow_ok: check.dofollow,
          http_status: check.httpStatus,
          check_error: check.error,
          last_checked_at: now,
          priority: target ? priorityOf(target).score : 0,
          updated_at: now,
        } as never,
        { onConflict: "target_id" },
      );
  }

  const published = checks.filter((check) => check.found).length;
  return {
    checked: checks.length,
    published,
    pending: checks.length - published,
    checks,
    at: now,
  };
}
