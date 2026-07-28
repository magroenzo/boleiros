import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Bookmark,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Send,
  Shield,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import {
  PlayerAvatar,
  SignedImage,
} from "@/components/SignedImage";
import { VideoPlayer } from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import {
  createComment,
  deleteComment,
  fetchComments,
  notify,
  toggleLike,
  toggleSave,
  type FeedPost,
} from "@/lib/db";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  currentUserId,
}: {
  post: FeedPost;
  currentUserId?: string;
}) {
  const qc = useQueryClient();

  const [openComments, setOpenComments] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [draft, setDraft] = useState("");

  const liked =
    !!currentUserId &&
    post.post_likes.some(
      (like) => like.user_id === currentUserId,
    );

  const saved =
    !!currentUserId &&
    post.post_saves.some(
      (save) => save.user_id === currentUserId,
    );

  const isAuthor =
    !!currentUserId && currentUserId === post.author_id;

  function invalidatePosts() {
    return qc.invalidateQueries({
      queryKey: ["posts"],
    });
  }

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("Entre para curtir");
      }

      await toggleLike(post.id, currentUserId, liked);

      if (!liked && post.author_id !== currentUserId) {
        await notify({
          userId: post.author_id,
          actorId: currentUserId,
          type: "like",
          postId: post.id,
        });
      }
    },

    onSuccess: () => {
      void invalidatePosts();
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("Entre para salvar");
      }

      await toggleSave(post.id, currentUserId, saved);
    },

    onSuccess: () => {
      void invalidatePosts();
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (
        !currentUserId ||
        currentUserId !== post.author_id
      ) {
        throw new Error(
          "Você não pode excluir esta publicação",
        );
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("author_id", currentUserId);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      setOpenMenu(false);

      qc.removeQueries({
        queryKey: ["comments", post.id],
      });

      void invalidatePosts();

      toast.success("Publicação excluída");
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function confirmDeletePost() {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta publicação?",
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  const comments = useQuery({
    queryKey: ["comments", post.id],
    enabled: openComments,
    queryFn: () => fetchComments(post.id),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("Entre para comentar");
      }

      const comment = draft.trim();

      if (!comment) {
        throw new Error("Digite um comentário");
      }

      await createComment({
        postId: post.id,
        userId: currentUserId,
        content: comment,
      });

      if (post.author_id !== currentUserId) {
        await notify({
          userId: post.author_id,
          actorId: currentUserId,
          type: "comment",
          postId: post.id,
          message: comment,
        });
      }
    },

    onSuccess: () => {
      setDraft("");

      void qc.invalidateQueries({
        queryKey: ["comments", post.id],
      });

      void invalidatePosts();
    },

    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Não foi possível publicar o comentário.",
      );
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!currentUserId) {
        throw new Error(
          "Entre para excluir comentários.",
        );
      }

      await deleteComment({
        commentId,
        userId: currentUserId,
      });
    },

    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["comments", post.id],
      });

      void invalidatePosts();

      toast.success("Comentário excluído");
    },

    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Não foi possível excluir o comentário.",
      );
    },
  });

  async function share() {
    const username = post.profiles?.username;

    const url = username
      ? `${window.location.origin}/jogador/${username}`
      : window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Boleiros",
          text:
            post.caption ??
            "Confira esta publicação no Boleiros.",
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      // O usuário pode ter cancelado o compartilhamento.
    }
  }

  return (
    <article className="overflow-hidden border-b border-border bg-background pb-3">
      <header className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        {post.profiles?.username ? (
          <Link
            to="/jogador/$username"
            params={{
              username: post.profiles.username,
            }}
            aria-label={
              post.profiles.full_name ?? "Jogador"
            }
          >
            <PlayerAvatar
              path={post.profiles.avatar_url}
              name={
                post.profiles.full_name ||
                post.profiles.username
              }
              className="h-11 w-11 ring-2 ring-primary/40"
            />
          </Link>
        ) : (
          <PlayerAvatar
            path={post.profiles?.avatar_url}
            name="Jogador"
            className="h-11 w-11 ring-2 ring-primary/40"
          />
        )}

        <div className="min-w-0">
          {post.profiles?.username ? (
            <Link
              to="/jogador/$username"
              params={{
                username: post.profiles.username,
              }}
              className="block truncate text-sm font-bold hover:text-primary"
            >
              {post.profiles.full_name ||
                post.profiles.username}
            </Link>
          ) : (
            <p className="truncate text-sm font-bold">
              Jogador
            </p>
          )}

          <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
            {post.city || post.profiles?.city ? (
              <>
                <MapPin className="h-3 w-3 shrink-0" />

                <span className="truncate">
                  {post.city || post.profiles?.city}
                </span>
              </>
            ) : null}

            {post.team_name ? (
              <>
                <Shield className="ml-1 h-3 w-3 shrink-0" />

                <span className="truncate">
                  {post.team_name}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-1 justify-self-end">
          <time
            dateTime={post.created_at}
            className="text-[11px] text-muted-foreground"
          >
            {formatDistanceToNow(
              new Date(post.created_at),
              {
                locale: ptBR,
                addSuffix: false,
              },
            )}
          </time>

          {isAuthor && (
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenMenu((value) => !value)
                }
                aria-label="Opções da publicação"
                aria-expanded={openMenu}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {openMenu && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setOpenMenu(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />

                  <div className="absolute right-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={confirmDeletePost}
                      disabled={
                        deleteMutation.isPending
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}

                      {deleteMutation.isPending
                        ? "Excluindo..."
                        : "Excluir publicação"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {post.media_url &&
        post.media_type === "image" && (
          <SignedImage
            path={post.media_url}
            alt={post.caption ?? "Publicação"}
            className="max-h-[70vh] w-full object-cover"
          />
        )}

      {post.media_url &&
        post.media_type === "video" && (
          <VideoPlayer path={post.media_url} />
        )}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          aria-label={
            liked
              ? "Remover curtida"
              : "Curtir publicação"
          }
          aria-pressed={liked}
          className={cn(
            "group flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-semibold transition-all",
            "active:scale-90 disabled:cursor-not-allowed disabled:opacity-60",
            liked && "text-primary",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full transition-all duration-300",
              liked
                ? "scale-110 bg-primary text-primary-foreground shadow-sm"
                : "text-foreground group-hover:bg-primary/10 group-hover:text-primary",
            )}
          >
            <span
              className={cn(
                "text-[21px] leading-none transition-transform duration-300",
                liked && "animate-bounce",
              )}
              aria-hidden="true"
            >
              ⚽
            </span>
          </span>

          <span>{post.post_likes.length}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setOpenComments((value) => !value)
          }
          aria-label="Comentários"
          aria-expanded={openComments}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-semibold transition-colors",
            openComments
              ? "text-primary"
              : "text-foreground hover:text-primary",
          )}
        >
          <MessageCircle
            className={cn(
              "h-6 w-6",
              openComments && "fill-primary/15",
            )}
          />

          <span>{post.post_comments.length}</span>
        </button>

        <button
          type="button"
          onClick={() => void share()}
          aria-label="Compartilhar"
          className="rounded-full p-1 transition-all hover:bg-muted hover:text-primary active:scale-90"
        >
          <Send className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          aria-label={
            saved
              ? "Remover dos salvos"
              : "Salvar publicação"
          }
          aria-pressed={saved}
          className="ml-auto rounded-full p-1 transition-all hover:bg-muted hover:text-primary active:scale-90 disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Bookmark
              className={cn(
                "h-6 w-6",
                saved &&
                  "fill-primary text-primary",
              )}
            />
          )}
        </button>
      </div>

      {post.post_likes.length > 0 && (
        <p className="px-4 pt-1 text-xs font-semibold text-muted-foreground">
          {post.post_likes.length === 1
            ? "1 boleiro curtiu este lance"
            : `${post.post_likes.length} boleiros curtiram este lance`}
        </p>
      )}

      {post.caption && (
        <p className="px-4 pt-2 text-sm leading-relaxed">
          {post.profiles?.username ? (
            <Link
              to="/jogador/$username"
              params={{
                username: post.profiles.username,
              }}
              className="font-bold hover:text-primary"
            >
              {post.profiles.username}
            </Link>
          ) : (
            <span className="font-bold">Jogador</span>
          )}{" "}
          {post.caption}
        </p>
      )}

      {post.post_comments.length > 0 &&
        !openComments && (
          <button
            type="button"
            onClick={() => setOpenComments(true)}
            className="px-4 pt-2 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            Ver{" "}
            {post.post_comments.length === 1
              ? "1 comentário"
              : `todos os ${post.post_comments.length} comentários`}
          </button>
        )}

      {openComments && (
        <div className="mt-3 space-y-3 border-t border-border/60 px-4 pt-3">
          {comments.isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Carregando comentários...
            </div>
          )}

          {comments.isError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs text-destructive">
                Não foi possível carregar os
                comentários.
              </p>

              <button
                type="button"
                onClick={() =>
                  void comments.refetch()
                }
                className="mt-2 text-xs font-bold text-primary"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {comments.data?.map((comment) => {
            const canDelete =
              !!currentUserId &&
              comment.user_id === currentUserId;

            const username =
              comment.profiles?.username ?? "";

            const commentContent = (
              <div className="min-w-0 flex-1 rounded-2xl bg-muted px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {username ? (
                      <Link
                        to="/jogador/$username"
                        params={{ username }}
                        className="block truncate text-xs font-bold hover:text-primary"
                      >
                        {comment.profiles
                          ?.full_name ||
                          comment.profiles
                            ?.username}
                      </Link>
                    ) : (
                      <p className="truncate text-xs font-bold">
                        Jogador
                      </p>
                    )}

                    <p className="break-words text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      aria-label="Excluir comentário"
                      disabled={
                        deleteCommentMutation.isPending
                      }
                      onClick={() => {
                        const confirmed =
                          window.confirm(
                            "Deseja excluir este comentário?",
                          );

                        if (confirmed) {
                          deleteCommentMutation.mutate(
                            comment.id,
                          );
                        }
                      }}
                      className="shrink-0 rounded-full p-1 text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <time
                  dateTime={comment.created_at}
                  className="mt-1 block text-[10px] text-muted-foreground"
                >
                  {formatDistanceToNow(
                    new Date(comment.created_at),
                    {
                      locale: ptBR,
                      addSuffix: true,
                    },
                  )}
                </time>
              </div>
            );

            return (
              <div
                key={comment.id}
                className="group flex items-start gap-2"
              >
                {username ? (
                  <Link
                    to="/jogador/$username"
                    params={{ username }}
                    className="shrink-0"
                  >
                    <PlayerAvatar
                      path={
                        comment.profiles
                          ?.avatar_url
                      }
                      name={
                        comment.profiles
                          ?.full_name ||
                        comment.profiles
                          ?.username ||
                        "Jogador"
                      }
                      className="h-8 w-8 shrink-0"
                    />
                  </Link>
                ) : (
                  <PlayerAvatar
                    path={
                      comment.profiles?.avatar_url
                    }
                    name="Jogador"
                    className="h-8 w-8 shrink-0"
                  />
                )}

                {commentContent}
              </div>
            );
          })}

          {comments.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Seja o primeiro a comentar.
            </p>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();

              if (
                draft.trim() &&
                !commentMutation.isPending
              ) {
                commentMutation.mutate();
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(event) =>
                setDraft(event.target.value)
              }
              placeholder="Adicione um comentário..."
              maxLength={500}
              disabled={commentMutation.isPending}
              className="h-10 flex-1 rounded-full border border-border bg-muted px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            />

            <button
              type="submit"
              aria-label="Enviar comentário"
              disabled={
                !draft.trim() ||
                commentMutation.isPending
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {commentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          {draft.length > 400 && (
            <p className="text-right text-[10px] text-muted-foreground">
              {draft.length}/500
            </p>
          )}
        </div>
      )}
    </article>
  );
}