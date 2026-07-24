import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

async function assertTargetNotAdmin(ctx: { supabase: any }, targetUserId: string) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: targetUserId,
    _role: "admin",
  });
  if (isAdmin) throw new Error("Administrator accounts are protected from this action.");
}

/* -------------------- USERS -------------------- */

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, suspended, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const byId = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const list = byId.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      byId.set(r.user_id, list);
    }
    return (profiles ?? []).map((p) => ({ ...p, roles: byId.get(p.id) ?? [] }));
  });

const SuspendInput = z.object({ userId: z.string().uuid(), suspended: z.boolean() });
export const adminSuspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SuspendInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ suspended: data.suspended })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RoleInput = z.object({
  userId: z.string().uuid(),
  role: z.enum([
    "citizen",
    "responder_frsc",
    "responder_police",
    "responder_fire",
    "responder_hospital",
    "admin",
  ]),
  action: z.enum(["add", "remove"]),
});
export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RoleInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.action === "add") {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role })
        .select()
        .maybeSingle();
      if (error && !`${error.message}`.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* -------------------- MESSAGING -------------------- */

const DirectInput = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(4000),
});
export const adminSendDirectMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DirectInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({
        sender_id: context.userId,
        recipient_id: data.recipientId,
        subject: data.subject ?? null,
        body: data.body,
        is_broadcast: false,
      })
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Send failed");
    // Fire-and-forget email
    try {
      const { emailUserMessage } = await import("./admin.server");
      await emailUserMessage(row.id);
    } catch (e) {
      console.warn("email skipped:", (e as Error).message);
    }
    return row;
  });

const BroadcastInput = z.object({
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(4000),
  targetRole: z
    .enum([
      "citizen",
      "responder_frsc",
      "responder_police",
      "responder_fire",
      "responder_hospital",
      "admin",
    ])
    .optional(),
});
export const adminBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BroadcastInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({
        sender_id: context.userId,
        recipient_id: null,
        subject: data.subject ?? null,
        body: data.body,
        target_role: data.targetRole ?? null,
        is_broadcast: true,
      })
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Broadcast failed");
    try {
      const { emailBroadcast } = await import("./admin.server");
      await emailBroadcast(row.id);
    } catch (e) {
      console.warn("broadcast email skipped:", (e as Error).message);
    }
    return row;
  });

export const adminListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("messages")
      .select("id, sender_id, recipient_id, subject, body, is_broadcast, target_role, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* -------------------- USER-SIDE -------------------- */

const UserSendInput = z.object({
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(4000),
});
export const userMessageAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserSendInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // find any admin
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    const admin = admins?.[0];
    if (!admin) throw new Error("No administrator available to receive messages yet.");
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        recipient_id: admin.user_id,
        subject: data.subject ?? null,
        body: data.body,
        is_broadcast: false,
      })
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Send failed");
    return row;
  });

export const listMyInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, subject, body, is_broadcast, target_role, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
