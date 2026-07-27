import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Plus,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/disponibilidade")({
  head: () => ({
    meta: [
      { title: "Minha disponibilidade — Boleiros" },
      {
        name: "description",
        content:
          "Cadastre os dias e horários em que você está disponível para jogar futebol.",
      },
    ],
  }),
  component: DisponibilidadePage,
});

type AvailabilityItem = {
  id: string;
  weekday: string;
  startTime: string;
  endTime: string;
  city: string;
  modality: string;
  position: string;
  active: boolean;
};

const weekdays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const modalities = ["Campo", "Society", "Futsal"];

const positions = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
  "Qualquer posição",
];

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

function DisponibilidadePage() {
  const [weekday, setWeekday] = useState("Terça-feira");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [city, setCity] = useState("");
  const [modality, setModality] = useState("Society");
  const [position, setPosition] = useState("Atacante");

  const [items, setItems] = useState<AvailabilityItem[]>([]);

  const activeCount = useMemo(
    () => items.filter((item) => item.active).length,
    [items],
  );

  function addAvailability() {
    if (!city.trim()) {
      toast.error("Informe a cidade.");
      return;
    }

    if (startTime >= endTime) {
      toast.error("O horário final deve ser maior que o horário inicial.");
      return;
    }

    const item: AvailabilityItem = {
      id: crypto.randomUUID(),
      weekday,
      startTime,
      endTime,
      city: city.trim(),
      modality,
      position,
      active: true,
    };

    setItems((current) => [...current, item]);
    toast.success("Horário adicionado.");
  }

  function removeAvailability(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    toast.success("Horário removido.");
  }

  function toggleAvailability(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item,
      ),
    );
  }

  function saveAll() {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um horário.");
      return;
    }

    toast.success(
      "Disponibilidades preparadas. A conexão com o banco será feita depois.",
    );
  }

  return (
    <AppShell title="Minha disponibilidade">
      <main className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-28">
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-foreground">
                Quando você pode jogar?
              </h1>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Cadastre os dias e horários em que organizadores podem encontrar
                e convidar você para partidas.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">
              Adicionar disponibilidade
            </h2>
          </div>

          <Labeled label="Dia da semana">
            <select
              value={weekday}
              onChange={(event) => setWeekday(event.target.value)}
              className={fieldClass}
            >
              {weekdays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </Labeled>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Horário inicial">
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={fieldClass}
              />
            </Labeled>

            <Labeled label="Horário final">
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={fieldClass}
              />
            </Labeled>
          </div>

          <Labeled label="Cidade">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ex.: Carlos Barbosa"
                className={`${fieldClass} pl-11`}
              />
            </div>
          </Labeled>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Modalidade">
              <select
                value={modality}
                onChange={(event) => setModality(event.target.value)}
                className={fieldClass}
              >
                {modalities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Posição">
              <select
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                className={fieldClass}
              >
                {positions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Labeled>
          </div>

          <Button
            type="button"
            variant="hero"
            size="xl"
            className="w-full"
            onClick={addAvailability}
          >
            <Plus className="h-5 w-5" />
            Adicionar horário
          </Button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-bold text-foreground">
                Horários cadastrados
              </h2>

              <p className="text-xs text-muted-foreground">
                {activeCount} horário(s) ativo(s)
              </p>
            </div>
          </div>

          {items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Clock3 className="mx-auto h-10 w-10 text-muted-foreground" />

              <h3 className="mt-4 font-bold text-foreground">
                Nenhum horário adicionado
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Adicione os horários em que você normalmente está disponível
                para jogar.
              </p>
            </div>
          )}

          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-3xl border bg-card p-4 shadow-sm transition ${
                item.active
                  ? "border-primary/30"
                  : "border-border opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground">
                      {item.weekday}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        item.active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.active ? "Ativo" : "Desativado"}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {item.startTime} até {item.endTime}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {item.city}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {item.modality}
                    </span>

                    <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      <Shield className="h-3.5 w-3.5" />
                      {item.position}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeAvailability(item.id)}
                  aria-label="Remover horário"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleAvailability(item.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/5"
              >
                {item.active ? (
                  <>
                    <Check className="h-4 w-4 text-primary" />
                    Disponibilidade ativa
                  </>
                ) : (
                  <>
                    <Clock3 className="h-4 w-4" />
                    Ativar disponibilidade
                  </>
                )}
              </button>
            </article>
          ))}
        </section>

        {items.length > 0 && (
          <Button
            type="button"
            variant="hero"
            size="xl"
            className="w-full"
            onClick={saveAll}
          >
            <Save className="h-5 w-5" />
            Salvar disponibilidades
          </Button>
        )}
      </main>
    </AppShell>
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