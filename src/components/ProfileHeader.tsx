import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { PlayerAvatar } from "@/components/SignedImage";
import { StatCard } from "@/components/StatCard";
import { aggregateStats, type Match, type Profile } from "@/lib/db";

function age(birth?: string | null) {
  if (!birth) return null;

  const birthDate = new Date(birth);

  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasNotHappened =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (birthdayHasNotHappened) years--;

  return years;
}

function calculateOverall(matches: Match[]) {
  if (matches.length === 0) return 60;

  const stats = aggregateStats(matches);

  const ratings = matches
    .map((match) => match.rating)
    .filter((rating): rating is number => rating !== null);

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
      : 6;

  const goalsPerGame = stats.gols / stats.jogos;
  const assistsPerGame = stats.assistencias / stats.jogos;
  const mvpRate = stats.mvps / stats.jogos;

  const overall =
    55 +
    averageRating * 3 +
    goalsPerGame * 8 +
    assistsPerGame * 6 +
    mvpRate * 10;

  return Math.max(50, Math.min(99, Math.round(overall)));
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
  const overall = calculateOverall(matches);

  const goalParticipations = stats.gols + stats.assistencias;

  const goalParticipationsPerGame =
    stats.jogos > 0 ? (goalParticipations / stats.jogos).toFixed(2) : "0.00";

  const averageRatingValues = matches
    .map((match) => match.rating)
    .filter((rating): rating is number => rating !== null);

  const averageRating =
    averageRatingValues.length > 0
      ? (
          averageRatingValues.reduce((total, rating) => total + rating, 0) /
          averageRatingValues.length
        ).toFixed(1)
      : "—";

  return (
    <section className="space-y-5 px-4 pt-4">
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-card to-card shadow-lift">
        <div className="p-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
            <PlayerAvatar
              path={profile.avatar_url}
              name={profile.full_name || profile.username}
              className="h-24 w-24 text-xl ring-4 ring-primary/60"
            />

            <div className="min-w-0">
              <h1 className="flex min-w-0 items-center gap-1.5 text-xl font-extrabold">
                <span className="truncate">
                  {profile.full_name || profile.username}
                </span>

                {profile.verified && (
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                )}
              </h1>

              <p className="truncate text-sm text-muted-foreground">
                @{profile.username}
              </p>

              <p className="mt-2 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />

                <span className="truncate">
                  {profile.city ?? "Cidade não informada"}
                </span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.position && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    {profile.position}
                  </span>
                )}

                {teamName && (
                  <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold">
                    {teamName}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-[72px] rounded-2xl bg-primary px-3 py-3 text-center text-primary-foreground shadow-lift">
              <p className="font-display text-4xl font-black leading-none">
                {overall}
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/80">
                Overall
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-primary/15 bg-background/30 backdrop-blur-sm">
          <div className="px-3 py-3 text-center">
            <p className="font-display text-lg font-extrabold">
              {profile.position ?? "N/D"}
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Posição
            </p>
          </div>

          <div className="border-x border-primary/15 px-3 py-3 text-center">
            <p className="font-display text-lg font-extrabold">
              {profile.dominant_foot
                ? profile.dominant_foot
                : "N/D"}
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pé dominante
            </p>
          </div>

          <div className="px-3 py-3 text-center">
            <p className="font-display text-lg font-extrabold">
              {years !== null ? years : "N/D"}
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Idade
            </p>
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
          {profile.bio}
        </p>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {[
          profile.height_cm ? `${profile.height_cm} cm` : null,
          profile.weight_kg ? `${profile.weight_kg} kg` : null,
          profile.titles === 1
            ? "1 título"
            : `${profile.titles ?? 0} títulos`,
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

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-extrabold uppercase tracking-wide">
            Estatísticas
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="⚽ Gols" value={stats.gols} highlight />
          <StatCard label="🎯 Assistências" value={stats.assistencias} />
          <StatCard label="🏃 Jogos" value={stats.jogos} />
          <StatCard label="🏆 MVPs" value={stats.mvps} />
          <StatCard label="🟨 Amarelos" value={stats.amarelos} />
          <StatCard label="🟥 Vermelhos" value={stats.vermelhos} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />

          <h2 className="text-sm font-extrabold uppercase tracking-wide">
            Resumo da carreira
          </h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Participações em gols
            </span>

            <strong>{goalParticipations}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Participações por jogo
            </span>

            <strong>{goalParticipationsPerGame}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Média de avaliação
            </span>

            <strong>{averageRating}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Títulos</span>

            <strong>{profile.titles ?? 0}</strong>
          </div>
        </div>
      </div>

      <Link to="/partida/nova" className="block">
        <div className="grid place-items-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
          + Registrar partida
        </div>
      </Link>
    </section>
  );
}