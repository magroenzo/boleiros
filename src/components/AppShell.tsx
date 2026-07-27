import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, PlusSquare, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/buscar", label: "Buscar", icon: Search, exact: false },
  { to: "/publicar", label: "Publicar", icon: PlusSquare, exact: false },
  { to: "/notificacoes", label: "Alertas", icon: Bell, exact: false },
  { to: "/perfil", label: "Perfil", icon: User, exact: false },
] as const;

export function AppShell({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background">
      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0">
          {title ? (
            <h1 className="truncate text-lg font-bold">{title}</h1>
          ) : (
            <span className="font-display text-xl font-extrabold tracking-tight">
              Boleiros<span className="text-primary">.</span>
            </span>
          )}
        </div>
        {action}
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-xl -translate-x-1/2 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <ul className="grid grid-cols-5">
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}