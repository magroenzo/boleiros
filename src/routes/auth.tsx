import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Apple, Loader2, Mail } from "lucide-react";

import heroImage from "@/assets/auth-hero.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no Boleiros" },
      {
        name: "description",
        content: "Crie sua conta no Boleiros e comece a registrar seus gols, assistências e partidas.",
      },
      { property: "og:title", content: "Entrar no Boleiros" },
      {
        property: "og:description",
        content: "Crie sua conta e comece a registrar seus gols, assistências e partidas.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo ao Boleiros.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com " + provider);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-end overflow-hidden">
      <img
        src={heroImage}
        alt="Jogador comemorando gol em campo iluminado"
        width={1080}
        height={1440}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="gradient-fade absolute inset-0" />
      <div className="absolute inset-0 bg-background/45" />

      <div className="relative mx-auto w-full max-w-md px-6 pb-10 pt-24">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95]">
          Boleiros<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          A rede social do futebol amador. Seus gols, suas partidas, sua história.
        </p>

        <div className="mt-8 space-y-3">
          <Button variant="hero" size="xl" onClick={() => oauth("google")}>
            <Mail className="h-4 w-4" /> Continuar com Google
          </Button>
          <Button variant="soft" size="xl" onClick={() => oauth("apple")}>
            <Apple className="h-4 w-4" /> Continuar com Apple
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou com e-mail
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="h-13 w-full rounded-full border border-border bg-card/80 px-5 text-sm outline-none backdrop-blur focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="h-13 w-full rounded-full border border-border bg-card/80 px-5 text-sm outline-none backdrop-blur focus:border-primary"
          />
          <Button type="submit" size="xl" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-5 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "login" ? (
            <>
              Não tem conta? <span className="font-bold text-primary">Cadastre-se</span>
            </>
          ) : (
            <>
              Já tem conta? <span className="font-bold text-primary">Entrar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}