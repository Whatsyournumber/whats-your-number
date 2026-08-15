import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

export type BillingCard = {
  brand: string | null;
  last4: string | null;
  expiry: string | null;
  type: string | null;
};

export type BillingDetails = {
  name: string | null;
  email: string | null;
  card: BillingCard | null;
};

/** Datos del cliente en Paddle + tarjeta usada en la última transacción pagada. */
export async function fetchBillingDetails(
  env: PaddleEnv,
  customerId: string,
  subscriptionId: string,
): Promise<BillingDetails> {
  const details: BillingDetails = { name: null, email: null, card: null };

  try {
    const res = await gatewayFetch(env, `/customers/${encodeURIComponent(customerId)}`);
    const json = (await res.json()) as { data?: { name?: string | null; email?: string | null } };
    details.name = json.data?.name ?? null;
    details.email = json.data?.email ?? null;
  } catch {
    // Sin datos de cliente seguimos mostrando lo que tengamos.
  }

  try {
    const res = await gatewayFetch(
      env,
      `/transactions?subscription_id=${encodeURIComponent(subscriptionId)}&per_page=10&order_by=created_at[DESC]`,
    );
    const json = (await res.json()) as { data?: any[] };
    for (const txn of json.data ?? []) {
      for (const payment of txn?.payments ?? []) {
        const card = payment?.method_details?.card;
        const type = payment?.method_details?.type ?? null;
        if (card) {
          details.card = {
            brand: card.type ?? null,
            last4: card.last4 ?? null,
            expiry:
              card.expiry_month && card.expiry_year
                ? `${String(card.expiry_month).padStart(2, "0")}/${String(card.expiry_year).slice(-2)}`
                : null,
            type,
          };
          return details;
        }
        if (type && !details.card) details.card = { brand: null, last4: null, expiry: null, type };
      }
    }
  } catch {
    // La tarjeta es opcional.
  }

  return details;
}
