import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { PlayerAvatar, SignedImage } from "@/components/SignedImage";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { aggregateStats, type Match } from "@/lib/db";

export const Route = createFileRoute("/time/$teamId")({
  head: () => ({
    meta: [
      { title: "Perfil do time — Boleiros" },
      { name: "description", content: "Escudo, uniforme, elenco e estatísticas do time amador." },
      { property: "og:title", content: "Perfil do time — Boleiros" },
      {
        property: "og:description",
        content: "Escudo, uniforme, elenco e estatísticas do time amador.",
      },
    ],
  }),
  component: TimePage,
});

function TimePage() {
  const { teamId } = Route.useParams();

  const team = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const squad = useQuery({
    queryKey: ["team-squad", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, position")
        .eq("team_id", teamId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const matches = useQuery({
    queryKey: ["team-matches", teamId, squad.data?.length],
    enabled: !!squad.data,
    queryFn: async () => {
      const ids = (squad.data ?? []).map((p) => p.id);
      if (ids.length === 0) return [] as Match[];
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .in("player_id", ids)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Match[];
    },
  });

  if (team.isLoading) {
    return (
      <AppShell title="Time">
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!team.data) {
    return (
      <AppShell title="Time">
        <p className="px-6 py-24 text-center text-sm text-muted-foreground">Time não encontrado.</p>
      </AppShell>
    );
  }

  const stats = aggregateStats(matches.data ?? []);

  return (
    <AppShell title={team.data.name}>
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <PlayerAvatar path={team.data.crest_url} name={team.data.name} className="h-20 w-20 text-lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">{team.data.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{team.data.city ?? "—"}</p>
          </div>
        </div>

        {team.data.kit_url && (
          <SignedImage
            path={team.data.kit_url}
            alt={`Uniforme do ${team.data.name}`}
            className="h-48 w-full rounded-3xl object-cover"
          />
        )}

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Jogos" value={stats.jogos} highlight />
          <StatCard label="Gols" value={stats.gols} />
          <StatCard label="Assistências" value={stats.assistencias} />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Elenco
          </h2>
          <ul className="divide-y divide-border">
            {squad.data?.map((p) => (
              <li key={p.id}>
                <Link
                  to="/jogador/$username"
                  params={{ username: p.username }}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3"
                >
                  <PlayerAvatar path={p.avatar_url} name={p.full_name || p.username} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.full_name || p.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.position ?? "Jogador"}</p>
                  </div>
                </Link>
              </li>
            ))}
            {squad.data?.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nenhum jogador vinculado ainda.
              </li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Últimos jogos
          </h2>
          <ul className="space-y-2">
            {matches.data?.slice(0, 10).map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">vs {m.opponent}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(m.match_date).toLocaleDateString("pt-BR")}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-primary">{m.result ?? "—"}</span>
              </li>
            ))}
            {matches.data?.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">Sem jogos registrados.</li>
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}