import { Link2, MessageCircle, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/hooks/use-language";

export const nameFromEmail = (email: string) => {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._\-0-9]+/).filter(Boolean)[0] ?? local;
  if (!first) return email;
  return first.charAt(0).toUpperCase() + first.slice(1);
};

export function InviteShareActions({ email }: { email: string }) {
  const t = useT();
  const name = nameFromEmail(email);
  const link = `${window.location.origin}/auth?mode=signup`;
  const msg = t(
    `Hola! Te invité a compartir un gasto en WYN. Crea tu cuenta aquí: ${link}`,
    `Hi! I invited you to share an expense on WYN. Create your account here: ${link}`
  );

  const sendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t("Enlace copiado", "Link copied"));
    } catch {
      toast.error(t("No se pudo copiar el enlace", "Could not copy the link"));
    }
  };

  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-positive/15 text-positive">
          <UserRoundPlus className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {t(`${name} aún no está en WYN`, `${name} isn't on WYN yet`)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("Invítala para compartir este gasto.", "Invite them to share this expense.")}
          </p>
        </div>
      </div>
      <div className="flex divide-x divide-border overflow-hidden rounded-xl border border-border bg-background">
        <button
          type="button"
          onClick={sendWhatsApp}
          className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-positive transition hover:bg-positive/10"
        >
          <MessageCircle className="h-4 w-4" />
          {t("Enviar por WhatsApp", "Send via WhatsApp")}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition hover:bg-muted/50"
        >
          <Link2 className="h-4 w-4" />
          {t("Copiar link", "Copy link")}
        </button>
      </div>
    </div>
  );
}
