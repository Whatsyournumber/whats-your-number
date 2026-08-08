import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Menu } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useT, LanguageToggle } from "@/hooks/use-language";

export function SiteHeader() {
  const { user } = useAuth();
  const t = useT();
  const [open, setOpen] = useState(false);

  const tabs = [
    { label: t("Cómo funciona", "How it works"), to: "/", hash: "funciones" },
    { label: t("Precios", "Pricing"), to: "/precios" },
    { label: "Blog", to: "/blog" },
    { label: "demo", to: "/demo", search: { start: 1 }, icon: true },
  ] as const;

  const renderTab = (tab: (typeof tabs)[number]) => (
    <Link
      key={tab.label}
      to={tab.to}
      {...("hash" in tab ? { hash: tab.hash } : {})}
      {...("search" in tab ? { search: tab.search } : {})}
      className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
      activeOptions={{ exact: true, includeHash: false }}
      activeProps={{ className: "bg-elevated text-foreground" }}
    >
      {tab.label === "demo" ? (
        <span className="inline-flex items-center gap-1.5 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("Demo gratis", "Free demo")}
        </span>
      ) : (
        tab.label
      )}
    </Link>
  );

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-6">
      <Link to="/" className="shrink-0">
        <BrandLogo />
      </Link>

      <nav className="hidden items-center gap-1 md:flex">
        {tabs.map(renderTab)}
      </nav>

      <div className="ml-auto hidden items-center gap-2 md:flex">
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
        <LanguageToggle />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-auto rounded-full md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t("Abrir menú", "Open menu")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-xs">
          <div className="flex flex-col gap-6 pt-8">
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <SheetClose asChild key={tab.label}>
                  {renderTab(tab)}
                </SheetClose>
              ))}
            </nav>

            <div className="flex flex-col gap-2">
              {user ? (
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/dashboard">{t("Ir al dashboard", "Go to dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <SheetClose asChild>
                    <Button asChild variant="ghost" size="sm" className="rounded-full">
                      <Link to="/auth" search={{ mode: "login" }}>
                        {t("Iniciar sesión", "Sign in")}
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild size="sm" className="rounded-full">
                      <Link to="/auth" search={{ mode: "signup" }}>
                        {t("Crear cuenta", "Sign up")}
                      </Link>
                    </Button>
                  </SheetClose>
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">{t("Idioma", "Language")}</span>
              <LanguageToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
