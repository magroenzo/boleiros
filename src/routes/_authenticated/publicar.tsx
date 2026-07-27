import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Camera,
  Film,
  ImagePlus,
  Loader2,
  MapPin,
  Trash2,
  UploadCloud,
} from "lucide-react";
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
      {
        name: "description",
        content: "Publique fotos, vídeos e lances das suas partidas.",
      },
      { property: "og:title", content: "Publicar no Boleiros" },
      {
        property: "og:description",
        content: "Publique fotos, vídeos e lances das suas partidas.",
      },
    ],
  }),
  component: PublicarPage,
});

const MAX_CAPTION_LENGTH = 500;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function PublicarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchProfileById(user!.id),
  });

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Você precisa entrar na sua conta para publicar.");
      }

      if (!caption.trim() && !file) {
        throw new Error("Adicione uma foto, um vídeo ou uma legenda.");
      }

      let mediaPath: string | null = null;
      let mediaType = "text";

      if (file) {
        mediaPath = await uploadMedia(user.id, file);
        mediaType = file.type.startsWith("video/") ? "video" : "image";
      }

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        caption: caption.trim() || null,
        media_url: mediaPath,
        media_type: mediaType,
        city: profile.data?.city ?? null,
      });

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      toast.success("Publicação feita com sucesso! ⚽");
      void navigate({ to: "/" });
    },

    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível publicar.");
    },
  });

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Escolha uma imagem ou um vídeo.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("O arquivo deve ter no máximo 50 MB.");
      event.target.value = "";
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  function removeFile() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const canPublish =
    Boolean(caption.trim() || file) &&
    caption.length <= MAX_CAPTION_LENGTH &&
    !publish.isPending;

  return (
    <AppShell title="Nova publicação">
      <main className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-28">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </div>

            <div>
              <h1 className="font-semibold text-foreground">
                Compartilhe seu futebol
              </h1>

              <p className="text-sm text-muted-foreground">
                Mostre gols, defesas, dribles e momentos da partida.
              </p>
            </div>
          </div>

          <div className="p-4">
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl bg-black">
                {file?.type.startsWith("video/") ? (
                  <video
                    src={preview}
                    className="aspect-[4/3] w-full object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Prévia da publicação"
                    className="aspect-[4/3] w-full object-contain"
                  />
                )}

                <button
                  type="button"
                  onClick={removeFile}
                  disabled={publish.isPending}
                  aria-label="Remover arquivo"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={publish.isPending}
                className="group grid aspect-[4/3] w-full place-items-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex flex-col items-center">
                  <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition group-hover:scale-105">
                    <UploadCloud className="h-8 w-8" />
                  </span>

                  <strong className="text-base text-foreground">
                    Escolher foto ou vídeo
                  </strong>

                  <span className="mt-1 text-sm text-muted-foreground">
                    Toque para selecionar um arquivo de até 50 MB
                  </span>

                  <span className="mt-4 flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ImagePlus className="h-4 w-4" />
                      Foto
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Film className="h-4 w-4" />
                      Vídeo
                    </span>
                  </span>
                </span>
              </button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onPick}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="caption"
              className="text-sm font-semibold text-foreground"
            >
              Legenda
            </label>

            <span
              className={`text-xs ${
                caption.length > MAX_CAPTION_LENGTH
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {caption.length}/{MAX_CAPTION_LENGTH}
            </span>
          </div>

          <textarea
            id="caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={5}
            maxLength={MAX_CAPTION_LENGTH + 1}
            disabled={publish.isPending}
            placeholder="Conte como foi o lance, marque seus amigos ou descreva a partida..."
            className="w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {caption.length > MAX_CAPTION_LENGTH && (
            <p className="mt-2 text-xs text-destructive">
              A legenda deve ter no máximo {MAX_CAPTION_LENGTH} caracteres.
            </p>
          )}
        </section>

        {profile.data?.city && (
          <section className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Localização da publicação
              </p>

              <p className="text-sm font-medium text-foreground">
                {profile.data.city}
              </p>
            </div>
          </section>
        )}

        <Button
          type="button"
          variant="hero"
          size="xl"
          className="w-full"
          disabled={!canPublish}
          onClick={() => publish.mutate()}
        >
          {publish.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5" />
              Publicar no Boleiros
            </>
          )}
        </Button>
      </main>
    </AppShell>
  );
}