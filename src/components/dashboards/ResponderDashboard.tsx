import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { ROLE_LABEL, type AppRole } from "@/hooks/useAuth";
import {
  listResponderQueue,
  updateIncidentStatus,
  getIncidentMedia,
} from "@/lib/incidents.functions";
import { IncidentsMap, type MapIncident } from "@/components/maps/IncidentsMap";
import { IncidentStatusBadge, IncidentTypeIcon, TYPE_LABEL, type IncidentType } from "./shared";

const NEXT: Record<string, { label: string; next: "accepted" | "en_route" | "on_scene" | "resolved" }[]> = {
  pending: [{ label: "Accept", next: "accepted" }],
  accepted: [{ label: "En route", next: "en_route" }],
  en_route: [{ label: "On scene", next: "on_scene" }],
  on_scene: [{ label: "Resolve", next: "resolved" }],
  resolved: [],
  cancelled: [],
};

export function ResponderDashboard({ role }: { role: AppRole }) {
  const qc = useQueryClient();
  const queueFn = useServerFn(listResponderQueue);
  const updateFn = useServerFn(updateIncidentStatus);
  const mediaFn = useServerFn(getIncidentMedia);

  const queue = useQuery({ queryKey: ["responder-queue"], queryFn: () => queueFn() });
  const update = useMutation({
    mutationFn: (v: { id: string; status: "accepted" | "en_route" | "on_scene" | "resolved" }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["responder-queue"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{ROLE_LABEL[role]} queue</h1>
        <p className="text-sm text-muted-foreground">
          Live incidents assigned to your unit. Accept and update as you respond.
        </p>
      </div>
      <div className="grid gap-3">
        {queue.isLoading && <div className="text-sm text-muted-foreground">Loading queue…</div>}
        {queue.data && queue.data.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No active incidents. You'll see them here as they come in.
          </div>
        )}
        {queue.data?.map((i) => {
          const options = NEXT[i.status] ?? [];
          return (
            <div key={i.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <IncidentTypeIcon type={i.type as IncidentType} className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{TYPE_LABEL[i.type as IncidentType]}</span>
                    <IncidentStatusBadge status={i.status} />
                  </div>
                  {i.description && <p className="mt-1.5 text-sm">{i.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{new Date(i.created_at).toLocaleString()}</span>
                    {i.address && <span>· {i.address}</span>}
                    {i.lat != null && i.lng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${i.lat},${i.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" /> {i.lat.toFixed(4)}, {i.lng.toFixed(4)}
                      </a>
                    )}
                    <button
                      onClick={() => setExpanded((x) => (x === i.id ? null : i.id))}
                      className="inline-flex items-center gap-1 text-foreground hover:underline"
                    >
                      <ImageIcon className="h-3 w-3" /> Photos
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => (
                    <button
                      key={o.next}
                      onClick={() => update.mutate({ id: i.id, status: o.next })}
                      disabled={update.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {update.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {expanded === i.id && <MediaGrid incidentId={i.id} fetcher={mediaFn} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MediaGrid({
  incidentId,
  fetcher,
}: {
  incidentId: string;
  fetcher: (opts: { data: { incidentId: string } }) => Promise<{ path: string; url: string | null }[]>;
}) {
  const q = useQuery({
    queryKey: ["incident-media", incidentId],
    queryFn: () => fetcher({ data: { incidentId } }),
  });
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {q.isLoading && <div className="col-span-full text-xs text-muted-foreground">Loading photos…</div>}
      {q.data && q.data.length === 0 && (
        <div className="col-span-full text-xs text-muted-foreground">No photos attached.</div>
      )}
      {q.data?.filter((m) => m.url).map((m) => (
        <a
          key={m.path}
          href={m.url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="aspect-square overflow-hidden rounded-lg border border-border"
        >
          <img src={m.url ?? undefined} alt="" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}
