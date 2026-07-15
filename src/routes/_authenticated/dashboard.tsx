import { createFileRoute } from "@tanstack/react-router";

import { useAuth, primaryRole } from "@/hooks/useAuth";
import { CitizenDashboard } from "@/components/dashboards/CitizenDashboard";
import { ResponderDashboard } from "@/components/dashboards/ResponderDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { DashboardShell } from "@/components/dashboards/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RapidResQ Naija" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { roles, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }
  const role = primaryRole(roles);
  return (
    <DashboardShell role={role} email={user?.email ?? ""}>
      {role === "admin" ? (
        <AdminDashboard />
      ) : role.startsWith("responder_") ? (
        <ResponderDashboard role={role} />
      ) : (
        <CitizenDashboard />
      )}
    </DashboardShell>
  );
}
