import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateInput = z.object({
  type: z.enum(["medical", "fire", "police", "traffic", "other"]),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  mediaPaths: z.array(z.string().max(500)).max(6).optional(),
});

export const createIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("incidents")
      .insert({
        citizen_id: userId,
        type: data.type,
        description: data.description ?? null,
        address: data.address ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
      })
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not create incident");

    if (data.mediaPaths && data.mediaPaths.length > 0) {
      const rows = data.mediaPaths.map((p) => ({ incident_id: row.id, storage_path: p }));
      const { error: mErr } = await supabase.from("incident_media").insert(rows);
      if (mErr) console.error("media insert failed", mErr);
    }

    // Fire-and-forget notification (only if email domain configured)
    try {
      const { notifyResponders } = await import("./incidents.server");
      await notifyResponders(row.id);
    } catch (e) {
      console.warn("notifyResponders skipped:", (e as Error).message);
    }

    return row;
  });

export const listMyIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("citizen_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listResponderQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    // RLS restricts to types matching the responder's role
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .in("status", ["pending", "accepted", "en_route", "on_scene"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const StatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "accepted", "en_route", "on_scene", "resolved", "cancelled"]),
});

export const updateIncidentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: { status: typeof data.status; assignee_id?: string } = { status: data.status };
    if (data.status === "accepted") patch.assignee_id = userId;
    const { data: row, error } = await supabase
      .from("incidents")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not update incident");
    return row;
  });

export const getIncidentMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ incidentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("incident_media")
      .select("storage_path")
      .eq("incident_id", data.incidentId);
    if (error) throw new Error(error.message);
    const paths = (rows ?? []).map((r) => r.storage_path);
    if (paths.length === 0) return [] as { path: string; url: string }[];
    const { data: signed, error: sErr } = await supabase.storage
      .from("incident-media")
      .createSignedUrls(paths, 60 * 15);
    if (sErr) throw new Error(sErr.message);
    return (signed ?? []).map((s) => ({ path: s.path ?? "", url: s.signedUrl }));
  });
