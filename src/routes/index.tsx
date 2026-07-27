import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Zap } from "lucide-react";

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
      { property: "og:title", content: "Boleiros — feed do futebol amador" },
      {
        property: "og:description",
        content: "Gols, assistências e partidas dos jogadores que você segue.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const feed = useQuery({ queryKey: ["posts", "feed"], queryFn: fetchFeed, enabled: !!user });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Landing />;

  return (
    <AppShell
      action={
        <Button asChild size="sm" variant="soft">
          <Link to="/partida/nova">
            <Zap className="h-4 w-4" /> Partida
          </Link>
        </Button>
      }
    >
      {feed.isLoading && (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {feed.data?.length === 0 && (
        <div className="px-6 py-20 text-center">
          <h2 className="text-lg font-bold">O campo está vazio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Publique seu primeiro lance e comece a montar sua carreira.
          </p>
          <Button asChild className="mt-6">
            <Link to="/publicar">Publicar agora</Link>
          </Button>
        </div>
      )}
      {feed.data?.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} />)}
    </AppShell>
  );
}

function Landing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-5xl font-extrabold leading-[0.95]">
        Boleiros<span className="text-primary">.</span>
      </h1>
      <p className="text-sm text-muted-foreground">
        A rede social exclusiva do futebol amador. Registre partidas, gols e assistências — e
        transforme suas peladas em estatísticas de verdade.
      </p>
      <Button asChild variant="hero" size="xl">
        <Link to="/auth">Entrar no Boleiros</Link>
      </Button>
    </div>
  );
}
