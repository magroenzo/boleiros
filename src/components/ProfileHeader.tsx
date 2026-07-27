import { Link } from "@tanstack/react-router";
import { MapPin, Ruler, ShieldCheck, Weight } from "lucide-react";

import { PlayerAvatar } from "@/components/SignedImage";
import { StatCard } from "@/components/StatCard";
import { aggregateStats, type Match, type Profile } from "@/lib/db";

function age(birth?: string | null) {
  if (!birth) return null;
  const d = new Date(birth);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function ProfileHeader({
  profile,
  matches,
  teamName,
  children,
}: {
  profile: Profile;
  matches: Match[];
  teamName?: string | null;
  children?: React.ReactNode;
}) {
  const stats = aggregateStats(matches);
  const years = age(profile.birth_date);

  return (
    <section className="space-y-5 px-4 pt-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <PlayerAvatar
          path={profile.avatar_url}
          name={profile.full_name || profile.username}
          className="h-20 w-20 text-lg ring-2 ring-primary/50"
        />
        <div className="min-w-0">
          <h1 className="flex min-w-0 items-center gap-1.5 truncate text-xl font-extrabold">
            <span className="truncate">{profile.full_name || profile.username}</span>
            {profile.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />}
          </h1>
          <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
          <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{profile.city ?? "Cidade não informada"}</span>
          </p>
        </div>
      </div>

      {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {[
          profile.position,
          profile.dominant_foot ? `Pé ${profile.dominant_foot}` : null,
          years ? `${years} anos` : null,
          profile.height_cm ? `${profile.height_cm} cm` : null,
          profile.weight_kg ? `${profile.weight_kg} kg` : null,
          teamName,
        ]
          .filter(Boolean)
          .map((chip) => (
            <span
              key={chip as string}
              className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
            >
              {chip}
            </span>
          ))}
      </div>

      {children}

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Gols" value={stats.gols} highlight />
        <StatCard label="Assistências" value={stats.assistencias} />
        <StatCard label="Jogos" value={stats.jogos} />
        <StatCard label="Amarelos" value={stats.amarelos} />
        <StatCard label="Vermelhos" value={stats.vermelhos} />
        <StatCard label="MVPs" value={stats.mvps} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Títulos" value={profile.titles} />
        <Link to="/partida/nova" className="block">
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border bg-card p-3 text-xs font-semibold text-muted-foreground">
            + Registrar partida
          </div>
        </Link>
      </div>

      <div className="hidden">
        <Ruler />
        <Weight />
      </div>
    </section>
  );
}