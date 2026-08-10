import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Heart } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/hooks/use-language";

const socials = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

export function SiteFooter() {
  const { t } = useT();

  const columns = [
    {
      title: t("Producto", "Product"),
      links: [
        { label: t("Funciones", "Features"), to: "/#funciones" },
        { label: t("Precios", "Pricing"), to: "/#precios" },
        { label: t("Demo gratis", "Free demo"), to: "/demo" },
        { label: t("Panel vivo", "Live panel"), to: "/#panel" },
      ],
    },
    {
      title: t("Recursos", "Resources"),
      links: [
        { label: "Blog", to: "/#blog" },
        { label: t("Tu número", "Your number"), to: "/demo" },
        { label: t("Your next city", "Your next city"), to: "/demo" },
      ],
    },
    {
      title: t("Cuenta", "Account"),
      links: [
        { label: t("Iniciar sesión", "Sign in"), to: "/auth" },
        { label: t("Crear cuenta", "Create account"), to: "/auth" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border/60 bg-elevated/30">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t(
                "La libertad financiera tiene un número. Nosotros te ayudamos a encontrarlo.",
                "Financial freedom has a number. We help you find yours.",
              )}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label + l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col-reverse items-center gap-6 border-t border-border/60 pt-8 md:flex-row md:justify-between">
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5 text-foreground">
              {t("Hecho con", "Made with")}
              <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
              {t("desde un mundo borderless", "from a borderless world")}
            </span>
          </p>

          <div className="flex items-center gap-2.5">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
