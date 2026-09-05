import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { useT } from "@/hooks/use-language";

export function MobileBottomNav() {
  const t = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="border-t border-border/60 bg-background/95 px-4 py-2 backdrop-blur-xl">
        <Link
          to="/suscripcion"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98]"
        >
          <Crown className="h-4 w-4" />
          <span>{t("Plan familiar", "Family plan")}</span>
        </Link>
      </div>
    </nav>
  );
}
