import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
  position: string | null;
  team_id: string | null;
  bio: string | null;
  titles: number;
  verified: boolean;
};

export type Team = {
  id: string;
  name: string;
  city: string | null;
  crest_url: string | null;
  kit_url: string | null;
  created_by: string | null;
};

export type Match = {
  id: string;
  player_id: string;
  opponent: string;
  match_date: string;
  location: string | null;
  result: string | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  mvp: boolean;
  rating: number | null;
};

export type PlayerStats = {
  jogos: number;
  gols: number;
  assistencias: number;
  amarelos: number;
  vermelhos: number;
  mvps: number;
  mediaNota: number | null;
  overall: number;
};

export type FeedPost = {
  id: string;
  author_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string;
  city: string | null;
  team_name: string | null;
  created_at: string;

  profiles: Pick<
    Profile,
    "id" | "username" | "full_name" | "avatar_url" | "city"
  > | null;

  post_likes: {
    user_id: string;
  }[];

  post_comments: {
    id: string;
  }[];

  post_saves: {
    user_id: string;
  }[];
};

export type PostComment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;

  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string;
  } | null;
};

export type Notification = {
  id: string;
  type: string;
  message: string | null;
  read: boolean;
  created_at: string;
  actor_id: string | null;

  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

const FEED_SELECT = `
  id,
  author_id,
  caption,
  media_url,
  media_type,
  city,
  team_name,
  created_at,
  profiles!posts_author_id_fkey(
    id,
    username,
    full_name,
    avatar_url,
    city
  ),
  post_likes(
    user_id
  ),
  post_comments(
    id
  ),
  post_saves(
    user_id
  )
`;

const COMMENT_SELECT = `
  id,
  content,
  created_at,
  user_id,
  profiles!post_comments_user_id_fkey(
    username,
    avatar_url,
    full_name
  )
`;

const NOTIFICATION_SELECT = `
  id,
  type,
  message,
  read,
  created_at,
  actor_id,
  profiles!notifications_actor_id_fkey(
    username,
    full_name,
    avatar_url
  )
`;

export async function fetchFeed(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as FeedPost[];
}

export async function fetchPostsByAuthor(
  authorId: string,
): Promise<FeedPost[]> {
  if (!authorId) {
    return [];
  }

  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .eq("author_id", authorId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as FeedPost[];
}

export async function fetchProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const normalizedUsername = username
    .trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!normalizedUsername) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function fetchProfileById(
  id: string,
): Promise<Profile | null> {
  if (!id) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function fetchMatches(
  playerId: string,
): Promise<Match[]> {
  if (!playerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("player_id", playerId)
    .order("match_date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Match[];
}

export function aggregateStats(
  matches: Match[],
): PlayerStats {
  const jogos = matches.length;

  const gols = matches.reduce(
    (total, match) => total + safeNumber(match.goals),
    0,
  );

  const assistencias = matches.reduce(
    (total, match) => total + safeNumber(match.assists),
    0,
  );

  const amarelos = matches.reduce(
    (total, match) =>
      total + safeNumber(match.yellow_cards),
    0,
  );

  const vermelhos = matches.reduce(
    (total, match) =>
      total + safeNumber(match.red_cards),
    0,
  );

  const mvps = matches.filter(
    (match) => match.mvp === true,
  ).length;

  const validRatings = matches
    .map((match) => match.rating)
    .filter(
      (rating): rating is number =>
        typeof rating === "number" &&
        Number.isFinite(rating),
    );

  const mediaNota =
    validRatings.length > 0
      ? Number(
          (
            validRatings.reduce(
              (total, rating) => total + rating,
              0,
            ) / validRatings.length
          ).toFixed(1),
        )
      : null;

  const overall = calculateOverall({
    jogos,
    gols,
    assistencias,
    mvps,
    mediaNota,
  });

  return {
    jogos,
    gols,
    assistencias,
    amarelos,
    vermelhos,
    mvps,
    mediaNota,
    overall,
  };
}

export async function toggleLike(
  postId: string,
  userId: string,
  liked: boolean,
): Promise<void> {
  if (!postId || !userId) {
    throw new Error(
      "Não foi possível identificar a publicação ou o usuário.",
    );
  }

  if (liked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({
      post_id: postId,
      user_id: userId,
    });

  if (error) {
    throw error;
  }
}

export async function toggleSave(
  postId: string,
  userId: string,
  saved: boolean,
): Promise<void> {
  if (!postId || !userId) {
    throw new Error(
      "Não foi possível identificar a publicação ou o usuário.",
    );
  }

  if (saved) {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("post_saves")
    .insert({
      post_id: postId,
      user_id: userId,
    });

  if (error) {
    throw error;
  }
}

export async function fetchComments(
  postId: string,
): Promise<PostComment[]> {
  if (!postId) {
    return [];
  }

  const { data, error } = await supabase
    .from("post_comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as PostComment[];
}

export async function createComment(params: {
  postId: string;
  userId: string;
  content: string;
}): Promise<PostComment> {
  const postId = params.postId.trim();
  const userId = params.userId.trim();
  const content = params.content.trim();

  if (!postId || !userId) {
    throw new Error(
      "Não foi possível identificar a publicação ou o usuário.",
    );
  }

  if (!content) {
    throw new Error("Digite um comentário.");
  }

  if (content.length > 500) {
    throw new Error(
      "O comentário pode ter no máximo 500 caracteres.",
    );
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as PostComment;
}

export async function deleteComment(params: {
  commentId: string;
  userId: string;
}): Promise<void> {
  const commentId = params.commentId.trim();
  const userId = params.userId.trim();

  if (!commentId || !userId) {
    throw new Error(
      "Não foi possível identificar o comentário ou o usuário.",
    );
  }

  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function fetchNotifications(
  userId: string,
): Promise<Notification[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as Notification[];
}

export async function notify(params: {
  userId: string;
  actorId: string;
  type: string;
  postId?: string;
  message?: string;
}): Promise<void> {
  const userId = params.userId.trim();
  const actorId = params.actorId.trim();
  const type = params.type.trim();
  const message = params.message?.trim() || null;

  if (!userId || !actorId || !type) {
    throw new Error(
      "Dados insuficientes para criar a notificação.",
    );
  }

  if (userId === actorId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      actor_id: actorId,
      type,
      post_id: params.postId ?? null,
      message,
    });

  if (error) {
    throw error;
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  if (!notificationId || !userId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
    })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw error;
  }
}

function calculateOverall(params: {
  jogos: number;
  gols: number;
  assistencias: number;
  mvps: number;
  mediaNota: number | null;
}): number {
  const {
    jogos,
    gols,
    assistencias,
    mvps,
    mediaNota,
  } = params;

  if (jogos === 0) {
    return 70;
  }

  const golsPorJogo = gols / jogos;
  const assistenciasPorJogo = assistencias / jogos;
  const mvpsPorJogo = mvps / jogos;

  const pontosDesempenho =
    golsPorJogo * 9 +
    assistenciasPorJogo * 6 +
    mvpsPorJogo * 10;

  const bonusExperiencia = Math.min(
    5,
    Math.log2(jogos + 1),
  );

  const bonusNota =
    mediaNota !== null
      ? Math.max(
          -3,
          Math.min(8, (mediaNota - 6) * 2),
        )
      : 0;

  return Math.max(
    70,
    Math.min(
      99,
      Math.round(
        70 +
          pontosDesempenho +
          bonusExperiencia +
          bonusNota,
      ),
    ),
  );
}

function safeNumber(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(0, value);
}