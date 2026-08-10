import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Heart, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const t = useT();
  const [open, setOpen] = useState(false);

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
    <footer className="relative mt-24 border-t border-border/60 bg-elevated/30">
      {/* Desktop footer */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile collapsible footer */}
      <div className="md:hidden">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="mx-auto w-full max-w-6xl px-6 pt-10 pb-4">
                <div className="grid gap-8">
                  <div>
                    <BrandLogo />
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {t(
                        "La libertad financiera tiene un número. Nosotros te ayudamos a encontrarlo.",
                        "Financial freedom has a number. We help you find yours.",
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {columns.map((col) => (
                      <div key={col.title}>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
                        <ul className="mt-3 space-y-2">
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

                  <div className="flex items-center justify-between border-t border-border/60 pt-6">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>© {new Date().getFullYear()}</span>
                      <span className="text-border">|</span>
                      <span className="flex items-center gap-1 text-foreground">
                        {t("Hecho con", "Made with")}
                        <Heart className="h-3 w-3 fill-primary text-primary" />
                        {t("borderless", "borderless")}
                      </span>
                    </p>

                    <div className="flex items-center gap-2">
                      {socials.slice(0, 3).map(({ icon: Icon, label, href }) => (
                        <a
                          key={label}
                          href={href}
                          aria-label={label}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative h-16 bg-elevated/80 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("Cerrar menú", "Close menu") : t("Abrir menú", "Open menu")}
            className="group absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative flex h-16 w-28 items-center justify-center overflow-hidden">
              {/* Semi-circle bump */}
              <div className="absolute bottom-0 h-14 w-14 rounded-full bg-foreground/90 transition-transform duration-300 group-hover:scale-105 group-active:scale-95" />
              <motion.div
                animate={{ rotate: open ? 135 : 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="relative z-10 text-background"
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            </div>
          </button>

          <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
            <BrandLogo className="scale-[0.65] origin-left" />
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
