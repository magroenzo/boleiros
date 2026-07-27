import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMatches, fetchPostsByAuthor, fetchProfileById, type Profile } from "@/lib/db";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Boleiros" },
      { name: "description", content: "Seus dados, estatísticas e publicações no Boleiros." },
      { property: "og:title", content: "Meu perfil — Boleiros" },
      { property: "og:description", content: "Seus dados, estatísticas e publicações." },
    ],
  }),
  component: PerfilPage,
});

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary";

function PerfilPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchProfileById(user!.id),
  });
  const matches = useQuery({
    queryKey: ["matches", user?.id],
    enabled: !!user,
    queryFn: () => fetchMatches(user!.id),
  });
  const posts = useQuery({
    queryKey: ["posts", "author", user?.id],
    enabled: !!user,
    queryFn: () => fetchPostsByAuthor(user!.id),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  if (!profile.data) {
    return (
      <AppShell title="Perfil">
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Meu perfil"
      action={
        <div className="flex gap-2">
          <Button size="icon" variant="soft" onClick={() => setEditing(true)} aria-label="Editar perfil">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={signOut} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {editing ? (
        <EditProfile
          profile={profile.data}
          onDone={() => {
            setEditing(false);
            void qc.invalidateQueries({ queryKey: ["profile"] });
          }}
        />
      ) : (
        <>
          <ProfileHeader profile={profile.data} matches={matches.data ?? []} />
          <div className="mt-6 border-t border-border">
            {posts.data?.map((p) => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
            {posts.data?.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Você ainda não publicou nada.
              </p>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

function EditProfile({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [form, setForm] = useState(profile);
  const [avatar, setAvatar] = useState<File | null>(null);

  useEffect(() => setForm(profile), [profile]);

  const save = useMutation({
    mutationFn: async () => {
      let avatarPath = form.avatar_url;
      if (avatar) avatarPath = await uploadMedia(profile.id, avatar);
      const { error } = await supabase
        .from("profiles")
        .update({
          username: form.username,
          full_name: form.full_name,
          city: form.city,
          birth_date: form.birth_date || null,
          height_cm: form.height_cm,
          weight_kg: form.weight_kg,
          dominant_foot: form.dominant_foot,
          position: form.position,
          bio: form.bio,
          titles: form.titles,
          avatar_url: avatarPath,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <label className="block cursor-pointer rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {avatar ? avatar.name : "Trocar foto de perfil"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
        />
      </label>
      <input
        className={fieldClass}
        placeholder="Nome completo"
        value={form.full_name ?? ""}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <input
        className={fieldClass}
        placeholder="Usuário"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <input
        className={fieldClass}
        placeholder="Cidade"
        value={form.city ?? ""}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          className={fieldClass}
          value={form.birth_date ?? ""}
          onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
        />
        <select
          className={fieldClass}
          value={form.dominant_foot ?? ""}
          onChange={(e) => setForm({ ...form, dominant_foot: e.target.value })}
        >
          <option value="">Pé dominante</option>
          <option value="direito">Direito</option>
          <option value="esquerdo">Esquerdo</option>
          <option value="ambidestro">Ambidestro</option>
        </select>
        <input
          type="number"
          className={fieldClass}
          placeholder="Altura (cm)"
          value={form.height_cm ?? ""}
          onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })}
        />
        <input
          type="number"
          className={fieldClass}
          placeholder="Peso (kg)"
          value={form.weight_kg ?? ""}
          onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })}
        />
        <select
          className={fieldClass}
          value={form.position ?? ""}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        >
          <option value="">Posição</option>
          {["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Ponta", "Atacante"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={fieldClass}
          placeholder="Títulos"
          value={form.titles}
          onChange={(e) => setForm({ ...form, titles: Number(e.target.value) })}
        />
      </div>
      <textarea
        rows={3}
        className="w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        placeholder="Biografia"
        value={form.bio ?? ""}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
      />
      <div className="flex gap-3">
        <Button type="button" variant="soft" size="lg" className="flex-1" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="hero" size="lg" className="flex-1" disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}