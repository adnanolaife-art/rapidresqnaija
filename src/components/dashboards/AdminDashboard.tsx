import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listAllIncidents } from "@/lib/incidents.functions";
import { IncidentStatusBadge, IncidentTypeIcon, TYPE_LABEL, type IncidentType } from "./shared";

export function AdminDashboard() {
  const listFn = useServerFn(listAllIncidents);
  const all = useQuery({ queryKey: ["admin-incidents"], queryFn: () => listFn() });

  const stats = (() => {
    const rows = all.data ?? [];
    return {
      total: rows.length,
      active: rows.filter((r) => !["resolved", "cancelled"].includes(r.status)).length,
      resolved: rows.filter((r) => r.status === "resolved").length,
    };
  })();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">All incidents across every agency.</p>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total incidents" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Resolved" value={stats.resolved} />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Recent incidents</div>
        <div className="divide-y divide-border">
          {all.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {all.data?.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No incidents yet.</div>
          )}
          {all.data?.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <IncidentTypeIcon type={i.type as IncidentType} className="h-4 w-4 text-primary" />
              <span className="font-medium">{TYPE_LABEL[i.type as IncidentType]}</span>
              <IncidentStatusBadge status={i.status} />
              <span className="text-muted-foreground">{new Date(i.created_at).toLocaleString()}</span>
              {i.address && <span className="text-muted-foreground">· {i.address}</span>}
              <span className="ml-auto truncate text-xs text-muted-foreground">{i.description ?? ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}
