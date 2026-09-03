import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Heart, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { BrandLogo, KidsBrandLogo } from "@/components/brand-logo";
import { PoliciesDialog } from "@/components/policies-dialog";
import { useLanguage, useT } from "@/hooks/use-language";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/whatis.your.number/" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/107005182/" },
];

function openExternalSocial(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  const externalWindow = window.open(href, "_blank", "noopener,noreferrer");
  if (externalWindow) externalWindow.opener = null;
}

type FooterLink = { label: string; to: string; policy?: boolean; external?: boolean; anchor?: boolean; className?: string };

export function SiteFooter({ kids = false, affiliates = false }: { kids?: boolean; affiliates?: boolean } = {}) {
  const t = useT();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const homeHref = lang === "en" ? "/en" : "/";
  const blogHref = lang === "en" ? "/en/blog" : "/blog";
  const kidsHref = lang === "en" ? "/en/finance-for-kids" : "/finanzas-para-ninos";
  const demoHref = lang === "en" ? "/en/financial-freedom-calculator?start=1" : "/calculadora-libertad-financiera?start=1";

  const linkClass = "text-left text-sm text-muted-foreground transition-colors hover:text-primary";
  const renderLink = (l: FooterLink) => {
    const className = [linkClass, l.className].filter(Boolean).join(" ");
    return l.policy ? (
      <button type="button" onClick={() => setPoliciesOpen(true)} className={className}>
        {l.label}
      </button>
    ) : l.anchor ? (
      <a href={l.to} className={className}>
        {l.label}
      </a>
    ) : l.external ? (
      <a href={l.to} target="_blank" rel="noopener noreferrer" className={className}>
        {l.label}
      </a>
    ) : (
      <Link to={l.to} className={className}>
        {l.label}
      </Link>
    );
  };


  const columns = [
    affiliates
      ? {
          title: t("Producto", "Product"),
          links: [
            { label: t("Cómo funciona", "How it works"), to: "#como-funciona", anchor: true },
            { label: t("Cómo ganas", "How you earn"), to: "#como-ganas", anchor: true },
            { label: t("Precios", "Pricing"), to: "/precios" },
          ],
        }
      : kids
        ? {
            title: t("Producto", "Product"),
            links: [
               { label: t("Funciones", "Features"), to: `${kidsHref}#funciones` },
               { label: t("Precios", "Pricing"), to: "/precios" },
              { label: t("Programa de afiliados", "Affiliate program"), to: "/afiliados", external: true },
            ],
          }
        : {
            title: t("Producto", "Product"),
            links: [
               { label: t("Funciones", "Features"), to: `${homeHref}#funciones` },
               { label: t("Precios", "Pricing"), to: `${homeHref}#precios` },
               { label: t("Programa de afiliados", "Affiliate program"), to: "/afiliados", external: true },
            ],
          },
    affiliates
      ? {
          title: t("Recursos", "Resources"),
          links: [
             { label: t("Blog de libertad financiera", "Financial freedom blog"), to: blogHref },
             { label: t("Finanzas para adultos", "Adult finance"), to: homeHref, external: true },
             { label: t("Finanzas para niños", "Kids finance"), to: kidsHref, external: true },
          ],
        }
      : kids
        ? {
            title: t("Recursos", "Resources"),
            links: [
               { label: t("Blog de libertad financiera", "Financial freedom blog"), to: blogHref },
               { label: t("Calculadora de universidad", "College savings calculator"), to: lang === "en" ? "/en/college-savings-calculator" : "/calculadora-ahorro-universidad", className: "whitespace-nowrap text-xs md:text-[13px]" },
               { label: t("Finanzas para adultos", "Adult finance"), to: homeHref },
            ],
          }
        : {
            title: t("Recursos", "Resources"),
            links: [
               { label: t("Blog de libertad financiera", "Financial freedom blog"), to: blogHref },
               { label: t("Calculador de libertad financiera", "Financial freedom calculator"), to: demoHref, className: "whitespace-nowrap text-xs md:text-[13px]" },
               { label: t("Finanzas para niños", "Kids finance"), to: kidsHref, external: true },
            ],
          },
    {
      title: "Legal",
      links: [
        { label: t("Términos y condiciones", "Terms and conditions"), to: "/terminos", policy: true },
        { label: t("Política de reembolsos", "Refund policy"), to: "/reembolsos", policy: true },
        { label: t("Aviso de privacidad", "Privacy notice"), to: "/privacidad", policy: true },
      ],
    },
  ];

  const toggleButton = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-label={open ? t("Cerrar menú", "Close menu") : t("Abrir menú", "Open menu")}
      className="group absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative flex h-16 w-28 items-center justify-center overflow-hidden">
        <div className="absolute bottom-0 h-14 w-14 rounded-full bg-elevated/90 ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-105 group-active:scale-95" />
        <motion.div
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="relative z-10 text-foreground"
        >
          <Plus className="h-6 w-6" />
        </motion.div>
      </div>
    </button>
  );

  return (
    <footer className="relative mt-24 border-t border-border/60 bg-elevated/30">
      {open && toggleButton}
      <AnimatePresence initial={false}>
        {open && (

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-6">
              {/* Desktop layout */}
              <div className="hidden md:grid md:grid-cols-[1.6fr_repeat(3,1fr)] md:gap-14">
                <div>
                  {kids ? <KidsBrandLogo /> : <BrandLogo />}
                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {kids
                      ? t(
                          "Enseña a tus hijos a construir su primer número: ahorro, inversión y libertad desde pequeños.",
                          "Teach your kids to build their first number: saving, investing and freedom from a young age.",
                        )
                      : t(
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
                        <li key={l.label + l.to}>{renderLink(l)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Mobile layout */}
              <div className="md:hidden grid gap-8">
                <div>
                  {kids ? <KidsBrandLogo /> : <BrandLogo />}
                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {kids
                      ? t(
                          "Enseña a tus hijos a construir su primer número: ahorro, inversión y libertad desde pequeños.",
                          "Teach your kids to build their first number: saving, investing and freedom from a young age.",
                        )
                      : t(
                          "La libertad financiera tiene un número. Nosotros te ayudamos a encontrarlo.",
                          "Financial freedom has a number. We help you find yours.",
                        )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  {columns.map((col) => (
                    <div key={col.title}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {col.links.map((l) => (
                          <li key={l.label + l.to}>{renderLink(l)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed bottom bar */}
      <div className="relative border-t border-border/60 bg-elevated/90 backdrop-blur-md md:h-16">
        {!open && toggleButton}


        <div className="mx-auto flex h-full max-w-6xl flex-col items-center gap-3 px-4 pb-5 pt-10 text-center md:flex-row md:justify-between md:gap-4 md:px-6 md:py-0 md:text-left">
          <div className="max-w-xl text-[10px] leading-4 text-muted-foreground/80 md:text-left">
            <p>
              {t(
                "WhatsYournumber es un software de seguimiento de finanzas personales.",
                "WhatsYournumber is personal finance tracking software.",
              )}
            </p>
            <p className="mt-0.5">
              {t(
                "No ofrece asesoría financiera, fiscal ni de inversión; todo el contenido y las respuestas de IA son educativos.",
                "It does not provide financial, tax or investment advice; all content and AI answers are educational.",
              )}
            </p>
          </div>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:justify-start md:text-sm">
            <span>© {new Date().getFullYear()}</span>
            <span className="hidden text-border md:inline">|</span>
            <span className="flex items-center gap-1.5 text-foreground">
              {t("Hecho con", "Made with")}
              <Heart className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
              {t("desde un mundo borderless", "from a borderless world")}
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-2.5">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                 onClick={(event) => openExternalSocial(event, href)}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <PoliciesDialog open={policiesOpen} onOpenChange={setPoliciesOpen} title="Legal" />
    </footer>
  );
}
