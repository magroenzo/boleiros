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

export type FeedPost = {
  id: string;
  author_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string;
  city: string | null;
  team_name: string | null;
  created_at: string;
  profiles: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "city"> | null;
  post_likes: { user_id: string }[];
  post_comments: { id: string }[];
  post_saves: { user_id: string }[];
};

const FEED_SELECT =
  "id, author_id, caption, media_url, media_type, city, team_name, created_at, profiles!posts_author_id_fkey(id, username, full_name, avatar_url, city), post_likes(user_id), post_comments(id), post_saves(user_id)";

export async function fetchFeed() {
  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as FeedPost[];
}

export async function fetchPostsByAuthor(authorId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeedPost[];
}

export async function fetchProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchProfileById(id: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchMatches(playerId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("player_id", playerId)
    .order("match_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Match[];
}

export function aggregateStats(matches: Match[]) {
  return {
    jogos: matches.length,
    gols: matches.reduce((a, m) => a + m.goals, 0),
    assistencias: matches.reduce((a, m) => a + m.assists, 0),
    amarelos: matches.reduce((a, m) => a + m.yellow_cards, 0),
    vermelhos: matches.reduce((a, m) => a + m.red_cards, 0),
    mvps: matches.filter((m) => m.mvp).length,
  };
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleSave(postId: string, userId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, content, created_at, user_id, profiles!post_comments_user_id_fkey(username, avatar_url, full_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: { username: string; avatar_url: string | null; full_name: string } | null;
  }[];
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, message, read, created_at, actor_id, profiles!notifications_actor_id_fkey(username, full_name, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    type: string;
    message: string | null;
    read: boolean;
    created_at: string;
    actor_id: string | null;
    profiles: { username: string; full_name: string; avatar_url: string | null } | null;
  }[];
}

export async function notify(params: {
  userId: string;
  actorId: string;
  type: string;
  postId?: string;
  message?: string;
}) {
  if (params.userId === params.actorId) return;
  await supabase.from("notifications").insert({
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    post_id: params.postId ?? null,
    message: params.message ?? null,
  });
}