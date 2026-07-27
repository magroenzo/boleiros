import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { PlayerAvatar } from "@/components/SignedImage";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar jogadores e times — Boleiros" },
      {
        name: "description",
        content: "Encontre jogadores, times, campeonatos e cidades no futebol amador.",
      },
      { property: "og:title", content: "Buscar jogadores e times — Boleiros" },
      {
        property: "og:description",
        content: "Encontre jogadores, times, campeonatos e cidades no futebol amador.",
      },
    ],
  }),
  component: BuscarPage,
});

const filters = ["Jogadores", "Times", "Cidades", "Campeonatos"] as const;
type Filter = (typeof filters)[number];

function BuscarPage() {
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("Jogadores");

  const results = useQuery({
    queryKey: ["search", filter, term],
    queryFn: async () => {
      const like = `%${term}%`;
      if (filter === "Times") {
        const { data } = await supabase
          .from("teams")
          .select("id, name, city, crest_url")
          .ilike("name", like)
          .limit(30);
        return { kind: "teams" as const, rows: data ?? [] };
      }
      if (filter === "Cidades") {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, city")
          .ilike("city", like)
          .limit(30);
        return { kind: "players" as const, rows: data ?? [] };
      }
      if (filter === "Campeonatos") {
        return { kind: "empty" as const, rows: [] };
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, city")
        .or(`username.ilike.${like},full_name.ilike.${like}`)
        .limit(30);
      return { kind: "players" as const, rows: data ?? [] };
    },
  });

  return (
    <AppShell title="Buscar">
      <div className="space-y-4 p-4">
        <div className="flex h-12 items-center gap-2 rounded-full border border-border bg-card px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Jogadores, times, cidades..."
            className="h-full flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors",
                filter === f ? "gradient-pitch border-transparent text-primary-foreground" : "bg-card",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {results.data?.kind === "empty" && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Campeonatos chegam em breve no Boleiros.
          </p>
        )}

        {results.data?.kind === "players" && (
          <ul className="divide-y divide-border">
            {results.data.rows.map((p) => (
              <li key={p.id}>
                <Link
                  to="/jogador/$username"
                  params={{ username: p.username }}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3"
                >
                  <PlayerAvatar path={p.avatar_url} name={p.full_name || p.username} className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.full_name || p.username}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{p.username}
                      {p.city ? ` · ${p.city}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {results.data?.kind === "teams" && (
          <ul className="divide-y divide-border">
            {results.data.rows.map((t) => (
              <li key={t.id}>
                <Link
                  to="/time/$teamId"
                  params={{ teamId: t.id }}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3"
                >
                  <PlayerAvatar path={t.crest_url} name={t.name} className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.city ?? "—"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {results.data && results.data.rows.length === 0 && results.data.kind !== "empty" && (
          <p className="py-16 text-center text-sm text-muted-foreground">Nenhum resultado.</p>
        )}
      </div>
    </AppShell>
  );
}