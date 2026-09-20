import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Clock, Instagram, Linkedin, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, useT } from "@/hooks/use-language";

const TEAM_EMAIL = "thecontentcclub@gmail.com";

const TOPICS = ["general", "custom_plan", "support", "affiliate", "press"] as const;
type Topic = (typeof TOPICS)[number];

const topicLabels: Record<Topic, [string, string]> = {
  general: ["Pregunta general", "General question"],
  custom_plan: ["Plan a la medida", "Custom plan"],
  support: ["Soporte", "Support"],
  affiliate: ["Programa de afiliados", "Affiliate program"],
  press: ["Prensa y colaboraciones", "Press and partnerships"],
};

type ContactSearch = {
  plan?: string;
  topic?: string;
};

export const Route = createFileRoute("/contacto")({
  validateSearch: (search: Record<string, unknown>): ContactSearch => {
    const plan = typeof search["plan"] === "string" ? search["plan"].slice(0, 60) : undefined;
    const topic =
      typeof search["topic"] === "string" && (TOPICS as readonly string[]).includes(search["topic"])
        ? search["topic"]
        : undefined;
    return { ...(plan ? { plan } : {}), ...(topic ? { topic } : {}) };
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
  const { plan, topic } = Route.useSearch();

  const initialTopic: Topic =
    topic && (TOPICS as readonly string[]).includes(topic)
      ? (topic as Topic)
      : plan
        ? "custom_plan"
        : "general";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic>(initialTopic);
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
          company: company.trim() || undefined,
          topic: selectedTopic,
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
    setCompany("");
    setMessage("");
    setSelectedTopic("general");
    setErrors({});
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-6 md:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12"
        >
          {/* Columna izquierda: contexto + contacto directo */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("Contacto", "Contact")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Hablemos", "Let's talk")}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {t(
                "Cuéntanos qué necesitas: una duda, un plan a la medida o un problema con tu cuenta. Te respondemos en menos de 24 horas.",
                "Tell us what you need: a question, a custom plan or a problem with your account. We reply in under 24 hours.",
              )}
            </p>

            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${TEAM_EMAIL}?subject=${encodeURIComponent("WhatsYournumber")}`}
                className="surface flex items-center gap-3 p-4 transition-colors hover:bg-elevated/60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {t("Escríbenos directo", "Email us directly")}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">{TEAM_EMAIL}</span>
                </span>
              </a>

              <div className="surface flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-positive/15 text-positive">
                  <Clock className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {t("Respuesta en 24 h", "Reply within 24 h")}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t("De lunes a viernes.", "Monday to Friday.")}
                  </span>
                </span>
              </div>

              <div className="surface p-4">
                <p className="text-sm font-medium">{t("Plan a la medida", "Custom plan")}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "Diseñamos un plan para tu familia, tu empresa o tu equipo de asesores, con precios por volumen.",
                    "We design a plan for your family, your company or your advisory team, with volume pricing.",
                  )}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
                  <Link to="/precios">{t("Ver planes", "See plans")}</Link>
                </Button>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.instagram.com/whatis.your.number/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/107005182/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>

              <p className="max-w-md text-xs leading-relaxed text-muted-foreground/80">
                {t(
                  "WhatsYournumber es un software de seguimiento de finanzas personales. No ofrece asesoría financiera, fiscal ni de inversión.",
                  "WhatsYournumber is personal finance tracking software. It does not provide financial, tax or investment advice.",
                )}
              </p>
            </div>
          </div>

          {/* Columna derecha: formulario */}
          <div className="surface p-5 md:p-7">
            {sent ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-positive/15 text-positive">
                  <Check className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight">
                  {t("Mensaje recibido", "Message received")}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "Gracias por escribirnos. Te respondemos a tu email en menos de 24 horas.",
                    "Thanks for reaching out. We'll reply to your email within 24 hours.",
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contact-company" className="text-xs text-muted-foreground">
                      {t("Empresa (opcional)", "Company (optional)")}
                    </Label>
                    <Input
                      id="contact-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t("Tu empresa o marca", "Your company or brand")}
                      autoComplete="organization"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t("Tema", "Topic")}</Label>
                    <Select
                      value={selectedTopic}
                      onValueChange={(value) => setSelectedTopic(value as Topic)}
                    >
                      <SelectTrigger id="contact-topic" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOPICS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(topicLabels[key][0], topicLabels[key][1])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      "Cuéntanos en qué podemos ayudarte…",
                      "Tell us how we can help…",
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" disabled={sending} className="rounded-full sm:w-auto">
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {t("Enviar mensaje", "Send message")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Te respondemos a tu email, sin spam.",
                      "We reply to your email, no spam.",
                    )}
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
