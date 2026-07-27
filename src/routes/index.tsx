import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Goal,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchFeed } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boleiros — feed do futebol amador" },
      {
        name: "description",
        content:
          "Veja gols, assistências e partidas dos jogadores de futebol amador que você segue no Boleiros.",
      },
      {
        property: "og:title",
        content: "Boleiros — feed do futebol amador",
      },
      {
        property: "og:description",
        content:
          "Gols, assistências e partidas dos jogadores que você segue.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();

  const feed = useQuery({
    queryKey: ["posts", "feed"],
    queryFn: fetchFeed,
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
  });

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <AppShell
      title="Boleiros"
      action={
        <Button asChild size="sm" variant="soft">
          <Link to="/partida/nova">
            <Zap className="h-4 w-4" />
            Partida
          </Link>
        </Button>
      }
    >
      <main className="mx-auto w-full max-w-2xl pb-24">
        <FeedHeader />

        {feed.isLoading && <FeedLoading />}

        {feed.isError && (
          <FeedError
            onRetry={() => {
              void feed.refetch();
            }}
          />
        )}

        {!feed.isLoading && !feed.isError && feed.data?.length === 0 && (
          <EmptyFeed />
        )}

        {!feed.isLoading && !feed.isError && Boolean(feed.data?.length) && (
          <section className="space-y-3 px-3 py-4 sm:px-4">
            {feed.data?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user.id}
              />
            ))}
          </section>
        )}
      </main>
    </AppShell>
  );
}

function FeedHeader() {
  return (
    <section className="border-b border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Seu futebol
          </p>

          <h1 className="mt-1 text-xl font-bold text-foreground">
            O que está rolando no campo
          </h1>
        </div>

        <Button asChild size="icon" variant="outline" aria-label="Buscar">
          <Link to="/buscar">
            <Search className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
  <QuickAction
    to="/publicar"
    icon={<Plus className="h-4 w-4" />}
    label="Publicar"
  />

  <QuickAction
    to="/jogo/novo"
    icon={<Goal className="h-4 w-4" />}
    label="Criar partida"
  />
</div>
    </section>
  );
}

function QuickAction({
  to,
  icon,
  label,
}: {
  to: "/publicar" | "/jogo/novo";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </Link>
  );
}

function FeedLoading() {
  return (
    <div className="space-y-4 px-4 py-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-3xl border border-border bg-card"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="aspect-square w-full animate-pulse bg-muted" />

          <div className="space-y-3 p-4">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-foreground">
        Não foi possível carregar o feed
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Verifique sua conexão e tente novamente.
      </p>

      <Button className="mt-6" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
        <span className="text-4xl">⚽</span>
      </div>

      <h2 className="mt-6 text-xl font-bold text-foreground">
        O campo está vazio
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Publique seu primeiro lance ou encontre jogadores para começar a montar
        seu feed.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="hero">
          <Link to="/publicar">
            <Plus className="h-4 w-4" />
            Publicar agora
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link to="/buscar">
            <Search className="h-4 w-4" />
            Buscar jogadores
          </Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
          <span className="text-3xl">⚽</span>
        </div>

        <Loader2 className="h-6 w-6 animate-spin text-primary" />

        <p className="text-sm text-muted-foreground">
          Preparando o seu feed...
        </p>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/15 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full border border-primary/20 bg-primary/10 shadow-xl shadow-primary/10">
          <span className="text-5xl">⚽</span>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Futebol amador conectado
        </p>

        <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-foreground">
          Boleiros<span className="text-primary">.</span>
        </h1>

        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Registre suas partidas, publique gols e assistências e transforme
          cada pelada em uma história para compartilhar.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <LandingFeature icon="⚽" label="Lances" />
          <LandingFeature icon="🏆" label="Partidas" />
          <LandingFeature icon="📊" label="Estatísticas" />
        </div>

        <Button asChild variant="hero" size="xl" className="mt-8 w-full">
          <Link to="/auth">
            Entrar no Boleiros
          </Link>
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Sua carreira no futebol começa aqui.
        </p>
      </div>
    </main>
  );
}

function LandingFeature({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-xs font-medium text-foreground">{label}</p>
    </div>
  );
}