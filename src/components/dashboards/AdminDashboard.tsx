import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, ShieldAlert, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listAllIncidents } from "@/lib/incidents.functions";
import {
  adminBroadcast,
  adminDeleteUser,
  adminListConversations,
  adminListUsers,
  adminSendDirectMessage,
  adminSetRole,
  adminSuspendUser,
} from "@/lib/admin.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_LABEL, useAuth, type AppRole } from "@/hooks/useAuth";
import { IncidentsMap, type MapIncident } from "@/components/maps/IncidentsMap";
import { IncidentStatusBadge, IncidentTypeIcon, TYPE_LABEL, type IncidentType } from "./shared";

const ROLES: AppRole[] = [
  "citizen",
  "responder_frsc",
  "responder_police",
  "responder_fire",
  "responder_hospital",
  "admin",
];

export function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin control center</h1>
        <p className="text-sm text-muted-foreground">
          Monitor incidents, manage users, and communicate in real time.
        </p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Live incidents</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <IncidentsPanel />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="messaging" className="mt-4">
          <MessagingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------- INCIDENTS --------------- */

function IncidentsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllIncidents);
  const all = useQuery({ queryKey: ["admin-incidents"], queryFn: () => listFn() });

  useEffect(() => {
    const ch = supabase
      .channel("admin-incidents-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-incidents"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const stats = useMemo(() => {
    const rows = all.data ?? [];
    return {
      total: rows.length,
      active: rows.filter((r) => !["resolved", "cancelled"].includes(r.status)).length,
      resolved: rows.filter((r) => r.status === "resolved").length,
    };
  }, [all.data]);

  const mapPoints: MapIncident[] = (all.data ?? []).map((i) => ({
    id: i.id,
    lat: i.lat as number | null,
    lng: i.lng as number | null,
    type: i.type,
    status: i.status,
    address: i.address,
    description: i.description,
    created_at: i.created_at,
  }));

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total incidents" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Resolved" value={stats.resolved} />
      </div>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Live incident map</h2>
          <span className="text-xs text-muted-foreground">
            {mapPoints.filter((p) => p.lat != null && p.lng != null).length} geolocated
          </span>
        </div>
        <IncidentsMap incidents={mapPoints} height={380} />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Recent incidents (live)</div>
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

/* --------------- USERS --------------- */

function UsersPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListUsers);
  const suspendFn = useServerFn(adminSuspendUser);
  const roleFn = useServerFn(adminSetRole);
  const dmFn = useServerFn(adminSendDirectMessage);
  const [q, setQ] = useState("");
  const [dmTo, setDmTo] = useState<string | null>(null);
  const [dmBody, setDmBody] = useState("");
  const [dmSubject, setDmSubject] = useState("");

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });

  const filtered = (users.data ?? []).filter((u) => {
    if (!q) return true;
    const hay = `${u.full_name ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const suspend = useMutation({
    mutationFn: (v: { id: string; suspended: boolean }) =>
      suspendFn({ data: { userId: v.id, suspended: v.suspended } }),
    onSuccess: (_r, v) => {
      toast.success(v.suspended ? "User suspended" : "User reinstated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const setRole = useMutation({
    mutationFn: (v: { id: string; role: AppRole; action: "add" | "remove" }) =>
      roleFn({ data: { userId: v.id, role: v.role, action: v.action } }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const dm = useMutation({
    mutationFn: () =>
      dmFn({
        data: { recipientId: dmTo!, subject: dmSubject.trim() || undefined, body: dmBody.trim() },
      }),
    onSuccess: () => {
      toast.success("Message sent");
      setDmTo(null);
      setDmBody("");
      setDmSubject("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">All users ({users.data?.length ?? 0})</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <div className="divide-y divide-border">
        {users.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {filtered.map((u) => (
          <div key={u.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{u.full_name ?? "(no name)"}</span>
                {u.suspended && (
                  <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                    Suspended
                  </span>
                )}
                {(u.roles ?? []).map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground"
                  >
                    {ROLE_LABEL[r]}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {u.email ?? "—"} {u.phone ? `· ${u.phone}` : ""}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const [action, role] = v.split(":") as ["add" | "remove", AppRole];
                  setRole.mutate({ id: u.id, action, role });
                  e.target.value = "";
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="">Roles…</option>
                {ROLES.map((r) => (
                  <option key={`add:${r}`} value={`add:${r}`}>
                    ➕ {ROLE_LABEL[r]}
                  </option>
                ))}
                {ROLES.map((r) => (
                  <option key={`remove:${r}`} value={`remove:${r}`}>
                    ➖ {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => suspend.mutate({ id: u.id, suspended: !u.suspended })}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-accent"
              >
                {u.suspended ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                {u.suspended ? "Reinstate" : "Suspend"}
              </button>
              <button
                onClick={() => setDmTo(u.id)}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-3 w-3" /> Message
              </button>
            </div>
            {dmTo === u.id && (
              <div className="sm:col-span-2 rounded-xl border border-border bg-muted/30 p-3">
                <input
                  value={dmSubject}
                  onChange={(e) => setDmSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  maxLength={200}
                />
                <textarea
                  value={dmBody}
                  onChange={(e) => setDmBody(e.target.value)}
                  rows={3}
                  placeholder={`Message ${u.full_name ?? u.email ?? "user"}…`}
                  maxLength={4000}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDmTo(null)}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!dmBody.trim() || dm.isPending}
                    onClick={() => dm.mutate()}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
                  >
                    {dm.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!users.isLoading && filtered.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No matching users.</div>
        )}
      </div>
    </div>
  );
}

/* --------------- MESSAGING --------------- */

function MessagingPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListConversations);
  const broadcastFn = useServerFn(adminBroadcast);
  const list = useQuery({ queryKey: ["admin-messages"], queryFn: () => listFn() });

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | AppRole>("all");

  useEffect(() => {
    const ch = supabase
      .channel("admin-messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-messages"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const broadcast = useMutation({
    mutationFn: () =>
      broadcastFn({
        data: {
          subject: subject.trim() || undefined,
          body: body.trim(),
          targetRole: target === "all" ? undefined : target,
        },
      }),
    onSuccess: () => {
      toast.success("Broadcast sent");
      setSubject("");
      setBody("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Broadcast message</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Reaches every user in-app instantly and emails them (when the email domain is verified).
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Audience
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as typeof target)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Everyone</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            maxLength={200}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="What do you want to tell them?"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            disabled={!body.trim() || broadcast.isPending}
            onClick={() => broadcast.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {broadcast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Broadcast
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Recent messages (live)</div>
        <div className="max-h-[560px] divide-y divide-border overflow-y-auto">
          {list.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {list.data?.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">Nothing here yet.</div>
          )}
          {list.data?.map((m) => (
            <div key={m.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {m.is_broadcast
                    ? `📢 Broadcast${m.target_role ? ` → ${ROLE_LABEL[m.target_role as AppRole]}` : " → Everyone"}`
                    : m.recipient_id
                      ? "Direct message"
                      : "Message"}
                  {m.subject ? ` — ${m.subject}` : ""}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/80">{m.body}</p>
            </div>
          ))}
        </div>
      </section>
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
