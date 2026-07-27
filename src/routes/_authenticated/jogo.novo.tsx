import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock3,
  Goal,
  MapPin,
  Minus,
  Plus,
  Search,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { createMockMatch } from "@/lib/mockMatches";

export const Route = createFileRoute("/_authenticated/jogo/novo")({
  head: () => ({
    meta: [
      { title: "Organizar jogo — Boleiros" },
      {
        name: "description",
        content:
          "Organize uma partida, informe as vagas necessárias e encontre jogadores disponíveis.",
      },
    ],
  }),
  component: NovoJogoPage,
});

type PositionKey =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward"
  | "any";

type PositionVacancies = Record<PositionKey, number>;

type SuggestedPlayer = {
  id: string;
  name: string;
  username: string;
  position: string;
  rating: number;
  city: string;
  availableFrom: string;
  availableUntil: string;
  invited: boolean;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const initialVacancies: PositionVacancies = {
  goalkeeper: 0,
  defender: 0,
  midfielder: 0,
  forward: 0,
  any: 0,
};

const positionLabels: Record<PositionKey, string> = {
  goalkeeper: "Goleiro",
  defender: "Defensor",
  midfielder: "Meia",
  forward: "Atacante",
  any: "Qualquer posição",
};

const suggestedPlayersInitial: SuggestedPlayer[] = [
  {
    id: "1",
    name: "Lucas Ferreira",
    username: "lucasferreira",
    position: "Goleiro",
    rating: 4.8,
    city: "Carlos Barbosa",
    availableFrom: "19:00",
    availableUntil: "22:00",
    invited: false,
  },
  {
    id: "2",
    name: "Mateus Silva",
    username: "mateussilva",
    position: "Atacante",
    rating: 4.6,
    city: "Carlos Barbosa",
    availableFrom: "18:30",
    availableUntil: "23:00",
    invited: false,
  },
  {
    id: "3",
    name: "Rafael Oliveira",
    username: "rafaoliveira",
    position: "Zagueiro",
    rating: 4.7,
    city: "Garibaldi",
    availableFrom: "19:30",
    availableUntil: "22:30",
    invited: false,
  },
];

function NovoJogoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    matchDate: new Date().toISOString().slice(0, 10),
    startTime: "19:30",
    endTime: "21:00",
    location: "",
    city: "",
    modality: "Society",
    level: "Intermediário",
    notes: "",
  });

  const [vacancies, setVacancies] =
    useState<PositionVacancies>(initialVacancies);

  const [players, setPlayers] = useState<SuggestedPlayer[]>(
    suggestedPlayersInitial,
  );

  const [showPlayers, setShowPlayers] = useState(false);

  const totalVacancies = useMemo(
    () => Object.values(vacancies).reduce((total, value) => total + value, 0),
    [vacancies],
  );

  const invitedCount = useMemo(
    () => players.filter((player) => player.invited).length,
    [players],
  );

  function updateVacancy(position: PositionKey, amount: number) {
    setVacancies((current) => ({
      ...current,
      [position]: Math.max(0, current[position] + amount),
    }));
  }

  function validateForm() {
    if (!form.title.trim()) {
      toast.error("Informe um nome para o jogo.");
      return false;
    }

    if (!form.location.trim()) {
      toast.error("Informe o local da partida.");
      return false;
    }

    if (!form.city.trim()) {
      toast.error("Informe a cidade.");
      return false;
    }

    if (!form.matchDate) {
      toast.error("Informe a data da partida.");
      return false;
    }

    if (form.startTime >= form.endTime) {
      toast.error("O horário final deve ser maior que o horário inicial.");
      return false;
    }

    if (totalVacancies === 0) {
      toast.error("Adicione pelo menos uma vaga.");
      return false;
    }

    return true;
  }

  function searchAvailablePlayers() {
    if (!validateForm()) return;

    setShowPlayers(true);
    toast.success("Jogadores disponíveis encontrados.");
  }

  function toggleInvite(playerId: string) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === playerId
          ? { ...player, invited: !player.invited }
          : player,
      ),
    );

    const player = players.find((item) => item.id === playerId);

    if (!player) return;

    toast.success(
      player.invited
        ? `Convite para ${player.name} cancelado.`
        : `Convite enviado para ${player.name}.`,
    );
  }

  async function publishGame() {
    if (!validateForm()) return;

    const match = createMockMatch({
      title: form.title.trim(),
      matchDate: form.matchDate,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      city: form.city.trim(),
      modality: form.modality,
      level: form.level,
      notes: form.notes.trim(),
      vacancies,
    });

    toast.success("Partida criada com sucesso.");

    await navigate({
      to: "/jogo/$jogoId",
      params: { jogoId: match.id },
    });
  }

  return (
    <AppShell title="Organizar jogo">
      <main className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-28">
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Goal className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-foreground">
                Organize uma partida
              </h1>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Informe o horário, o local e as posições que ainda precisam de
                jogadores.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">
              Informações da partida
            </h2>
          </div>

          <Labeled label="Nome do jogo">
            <input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Ex.: Futebol de terça-feira"
              className={fieldClass}
            />
          </Labeled>

          <Labeled label="Data">
            <input
              type="date"
              value={form.matchDate}
              onChange={(event) =>
                setForm({ ...form, matchDate: event.target.value })
              }
              className={fieldClass}
            />
          </Labeled>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Início">
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm({ ...form, startTime: event.target.value })
                }
                className={fieldClass}
              />
            </Labeled>

            <Labeled label="Término">
              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm({ ...form, endTime: event.target.value })
                }
                className={fieldClass}
              />
            </Labeled>
          </div>

          <Labeled label="Local">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="Ex.: Arena Central"
                className={`${fieldClass} pl-11`}
              />
            </div>
          </Labeled>

          <Labeled label="Cidade">
            <input
              value={form.city}
              onChange={(event) =>
                setForm({ ...form, city: event.target.value })
              }
              placeholder="Ex.: Carlos Barbosa"
              className={fieldClass}
            />
          </Labeled>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Modalidade">
              <select
                value={form.modality}
                onChange={(event) =>
                  setForm({ ...form, modality: event.target.value })
                }
                className={fieldClass}
              >
                <option value="Campo">Campo</option>
                <option value="Society">Society</option>
                <option value="Futsal">Futsal</option>
              </select>
            </Labeled>

            <Labeled label="Nível">
              <select
                value={form.level}
                onChange={(event) =>
                  setForm({ ...form, level: event.target.value })
                }
                className={fieldClass}
              >
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
                <option value="Todos os níveis">Todos os níveis</option>
              </select>
            </Labeled>
          </div>

          <Labeled label="Observações">
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Ex.: Levar camiseta branca e preta."
              rows={4}
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </Labeled>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />

              <div>
                <h2 className="font-bold text-foreground">
                  Jogadores necessários
                </h2>

                <p className="text-xs text-muted-foreground">
                  {totalVacancies} vaga(s) no total
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(Object.keys(positionLabels) as PositionKey[]).map((position) => (
              <VacancySelector
                key={position}
                label={positionLabels[position]}
                value={vacancies[position]}
                onDecrease={() => updateVacancy(position, -1)}
                onIncrease={() => updateVacancy(position, 1)}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="xl"
            className="w-full"
            onClick={searchAvailablePlayers}
          >
            <Search className="h-5 w-5" />
            Buscar jogadores disponíveis
          </Button>
        </section>

        {showPlayers && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-bold text-foreground">
                  Jogadores disponíveis
                </h2>

                <p className="text-xs text-muted-foreground">
                  {invitedCount} convite(s) enviado(s)
                </p>
              </div>
            </div>

            {players.map((player) => (
              <article
                key={player.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {player.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-foreground">
                        {player.name}
                      </h3>

                      <p className="truncate text-xs text-muted-foreground">
                        @{player.username}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          <Shield className="h-3.5 w-3.5" />
                          {player.position}
                        </span>

                        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          <Trophy className="h-3.5 w-3.5" />
                          {player.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={player.invited ? "outline" : "hero"}
                    onClick={() => toggleInvite(player.id)}
                  >
                    {player.invited ? "Cancelar" : "Convidar"}
                  </Button>
                </div>

                <div className="mt-4 grid gap-2 rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {player.city}
                  </p>

                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    Disponível das {player.availableFrom} às{" "}
                    {player.availableUntil}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="font-bold text-foreground">Resumo do jogo</h2>

          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Partida:</strong>{" "}
              {form.title || "Não informada"}
            </p>

            <p>
              <strong className="text-foreground">Data:</strong>{" "}
              {form.matchDate || "Não informada"}
            </p>

            <p>
              <strong className="text-foreground">Horário:</strong>{" "}
              {form.startTime} até {form.endTime}
            </p>

            <p>
              <strong className="text-foreground">Modalidade:</strong>{" "}
              {form.modality}
            </p>

            <p>
              <strong className="text-foreground">Vagas:</strong>{" "}
              {totalVacancies}
            </p>

            <p>
              <strong className="text-foreground">Convites:</strong>{" "}
              {invitedCount}
            </p>
          </div>
        </section>

        <Button
          type="button"
          variant="hero"
          size="xl"
          className="w-full"
          onClick={publishGame}
        >
          <Goal className="h-5 w-5" />
          Publicar jogo
        </Button>
      </main>
    </AppShell>
  );
}

function VacancySelector({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
      <span className="text-sm font-semibold text-foreground">{label}</span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value === 0}
          className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Diminuir vagas de ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>

        <span className="w-6 text-center font-bold text-foreground">
          {value}
        </span>

        <button
          type="button"
          onClick={onIncrease}
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
          aria-label={`Aumentar vagas de ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}