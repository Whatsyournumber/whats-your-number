import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin } from "lucide-react";
import { motion } from "motion/react";

import { useT } from "@/hooks/use-language";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/whatis.your.number/" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/107005182/" },
];

export function NotFoundPage() {
  const t = useT();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h1 className="bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-[8rem] font-bold leading-none tracking-tighter text-transparent sm:text-[10rem]">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <p className="mt-2 text-lg font-medium text-foreground sm:text-xl">
            {t("Este número no está en tu plan financiero.", "This number isn't in your financial plan.")}
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t(
              "La página que buscas no existe o fue movida. Vuelve al inicio y sigue construyendo tu número.",
              "The page you're looking for doesn't exist or was moved. Head back home and keep building your number.",
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="mt-8 flex flex-col items-center gap-5"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
          >
            {t("Volver al inicio", "Back to home")}
          </Link>

          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-muted-foreground ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground hover:ring-primary"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
