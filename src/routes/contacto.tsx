import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, useT } from "@/hooks/use-language";
import lighthouseImg from "@/assets/contact-lighthouse.jpg";

type ContactSearch = {
  planName?: string;
  topic?: string;
};

export const Route = createFileRoute("/contacto")({
  validateSearch: (search: Record<string, unknown>): ContactSearch => {
    const planName =
      typeof search["planName"] === "string" ? search["planName"].slice(0, 60) : undefined;
    const topic = typeof search["topic"] === "string" ? search["topic"].slice(0, 40) : undefined;
    return { ...(planName ? { planName } : {}), ...(topic ? { topic } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Contacto — WhatsYournumber" },
      {
        name: "description",
        content:
          "Escríbele al equipo de WhatsYournumber: preguntas, plan a la medida para tu familia o empresa, soporte y colaboraciones. Respondemos en menos de 24 horas.",
      },
      { property: "og:title", content: "Contacto — WhatsYournumber" },
      {
        property: "og:description",
        content: "Hablemos: planes a la medida, soporte y colaboraciones. Respuesta en menos de 24 h.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://whatsyour-number.com/contacto" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://whatsyour-number.com/contacto" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const t = useT();
  const { lang } = useLanguage();
  const { planName: plan, topic } = Route.useSearch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    plan ? t(`Me interesa el plan a la medida (${plan}).`, `I'm interested in a custom plan (${plan}).`) : "",
  );
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = t("Escribe tu nombre.", "Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = t("Revisa tu email.", "Check your email.");
    if (message.trim().length < 10)
      next.message = t("Cuéntanos un poco más (mínimo 10 caracteres).", "Tell us a bit more (at least 10 characters).");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (!validate()) return;
    setSending(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic: topic || (plan ? "custom_plan" : "general"),
          plan: plan || undefined,
          message: message.trim(),
          lang,
          website: honeypot,
        }),
      });
      if (!res.ok) throw new Error(`contact ${res.status}`);
      setSent(true);
    } catch (error) {
      console.error("Contact form submission failed", error);
      toast.error(t("No pudimos enviar tu mensaje. Inténtalo de nuevo.", "We couldn't send your message. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSent(false);
    setName("");
    setEmail("");
    setMessage("");
    setErrors({});
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />

      {/* Faro que ilumina */}
      <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden md:h-[52vh]">
        <img
          src={lighthouseImg}
          alt=""
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
              {t("Contacto", "Contact")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {t("Hablemos", "Let's talk")}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
              {t(
                 "Una duda, un plan a la medida o un problema con tu cuenta: escríbenos y te respondemos lo antes posible.",
                 "A question, a custom plan or a problem with your account: write to us and we'll reply as soon as possible.",
              )}
            </p>
          </motion.div>
        </div>
      </div>

      <main className="relative z-10 mx-auto -mt-16 w-full max-w-xl px-4 pb-16 md:-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          className="surface p-5 shadow-2xl md:p-8"
        >
          {sent ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="grid h-16 w-16 place-items-center rounded-full bg-positive/15 text-positive"
              >
                <Check className="h-7 w-7" />
              </motion.span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                {t("Correo enviado", "Email sent")}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t(
                  "Gracias por escribirnos. Te respondemos lo antes posible.",
                  "Thanks for reaching out. We'll reply as soon as possible.",
                )}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" className="rounded-full" onClick={reset}>
                  {t("Escribir otro mensaje", "Write another message")}
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/precios">{t("Ver planes", "See plans")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              {plan && (
                <span className="inline-flex w-fit rounded-full border border-positive/30 bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                  {t(`Plan seleccionado: ${plan}`, `Selected plan: ${plan}`)}
                </span>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact-name" className="text-xs text-muted-foreground">
                    {t("Nombre", "Name")}
                  </Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Tu nombre", "Your name")}
                    autoComplete="name"
                    className="mt-1.5"
                  />
                  {errors.name && <p className="mt-1 text-xs text-negative">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="contact-email" className="text-xs text-muted-foreground">
                    {t("Email", "Email")}
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    autoComplete="email"
                    className="mt-1.5"
                  />
                  {errors.email && <p className="mt-1 text-xs text-negative">{errors.email}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="contact-message" className="text-xs text-muted-foreground">
                  {t("Mensaje", "Message")}
                </Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder={t(
                    "Cuéntanos en qué podemos ayudarte",
                    "Tell us how we can help",
                  )}
                  className="mt-1.5 resize-none"
                />
                {errors.message && <p className="mt-1 text-xs text-negative">{errors.message}</p>}
              </div>

              {/* Trampa para bots: los humanos no ven ni rellenan este campo */}
              <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={sending} className="w-full rounded-full">
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t("Enviar mensaje", "Send message")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t(
                  "Te respondemos a tu correo, sin spam.",
                  "We reply to your email, no spam.",
                )}
              </p>
            </form>
          )}
        </motion.div>

        <p className="mx-auto mt-6 max-w-md text-center text-xs leading-relaxed text-muted-foreground/80">
          {t(
            "WhatsYournumber es un software de seguimiento de finanzas personales. No ofrece asesoría financiera, fiscal ni de inversión.",
            "WhatsYournumber is personal finance tracking software. It does not provide financial, tax or investment advice.",
          )}
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
