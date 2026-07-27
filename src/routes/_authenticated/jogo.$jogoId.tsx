import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  Clock3,
  Goal,
  MapPin,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  CURRENT_USER_ID,
  getMockMatchById,
  joinMockMatch,
  leaveMockMatch,
  updateParticipantStatus,
  type MatchPosition,
  type MockMatch,
} from "@/lib/mockMatches";

export const Route = createFileRoute("/_authenticated/jogo/$jogoId")({
  component: MatchDetailsPage,
});

const positionLabels: Record<MatchPosition, string> = {
  goalkeeper: "Goleiro",
  defender: "Defensor",
  midfielder: "Meia",
  forward: "Atacante",
  any: "Qualquer posição",
};

function MatchDetailsPage() {
  const { jogoId } = Route.useParams();
  const [match, setMatch] = useState<MockMatch | null>(() =>
    getMockMatchById(jogoId),
  );

  const currentParticipant = useMemo(
    () => match?.participants.find((participant) => participant.isCurrentUser),
    [match],
  );

  const isOrganizer = match?.organizer.id === CURRENT_USER_ID;

  const pendingPlayers = useMemo(
    () =>
      match?.participants.filter(
        (participant) => participant.status === "pending",
      ) ?? [],
    [match],
  );

  const acceptedPlayers = useMemo(
    () =>
      match?.participants.filter(
        (participant) => participant.status === "accepted",
      ) ?? [],
    [match],
  );

  const totalVacancies = useMemo(
    () =>
      match
        ? Object.values(match.vacancies).reduce(
            (total, quantity) => total + quantity,
            0,
          )
        : 0,
    [match],
  );

  if (!match) {
    return (
      <AppShell title="Partida">
        <main className="mx-auto w-full max-w-2xl p-4">
          <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
            <Goal className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-3 text-lg font-bold">Partida não encontrada</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Essa partida pode ter sido removida ou não existe neste navegador.
            </p>

            <Button asChild className="mt-5">
              <Link to="/jogo/novo">Criar uma partida</Link>
            </Button>
          </section>
        </main>
      </AppShell>
    );
  }

  function handleJoin() {
    try {
      setMatch(joinMockMatch(jogoId));
      toast.success("Pedido enviado ao organizador.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível participar.",
      );
    }
  }

  function handleLeave() {
    try {
      setMatch(leaveMockMatch(jogoId));
      toast.success("Pedido cancelado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível cancelar.",
      );
    }
  }

  function handleStatus(
    participantId: string,
    status: "accepted" | "rejected",
  ) {
    try {
      setMatch(updateParticipantStatus(jogoId, participantId, status));
      toast.success(
        status === "accepted"
          ? "Jogador confirmado na partida."
          : "Solicitação recusada.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a solicitação.",
      );
    }
  }

  return (
    <AppShell title="Detalhes da partida">
      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 pb-28">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-primary/10 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Goal className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {match.modality} • {match.level}
                </p>
                <h1 className="mt-1 text-xl font-bold text-foreground">
                  {match.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Organizado por @{match.organizer.username}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Info
              icon={CalendarDays}
              label="Data"
              value={formatDate(match.matchDate)}
            />
            <Info
              icon={Clock3}
              label="Horário"
              value={`${match.startTime} até ${match.endTime}`}
            />
            <Info icon={MapPin} label="Local" value={match.location} />
            <Info icon={MapPin} label="Cidade" value={match.city} />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Vagas disponíveis</h2>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {Object.entries(match.vacancies)
              .filter(([, quantity]) => quantity > 0)
              .map(([position, quantity]) => (
                <div
                  key={position}
                  className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-primary" />
                    {positionLabels[position as MatchPosition]}
                  </span>
                  <strong>{quantity}</strong>
                </div>
              ))}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {totalVacancies} vaga(s) restante(s).
          </p>
        </section>

        {isOrganizer && (
          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Solicitações</h2>
                <p className="text-xs text-muted-foreground">
                  {pendingPlayers.length} aguardando resposta
                </p>
              </div>

              <UserRound className="h-5 w-5 text-muted-foreground" />
            </div>

            {pendingPlayers.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Nenhuma solicitação pendente.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {pendingPlayers.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-2xl border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {participant.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{participant.username} •{" "}
                          {positionLabels[participant.position]}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                        Pendente
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          handleStatus(participant.id, "rejected")
                        }
                      >
                        <X className="h-4 w-4" />
                        Recusar
                      </Button>

                      <Button
                        type="button"
                        variant="hero"
                        onClick={() =>
                          handleStatus(participant.id, "accepted")
                        }
                      >
                        <Check className="h-4 w-4" />
                        Aceitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Jogadores confirmados</h2>
              <p className="text-xs text-muted-foreground">
                {acceptedPlayers.length} confirmado(s)
              </p>
            </div>

            <Users className="h-5 w-5 text-muted-foreground" />
          </div>

          {acceptedPlayers.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              Ainda não há jogadores confirmados.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {acceptedPlayers.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{participant.username} •{" "}
                      {positionLabels[participant.position]}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Confirmado
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {match.notes && (
          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-bold">Observações</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {match.notes}
            </p>
          </section>
        )}

        {!isOrganizer &&
          (currentParticipant ? (
            <Button
              type="button"
              variant="outline"
              size="xl"
              className="w-full"
              onClick={handleLeave}
            >
              Cancelar pedido
            </Button>
          ) : (
            <Button
              type="button"
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleJoin}
              disabled={totalVacancies === 0}
            >
              <Goal className="h-5 w-5" />
              {totalVacancies === 0 ? "Partida lotada" : "Quero jogar"}
            </Button>
          ))}
      </main>
    </AppShell>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-muted/50 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}