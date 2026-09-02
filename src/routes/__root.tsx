import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Loader2, LogOut, Upload } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";


import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/app-sidebar";
import { AskAiSearch } from "@/components/ask-ai-search";
import { ConsentBanner } from "@/components/consent-banner";
import { GoogleAnalytics } from "@/components/google-analytics";
import { NotFoundPage } from "@/components/not-found-page";
import { PromoAutoRedeem } from "@/components/promo-auto-redeem";
import { AffiliateTracker } from "@/components/affiliate-tracker";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useMyAffiliate } from "@/hooks/use-affiliate";
import { useAffiliateWizardActive } from "@/lib/affiliate-wizard-state";

import { LanguageProvider, useT, LanguageToggle } from "@/hooks/use-language";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return <NotFoundPage />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("Esta página no cargó", "This page failed to load")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Algo falló de nuestro lado. Puedes reintentar o volver al inicio.", "Something went wrong on our end. You can retry or go back home.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Reintentar", "Retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("Ir al inicio", "Go home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Finanzas Personales con IA | Controla Gastos, Patrimonio y Retiro" },
      {
        name: "description",
        content:
          "Controla tus gastos, patrimonio, inversiones y flujo de caja en una sola plataforma. Descubre cómo cada decisión financiera te acerca o aleja de tu número de retiro.",
      },
      { property: "og:site_name", content: "WhatsYournumber" },
      { property: "og:locale", content: "es_ES" },
      { property: "og:title", content: "La libertad financiera tiene un número. ¿Cuál es el tuyo?" },
      {
        property: "og:description",
        content:
          "Controla tus gastos, patrimonio e inversiones y descubre cuánto necesitas para alcanzar tu libertad financiera. Potenciado por IA | Comienza ya",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#04100c" },
      {
        name: "google-site-verification",
        content: "k-GDaLmVT5tt4Y3Dqkju61WzEM-cmeadYWfYjgo3XnM",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500..800&family=DM+Sans:opsz,wght@9..40,300..700&family=Space+Grotesk:wght@400..700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },

    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "WhatsYournumber",
          url: "https://whatsyour-number.com",
          logo: "https://whatsyour-number.com/favicon.png",
          description:
            "Plataforma de finanzas personales con IA: controla gastos, patrimonio, inversiones, flujo de caja y retiro en un solo lugar.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <PromoAutoRedeem />
          <AffiliateTracker />
          <GoogleAnalytics />
          <RootLayout />
          <ConsentBanner />
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

const PUBLIC_PATHS = [
  "/",
  "/en",
  "/auth",
  "/precios",
  "/blog",
  "/en/blog",
  "/demo",
  "/en/financial-freedom-calculator",
  "/calculadora-libertad-financiera",
  "/en/financial-freedom-calculator",
  "/demo-ninos",
  "/calculadora-ahorro-universidad",
  "/privacidad",
  "/terminos",
  "/reembolsos",
  "/finanzas-para-ninos",
  "/en/finanzas-para-ninos",
  "/en/finance-for-kids",
  "/en/college-savings-calculator",
];
// El onboarding tiene su propio gate de sesión y layout a pantalla completa.
const BARE_PATHS = ["/onboarding", "/elegir", "/ninos"];

// Rutas que funcionan con y sin sesión: públicas si no hay usuario, dentro del app si lo hay.
const HYBRID_PATHS = ["/afiliados"];

function RootLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const matches = useRouterState({ select: (r) => r.matches });
  const { user, loading } = useAuth();

  // Ruta catch-all: muestra la página 404 sin redirigir a auth.
  const isCatchAll = matches.some((m) => m.routeId === "/$" || m.routeId.endsWith("/$"));
  if (isCatchAll) {
    return <Outlet />;
  }

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/en/blog/") ||
    BARE_PATHS.includes(pathname) ||
    pathname.startsWith("/nino/") ||
    pathname === "/ninos" ||
    pathname.startsWith("/ninos/")
  ) {
    return <Outlet />;
  }

  if (HYBRID_PATHS.includes(pathname) && (loading || !user)) {
    return <Outlet />;
  }

  // /afiliados: la landing y el wizard van a pantalla completa; solo el panel
  // de afiliado activo se muestra dentro del dashboard.
  if (pathname === "/afiliados") {
    return <AffiliatesGate />;
  }

  return <AppShell />;
}

function AffiliatesGate() {
  const { affiliate, loading } = useMyAffiliate();
  const wizardActive = useAffiliateWizardActive();
  if (loading || !affiliate || wizardActive) return <Outlet />;
  return <AppShell />;
}


function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login" } });
  }, [loading, user, navigate]);

  // Primera vez: si no completó el onboarding, lo enviamos allí.
  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("onboarding_profiles")
        .select("completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (!data?.completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      setOnboardingChecked(true);
    })();
    return () => {
      active = false;
    };
  }, [loading, user, navigate]);

  if (loading || !user || !onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
            <SidebarTrigger />
            <AskAiSearch />

            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
                <Link to="/configuracion">
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("Importar", "Import")}</span>
                </Link>
              </Button>
              <ThemeToggle />
              <CurrencyToggle />
              <LanguageToggle />
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-full"
                onClick={() => {
                  navigate({ to: "/", replace: true });
                  void signOut();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("Salir", "Log out")}</span>
              </Button>
            </div>
          </header>
          {/* Required: nested routes render here. */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
