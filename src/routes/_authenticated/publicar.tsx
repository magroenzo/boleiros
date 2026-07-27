import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Film, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchProfileById } from "@/lib/db";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/publicar")({
  head: () => ({
    meta: [
      { title: "Publicar no Boleiros" },
      { name: "description", content: "Publique fotos, vídeos e lances das suas partidas." },
      { property: "og:title", content: "Publicar no Boleiros" },
      { property: "og:description", content: "Publique fotos, vídeos e lances das suas partidas." },
    ],
  }),
  component: PublicarPage,
});

function PublicarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchProfileById(user!.id),
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login");
      let mediaPath: string | null = null;
      let mediaType = "text";
      if (file) {
        mediaPath = await uploadMedia(user.id, file);
        mediaType = file.type.startsWith("video") ? "video" : "image";
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        caption: caption.trim() || null,
        media_url: mediaPath,
        media_type: mediaType,
        city: profile.data?.city ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Publicado!");
      void navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  return (
    <AppShell title="Nova publicação">
      <div className="space-y-5 p-4">
        <label className="grid aspect-[4/3] w-full cursor-pointer place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-card">
          {preview ? (
            file?.type.startsWith("video") ? (
              <video src={preview} className="h-full w-full object-cover" muted playsInline loop />
            ) : (
              <img src={preview} alt="Prévia" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <span className="flex gap-2">
                <ImagePlus className="h-6 w-6" />
                <Film className="h-6 w-6" />
              </span>
              Toque para escolher foto ou vídeo
            </span>
          )}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onPick} />
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Conte como foi o lance..."
          className="w-full rounded-3xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        />

        <Button
          variant="hero"
          size="xl"
          disabled={publish.isPending || (!caption.trim() && !file)}
          onClick={() => publish.mutate()}
        >
          {publish.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publicar
        </Button>
      </div>
    </AppShell>
  );
}