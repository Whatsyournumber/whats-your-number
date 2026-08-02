import { Link } from "@tanstack/react-router";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const tabs = [
  { label: "Funciones", to: "/", hash: "funciones" },
  { label: "Precios", to: "/precios" },
  { label: "Blog", to: "/blog" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();

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
            hash={"hash" in tab ? tab.hash : undefined}
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            activeOptions={{ exact: true, includeHash: false }}
            activeProps={{ className: "bg-elevated text-foreground" }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <Button asChild size="sm" className="rounded-full">
            <Link to="/dashboard">Ir al dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/auth" search={{ mode: "login" }}>
                Iniciar sesión
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth" search={{ mode: "signup" }}>
                Crear cuenta
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
