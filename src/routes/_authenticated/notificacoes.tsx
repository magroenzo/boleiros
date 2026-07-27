import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AtSign, Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppShell } from "@/components/AppShell";
import { PlayerAvatar } from "@/components/SignedImage";
import { useAuth } from "@/lib/auth";
import { fetchNotifications } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Boleiros" },
      { name: "description", content: "Curtidas, comentários, menções e novos seguidores." },
      { property: "og:title", content: "Notificações — Boleiros" },
      { property: "og:description", content: "Curtidas, comentários, menções e novos seguidores." },
    ],
  }),
  component: NotificacoesPage,
});

const icons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
};

const labels: Record<string, string> = {
  like: "curtiu sua publicação",
  comment: "comentou na sua publicação",
  follow: "começou a seguir você",
  mention: "mencionou você",
};

function NotificacoesPage() {
  const { user } = useAuth();
  const list = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: () => fetchNotifications(user!.id),
  });

  return (
    <AppShell title="Notificações">
      {list.data?.length === 0 && (
        <div className="grid place-items-center gap-3 px-6 py-24 text-center">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nada por aqui ainda. Publique um lance para movimentar o vestiário.
          </p>
        </div>
      )}
      <ul className="divide-y divide-border">
        {list.data?.map((n) => {
          const Icon = icons[n.type] ?? Bell;
          return (
            <li key={n.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <PlayerAvatar
                path={n.profiles?.avatar_url}
                name={n.profiles?.full_name ?? "?"}
                className="h-10 w-10"
              />
              <div className="min-w-0">
                <p className="truncate text-sm">
                  <span className="font-bold">{n.profiles?.username ?? "Alguém"}</span>{" "}
                  {labels[n.type] ?? n.type}
                </p>
                {n.message && (
                  <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Icon className="h-4 w-4 text-primary" />
                <time className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { locale: ptBR })}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}