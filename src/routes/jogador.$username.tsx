import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ShareablePlayerCard } from "@/components/player-card/ShareablePlayerCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  fetchMatches,
  fetchPostsByAuthor,
  fetchProfileByUsername,
  notify,
} from "@/lib/db";

export const Route = createFileRoute("/jogador/$username")({
  head: ({ params }) => ({
    meta: [
      {
        title: `@${params.username} — Boleiros`,
      },
      {
        name: "description",
        content: `Perfil, estatísticas e publicações de @${params.username} no Boleiros.`,
      },
      {
        property: "og:title",
        content: `@${params.username} — Boleiros`,
      },
      {
        property: "og:description",
        content: `Perfil, estatísticas e publicações de @${params.username}.`,
      },
    ],
  }),
  component: JogadorPage,
});

function JogadorPage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", "username", username],
    queryFn: () => fetchProfileByUsername(username),
  });

  const playerId = profile.data?.id;

  const matches = useQuery({
    queryKey: ["matches", playerId],
    enabled: !!playerId,
    queryFn: () => fetchMatches(playerId!),
  });

  const posts = useQuery({
    queryKey: ["posts", "author", playerId],
    enabled: !!playerId,
    queryFn: () => fetchPostsByAuthor(playerId!),
  });

  const following = useQuery({
    queryKey: ["follow", user?.id, playerId],
    enabled: !!user && !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", playerId!)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    },
  });

  const follow = useMutation({
    mutationFn: async () => {
      if (!user || !playerId) {
        throw new Error("Entre para seguir");
      }

      if (following.data) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", playerId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: playerId,
          });

        if (error) {
          throw error;
        }

        await notify({
          userId: playerId,
          actorId: user.id,
          type: "follow",
        });
      }
    },

    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["follow"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (profile.isLoading) {
    return (
      <AppShell title="Jogador">
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!profile.data) {
    return (
      <AppShell title="Jogador">
        <p className="px-6 py-24 text-center text-sm text-muted-foreground">
          Jogador não encontrado.
        </p>
      </AppShell>
    );
  }

  const isSelf = user?.id === playerId;

  return (
    <AppShell title={`@${profile.data.username}`}>
      <ProfileHeader
        profile={profile.data}
        matches={matches.data ?? []}
      >
        {!isSelf && (
          <Button
            variant={following.data ? "soft" : "hero"}
            size="lg"
            className="w-full"
            onClick={() => follow.mutate()}
            disabled={follow.isPending}
          >
            {follow.isPending
              ? "Carregando..."
              : following.data
                ? "Seguindo"
                : "Seguir"}
          </Button>
        )}
      </ProfileHeader>

      <ShareablePlayerCard
        fullName="Enzo Dal Magro"
        username="enzodalmagro"
        position="ATA"
        city="Carlos Barbosa"
        state="RS"
        overall={84}
        matches={27}
        goals={18}
        assists={9}
        mvps={5}
      />

      <div className="mt-6 border-t border-border">
        {posts.data?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
          />
        ))}
      </div>
    </AppShell>
  );
}