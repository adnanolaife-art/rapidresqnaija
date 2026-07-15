import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

type AuthCtx = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  const loadRoles = async () => {
    const { data } = await supabase.rpc("get_my_roles");
    setRoles((data ?? []) as AppRole[]);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadRoles();
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        await loadRoles();
        router.invalidate();
      }
      if (event === "SIGNED_OUT") {
        setRoles([]);
        qc.clear();
        router.invalidate();
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, qc]);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        loading,
        refreshRoles: loadRoles,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  const responder = roles.find((r) => r.startsWith("responder_"));
  if (responder) return responder;
  return "citizen";
}

export const ROLE_LABEL: Record<AppRole, string> = {
  citizen: "Citizen",
  responder_frsc: "FRSC Responder",
  responder_police: "Police Responder",
  responder_fire: "Fire & Rescue Responder",
  responder_hospital: "Hospital / Ambulance",
  admin: "Administrator",
};
