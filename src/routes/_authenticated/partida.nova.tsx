import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/partida/nova")({
  head: () => ({
    meta: [
      { title: "Registrar partida — Boleiros" },
      {
        name: "description",
        content: "Cadastre adversário, resultado, gols, assistências e nota da sua partida.",
      },
      { property: "og:title", content: "Registrar partida — Boleiros" },
      {
        property: "og:description",
        content: "Cadastre adversário, resultado, gols, assistências e nota da sua partida.",
      },
    ],
  }),
  component: NovaPartida,
});

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary";

function NovaPartida() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    opponent: "",
    match_date: new Date().toISOString().slice(0, 10),
    location: "",
    result: "",
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    mvp: false,
    rating: 7,
  });
  const [file, setFile] = useState<File | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login");
      const { data, error } = await supabase
        .from("matches")
        .insert({ ...form, player_id: user.id })
        .select("id")
        .single();
      if (error) throw error;

      let mediaPath: string | null = null;
      let mediaType = "text";
      if (file) {
        mediaPath = await uploadMedia(user.id, file);
        mediaType = file.type.startsWith("video") ? "video" : "image";
      }
      const { error: postError } = await supabase.from("posts").insert({
        author_id: user.id,
        match_id: data.id,
        media_url: mediaPath,
        media_type: mediaType,
        city: form.location || null,
        caption: `Partida contra ${form.opponent} — ${form.result || "resultado não informado"} · ${form.goals} gol(s), ${form.assists} assistência(s)`,
      });
      if (postError) throw postError;
    },
    onSuccess: () => {
      toast.success("Partida registrada!");
      void navigate({ to: "/perfil" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const num = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: Number(e.target.value) });

  return (
    <AppShell title="Registrar partida">
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <input
          required
          className={fieldClass}
          placeholder="Adversário"
          value={form.opponent}
          onChange={(e) => setForm({ ...form, opponent: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            className={fieldClass}
            value={form.match_date}
            onChange={(e) => setForm({ ...form, match_date: e.target.value })}
          />
          <input
            className={fieldClass}
            placeholder="Resultado (3x1)"
            value={form.result}
            onChange={(e) => setForm({ ...form, result: e.target.value })}
          />
        </div>
        <input
          className={fieldClass}
          placeholder="Local"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Gols">
            <input type="number" min={0} className={fieldClass} value={form.goals} onChange={num("goals")} />
          </Labeled>
          <Labeled label="Assistências">
            <input type="number" min={0} className={fieldClass} value={form.assists} onChange={num("assists")} />
          </Labeled>
          <Labeled label="Cartões amarelos">
            <input type="number" min={0} className={fieldClass} value={form.yellow_cards} onChange={num("yellow_cards")} />
          </Labeled>
          <Labeled label="Cartões vermelhos">
            <input type="number" min={0} className={fieldClass} value={form.red_cards} onChange={num("red_cards")} />
          </Labeled>
        </div>

        <Labeled label={`Nota da partida — ${form.rating}`}>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={form.rating}
            onChange={num("rating")}
            className="w-full accent-[var(--primary)]"
          />
        </Labeled>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.mvp}
            onChange={(e) => setForm({ ...form, mvp: e.target.checked })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Fui o craque da partida (MVP)
        </label>

        <label className="block cursor-pointer rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {file ? file.name : "Adicionar foto ou vídeo da partida"}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <Button type="submit" variant="hero" size="xl" disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar partida
        </Button>
      </form>
    </AppShell>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}