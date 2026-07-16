import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Siren, LogOut } from "lucide-react";

import { ROLE_LABEL, useAuth, type AppRole } from "@/hooks/useAuth";
import { MessagesInbox } from "@/components/messaging/MessagesInbox";

export function DashboardShell({
  role,
  email,
  children,
}: {
  role: AppRole;
  email: string;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Siren className="h-5 w-5" />
            </span>
            <span className="text-base font-bold">
              RapidResQ <span className="text-primary">Naija</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium">{email}</div>
              <div className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</div>
            </div>
            <MessagesInbox />
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
