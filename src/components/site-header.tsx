import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles, Menu } from "lucide-react";

import { BrandLogo, BrandMark, KidsBrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

import { CurrencyToggle } from "@/components/currency-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useT, LanguageToggle } from "@/hooks/use-language";

export function SiteHeader({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { user } = useAuth();
  const { isPatrimonio } = useSubscription();
  const homeTo = isPatrimonio ? "/ninos" : "/dashboard";
  const t = useT();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isEnglishPath = pathname === "/en" || pathname.startsWith("/en/");
  const isKidsLanding = pathname === "/finanzas-para-ninos" || pathname === "/en/finance-for-kids";
  const authFlow = isKidsLanding ? "kids" as const : undefined;
  const isLight = variant === "light";
  const showCurrency = pathname !== "/" && pathname !== "/en" && !isKidsLanding;



  const tabs = [
    { label: t("Cómo funciona", "How it works"), to: isEnglishPath ? "/en" : "/", hash: "funciones" },
    { label: t("Precios", "Pricing"), to: "/precios" },
    { label: "Blog", to: isEnglishPath ? "/en/blog" : "/blog" },
    {
      label: t("Finanzas para niños", "Kids finance"),
      to: isEnglishPath ? "/en/finance-for-kids" : "/finanzas-para-ninos",
    },
    { label: "demo", to: isEnglishPath ? "/en/financial-freedom-calculator" : "/calculadora-libertad-financiera", search: { start: 1 }, icon: true },
  ] as const;

  const kidsTabs = [
    {
      label: t("Cómo funciona", "How it works"),
      to: isEnglishPath ? "/en/finance-for-kids" : "/finanzas-para-ninos",
      hash: "funciones",
    },
    { label: "Blog", to: isEnglishPath ? "/en/blog" : "/blog" },
    { label: t("Finanzas para adultos", "Adult finance"), to: isEnglishPath ? "/en" : "/" },
    { label: t("Precios", "Pricing"), to: "/precios", search: { plan: "familiar" } },
    { label: "demo", to: isEnglishPath ? "/en/college-savings-calculator" : "/calculadora-ahorro-universidad", search: { start: 1 } },
  ] as const;


  const visibleTabs = (isKidsLanding ? kidsTabs : tabs) as unknown as (typeof tabs)[number][];

  const renderTab = (tab: (typeof tabs)[number]) => (
    <Link
      key={tab.label}
      to={tab.to}
      {...("hash" in tab ? { hash: tab.hash } : {})}
      {...("search" in tab ? { search: tab.search } : {})}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm transition-colors",
        isLight
          ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          : "text-muted-foreground hover:bg-elevated hover:text-foreground",
      )}
      activeOptions={{ exact: true, includeHash: false }}
      activeProps={{
        className: isLight ? "bg-slate-100 text-slate-900" : "bg-elevated text-foreground",
      }}
    >
      {tab.label === "demo" ? (
        <span className="inline-flex items-center gap-1.5 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("Calculadora de libertad financiera gratis", "Free financial freedom calculator")}
        </span>
      ) : (
        tab.label
      )}
    </Link>
  );


  const authButtons = user ? (
    <Button asChild size="sm" className="rounded-full">
      <Link to={homeTo}>{t("Ir al dashboard", "Go to dashboard")}</Link>
    </Button>
  ) : (
    <>
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn(
          "rounded-full border-border/60 bg-background/40 text-xs whitespace-nowrap backdrop-blur-sm hover:bg-background/60",
          isLight && "border-slate-200 bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900",
        )}
      >
        <Link to="/auth" search={{ mode: "login", ...(authFlow ? { flow: authFlow } : {}) }}>
          {t("Iniciar sesión", "Sign in")}
        </Link>
      </Button>
      <Button asChild size="sm" className="rounded-full text-xs whitespace-nowrap shadow-sm">
        <Link to="/auth" search={{ mode: "signup", ...(authFlow ? { flow: authFlow } : {}) }}>
          {t("Crear cuenta", "Sign up")}
        </Link>
      </Button>
    </>
  );


  const mobileAuthButton = user ? (
    <Button asChild size="sm" className="h-8 rounded-full px-3 text-xs">
      <Link to={homeTo}>{t("Dashboard", "Dashboard")}</Link>
    </Button>
  ) : (
    <Button asChild size="sm" className="h-8 rounded-full px-3 text-xs">
      <Link to="/auth" search={{ mode: "signup", ...(authFlow ? { flow: authFlow } : {}) }}>
        {t("Crear cuenta", "Sign up")}
      </Link>
    </Button>
  );

  return (
    <header className="relative z-20 mx-auto w-full max-w-6xl px-4 py-4 md:px-6 md:py-6">
      {/* Desktop */}
      <div className="hidden items-center justify-between lg:flex">
        <div className="flex items-center gap-3">
          <Link to={isKidsLanding ? (isEnglishPath ? "/en/finance-for-kids" : "/finanzas-para-ninos") : (isEnglishPath ? "/en" : "/")} className="shrink-0">
            {isKidsLanding ? <KidsBrandLogo /> : <BrandLogo />}
          </Link>
          <nav className="flex items-center gap-1">{visibleTabs.map(renderTab)}</nav>
        </div>
        <div className="flex items-center gap-2">
          {authButtons}
          {showCurrency && <CurrencyToggle />}
          <LanguageToggle />
        </div>
      </div>

      {/* Mobile / Tablet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("Abrir menú", "Open menu")}</span>
                </Button>
              </SheetTrigger>
              <Link to={isKidsLanding ? (isEnglishPath ? "/en/finance-for-kids" : "/finanzas-para-ninos") : (isEnglishPath ? "/en" : "/")} className="min-w-0">
                {isKidsLanding ? <KidsBrandLogo className="h-7" compact /> : <BrandLogo className="h-7" compact />}
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <LanguageToggle />

              {user ? (
                <Button asChild size="sm" className="h-8 rounded-full px-3 text-xs">
                  <Link to={homeTo}>{t("Dashboard", "Dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={cn(
                      "hidden h-8 rounded-full border-border/60 bg-background/40 px-3 text-xs whitespace-nowrap backdrop-blur-sm hover:bg-background/60 sm:inline-flex",
                      isLight && "border-slate-200 bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900",
                    )}
                  >
                    <Link to="/auth" search={{ mode: "login", ...(authFlow ? { flow: authFlow } : {}) }}>
                      {t("Iniciar sesión", "Sign in")}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="h-8 rounded-full px-3 text-xs whitespace-nowrap shadow-sm">
                    <Link to="/auth" search={{ mode: "signup", ...(authFlow ? { flow: authFlow } : {}) }}>
                      {t("Crear cuenta", "Sign up")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <SheetContent side="left" className="w-full sm:max-w-xs">
            <div className="flex flex-col gap-6 pt-8">
              <nav className="flex flex-col gap-2">
                {visibleTabs.map((tab) => (
                  <SheetClose asChild key={tab.label}>
                    {renderTab(tab)}
                  </SheetClose>
                ))}
              </nav>
              {!user && (
                <div className="flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full sm:hidden"
                    >
                      <Link to="/auth" search={{ mode: "login", ...(authFlow ? { flow: authFlow } : {}) }}>
                        {t("Iniciar sesión", "Sign in")}
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild size="sm" className="rounded-full">
                      <Link to="/auth" search={{ mode: "signup", ...(authFlow ? { flow: authFlow } : {}) }}>
                        {t("Crear cuenta", "Sign up")}
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
              {showCurrency && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">{t("Moneda", "Currency")}</span>
                  <CurrencyToggle />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
