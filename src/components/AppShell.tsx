import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Home,
  Search,
  Trophy,
  User,
  CircleDot,
} from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Feed", icon: Home, exact: true },
  { to: "/buscar", label: "Buscar", icon: Search, exact: false },
  { to: "/publicar", label: "Jogar", icon: CircleDot, exact: false },
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h1 className="truncate text-lg font-extrabold">{title}</h1>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2"
                aria-label="Página inicial do Boleiros"
              >
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift">
                  <CircleDot className="h-5 w-5" />
                </span>

                <span className="font-display text-2xl font-black tracking-tight">
                  Boleiros<span className="text-primary">.</span>
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">{action}</div>
        </div>
      </header>

      <main className="flex-1 pb-28">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-xl -translate-x-1/2 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <ul className="grid grid-cols-5 items-end px-2">
          {tabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.to
              : pathname.startsWith(tab.to);

            const Icon = tab.icon;
            const isMainAction = tab.to === "/publicar";

            return (
              <li key={tab.to} className="relative">
                <Link
                  to={tab.to}
                  aria-label={tab.label}
                  className={cn(
                    "flex min-h-[68px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                    isMainAction && "-mt-5",
                  )}
                >
                  {isMainAction ? (
                    <>
                      <span
                        className={cn(
                          "grid h-14 w-14 place-items-center rounded-full border-4 border-background shadow-lift transition-transform",
                          active
                            ? "scale-105 bg-primary text-primary-foreground"
                            : "bg-primary text-primary-foreground hover:scale-105",
                        )}
                      >
                        <CircleDot className="h-7 w-7" />
                      </span>

                      <span className="mt-1">{tab.label}</span>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-xl transition-colors",
                          active && "bg-primary/10",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-transform",
                            active && "scale-110",
                          )}
                        />
                      </span>

                      <span>{tab.label}</span>
                    </>
                  )}

                  {active && !isMainAction && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}