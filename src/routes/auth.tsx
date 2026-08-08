import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { LanguageToggle, useLanguage } from "@/hooks/use-language";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { mode: "login" | "signup" };

// Google nos devuelve nombre, email, teléfono y foto para construir el perfil.
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/user.phonenumbers.read",
].join(" ");

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search['mode'] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — WhatsYournumber" },
      {
        name: "description",
        content: "Inicia sesión o crea tu cuenta de WhatsYournumber / Sign in or create your WhatsYournumber account.",
      },
      { property: "og:title", content: "Sign in — WhatsYournumber" },
      { property: "og:description", content: "Patrimonio, gastos e inversiones con IA en un solo lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.16 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: mode === "signup" ? "/onboarding" : "/dashboard" });
  }, [loading, user, navigate, mode]);

  const setMode = (next: "login" | "signup") => navigate({ to: "/auth", search: { mode: next } });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth.toast.signup"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.toast.login"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.toast.error"));
    } finally {
      setBusy(false);
    }
  };

  const onOAuth = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { scope: GOOGLE_SCOPES, prompt: "consent select_account" },
    });
    if (result.error) {
      toast.error(t("auth.toast.oauth"));
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.back")}
          </Link>
          <LanguageToggle />
        </div>

        <div className="surface p-7">
          <div className="flex flex-col items-center text-center">
            <BrandLogo className="h-9 w-9" />
            <p className="mt-3 font-display text-lg font-semibold tracking-tight">
              {mode === "signup" ? t("auth.title.signup") : t("auth.title.login")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "signup" ? t("auth.subtitle.signup") : t("auth.subtitle.login")}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-elevated/60 p-1 text-xs">
            {(["login", "signup"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "login" ? t("auth.login") : t("auth.signup")}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
            {mode === "signup" && (
              <div>
                <Label htmlFor="fullName" className="text-xs text-muted-foreground">
                  {t("auth.name")}
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Oscar Martínez"
                  className="mt-1.5 rounded-xl"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1.5 rounded-xl"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                {t("auth.password")}
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 rounded-xl"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? t("auth.submit.signup") : t("auth.submit.login")}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{t("auth.or")}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 rounded-full bg-background"
            onClick={() => void onOAuth()}
            disabled={busy}
          >
            <GoogleMark />
            {t("auth.google")}
          </Button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("auth.google.note")}
          </p>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">{t("auth.legal")}</p>
        </div>
      </motion.div>
    </div>
  );
}
