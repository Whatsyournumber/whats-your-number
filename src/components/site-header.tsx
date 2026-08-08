import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useT, LanguageToggle } from "@/hooks/use-language";

export function SiteHeader() {
  const { user } = useAuth();
  const t = useT();

  const tabs = [
    { label: t("Funciones", "Features"), to: "/", hash: "funciones" },
    { label: t("Precios", "Pricing"), to: "/precios" },
    { label: "Blog", to: "/blog" },
  ] as const;

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-6">
      <Link to="/" className="shrink-0">
        <BrandLogo />
      </Link>

      <nav className="ml-6 hidden items-center gap-1 md:flex">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            {...("hash" in tab ? { hash: tab.hash } : {})}
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            activeOptions={{ exact: true, includeHash: false }}
            activeProps={{ className: "bg-elevated text-foreground" }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary sm:inline-flex"
        >
          <Link to="/demo" search={{ start: 1 }}>
            <Sparkles className="h-3.5 w-3.5" />
            {t("Demo gratis", "Free demo")}
          </Link>
        </Button>
        <LanguageToggle />
        {user ? (
          <Button asChild size="sm" className="rounded-full">
            <Link to="/dashboard">{t("Ir al dashboard", "Go to dashboard")}</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/auth" search={{ mode: "login" }}>
                {t("Iniciar sesión", "Sign in")}
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("Crear cuenta", "Sign up")}
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
