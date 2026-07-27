import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MapPin, MessageCircle, Send, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { PlayerAvatar, SignedImage } from "@/components/SignedImage";
import { VideoPlayer } from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { fetchComments, notify, toggleLike, toggleSave, type FeedPost } from "@/lib/db";
import { cn } from "@/lib/utils";

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId?: string }) {
  const qc = useQueryClient();
  const [openComments, setOpenComments] = useState(false);
  const [draft, setDraft] = useState("");

  const liked = !!currentUserId && post.post_likes.some((l) => l.user_id === currentUserId);
  const saved = !!currentUserId && post.post_saves.some((s) => s.user_id === currentUserId);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["posts"] });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Entre para curtir");
      await toggleLike(post.id, currentUserId, liked);
      if (!liked) {
        await notify({
          userId: post.author_id,
          actorId: currentUserId,
          type: "like",
          postId: post.id,
        });
      }
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Entre para salvar");
      await toggleSave(post.id, currentUserId, saved);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const comments = useQuery({
    queryKey: ["comments", post.id],
    enabled: openComments,
    queryFn: () => fetchComments(post.id),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Entre para comentar");
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: post.id, user_id: currentUserId, content: draft.trim() });
      if (error) throw error;
      await notify({
        userId: post.author_id,
        actorId: currentUserId,
        type: "comment",
        postId: post.id,
        message: draft.trim(),
      });
    },
    onSuccess: () => {
      setDraft("");
      void qc.invalidateQueries({ queryKey: ["comments", post.id] });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function share() {
    const url = `${window.location.origin}/jogador/${post.profiles?.username ?? ""}`;
    try {
      if (navigator.share) await navigator.share({ title: "Boleiros", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado");
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <article className="border-b border-border pb-3">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link
          to="/jogador/$username"
          params={{ username: post.profiles?.username ?? "" }}
          aria-label={post.profiles?.full_name ?? "Jogador"}
        >
          <PlayerAvatar
            path={post.profiles?.avatar_url}
            name={post.profiles?.full_name || post.profiles?.username || "Jogador"}
            className="h-11 w-11 ring-2 ring-primary/40"
          />
        </Link>
        <div className="min-w-0">
          <Link
            to="/jogador/$username"
            params={{ username: post.profiles?.username ?? "" }}
            className="block truncate text-sm font-bold"
          >
            {post.profiles?.full_name || post.profiles?.username}
          </Link>
          <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
            {post.city || post.profiles?.city ? (
              <>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{post.city || post.profiles?.city}</span>
              </>
            ) : null}
            {post.team_name ? (
              <>
                <Shield className="ml-1 h-3 w-3 shrink-0" />
                <span className="truncate">{post.team_name}</span>
              </>
            ) : null}
          </p>
        </div>
        <time className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: false })}
        </time>
      </header>

      {post.media_url && post.media_type === "image" && (
        <SignedImage
          path={post.media_url}
          alt={post.caption ?? "Publicação"}
          className="max-h-[70vh] w-full object-cover"
        />
      )}
      {post.media_url && post.media_type === "video" && <VideoPlayer path={post.media_url} />}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          aria-label="Curtir"
          className="flex items-center gap-1.5 text-sm font-semibold transition-transform active:scale-90"
        >
          <Heart className={cn("h-6 w-6", liked && "fill-primary text-primary")} />
          {post.post_likes.length}
        </button>
        <button
          type="button"
          onClick={() => setOpenComments((v) => !v)}
          aria-label="Comentários"
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <MessageCircle className="h-6 w-6" />
          {post.post_comments.length}
        </button>
        <button type="button" onClick={share} aria-label="Compartilhar">
          <Send className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          aria-label="Salvar"
          className="ml-auto"
        >
          <Bookmark className={cn("h-6 w-6", saved && "fill-primary text-primary")} />
        </button>
      </div>

      {post.caption && (
        <p className="px-4 pt-2 text-sm leading-relaxed">
          <span className="font-bold">{post.profiles?.username} </span>
          {post.caption}
        </p>
      )}

      {openComments && (
        <div className="mt-3 space-y-3 px-4">
          {comments.data?.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <PlayerAvatar
                path={c.profiles?.avatar_url}
                name={c.profiles?.full_name ?? "?"}
                className="h-7 w-7"
              />
              <p className="text-sm">
                <span className="font-bold">{c.profiles?.username} </span>
                {c.content}
              </p>
            </div>
          ))}
          {comments.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) commentMutation.mutate();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Adicione um comentário..."
              className="h-10 flex-1 rounded-full border border-border bg-muted px-4 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="text-sm font-bold text-primary">
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  );
}