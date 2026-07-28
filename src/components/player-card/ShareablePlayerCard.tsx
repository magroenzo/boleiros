import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ShareablePlayerCardProps = {
  fullName: string;
  username?: string;
  avatarUrl?: string | null;
  position?: string | null;
  city?: string | null;
  state?: string | null;
  overall?: number;
  matches?: number;
  goals?: number;
  assists?: number;
  mvps?: number;
};

export function ShareablePlayerCard({
  fullName,
  username,
  avatarUrl,
  position,
  city,
  state,
  overall = 70,
  matches = 0,
  goals = 0,
  assists = 0,
  mvps = 0,
}: ShareablePlayerCardProps) {
  const location = [city, state].filter(Boolean).join(" • ");

  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShareCard() {
    if (!cardRef.current) return;

    setSharing(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const file = new File(
        [blob],
        `${username || "jogador"}-boleiros.png`,
        {
          type: "image/png",
        }
      );

      if (
        navigator.share &&
        navigator.canShare?.({
          files: [file],
        })
      ) {
        await navigator.share({
          title: "Meu Card do Boleiros",
          text: `Confira meu card no Boleiros!`,
          files: [file],
        });

        return;
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${username || "jogador"}-boleiros.png`;
      link.click();

      toast.success("Card baixado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível compartilhar o card.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div
          ref={cardRef}
          id="shareable-player-card"
          className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-yellow-400/40 bg-gradient-to-b from-zinc-800 via-zinc-950 to-black text-white shadow-2xl"
        >
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />

          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col p-6">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-400">
                  Boleiros
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Carta oficial do jogador
                </p>
              </div>

              <div className="text-right">
                <p className="text-5xl font-black leading-none text-yellow-400">
                  {overall}
                </p>

                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {position || "JOG"}
                </p>
              </div>
            </header>

            <div className="mt-5 flex flex-1 items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 scale-110 rounded-full bg-yellow-400/20 blur-2xl" />

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    crossOrigin="anonymous"
                    className="relative h-48 w-48 rounded-full border-4 border-yellow-400 object-cover shadow-xl"
                  />
                ) : (
                  <div className="relative grid h-48 w-48 place-items-center rounded-full border-4 border-yellow-400 bg-zinc-800 text-6xl font-black text-yellow-400 shadow-xl">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <section className="text-center">
              <h2 className="truncate text-2xl font-black uppercase">
                {fullName}
              </h2>

              {username && (
                <p className="mt-1 text-sm text-yellow-400">@{username}</p>
              )}

              {location && (
                <p className="mt-1 text-sm text-zinc-400">{location}</p>
              )}
            </section>

            <section className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
              <PlayerStat label="Jogos" value={matches} />
              <PlayerStat label="Gols" value={goals} />
              <PlayerStat label="Assist." value={assists} />
              <PlayerStat label="MVPs" value={mvps} />
            </section>

            <footer className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
              <span>Mostre seu futebol</span>
              <span>boleiros.app</span>
            </footer>
          </div>
        </div>

        <Button
          type="button"
          className="mt-4 w-full"
          onClick={handleShareCard}
          disabled={sharing}
        >
          {sharing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando card...
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Card
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PlayerStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <p className="text-xl font-black text-yellow-400">{value}</p>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}