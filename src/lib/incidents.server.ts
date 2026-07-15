// Server-only helpers for incident side-effects (email notifications).
// Uses the admin client to look up responders by role and profile emails.

const ROLE_FOR_TYPE: Record<string, string> = {
  medical: "responder_hospital",
  fire: "responder_fire",
  police: "responder_police",
  traffic: "responder_frsc",
  other: "responder_police",
};

export async function notifyResponders(incidentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: incident, error } = await supabaseAdmin
    .from("incidents")
    .select("id,type,description,address,lat,lng,created_at,citizen_id")
    .eq("id", incidentId)
    .single();
  if (error || !incident) return;

  const role = (ROLE_FOR_TYPE[incident.type] ?? "responder_police") as
    | "responder_frsc" | "responder_police" | "responder_fire" | "responder_hospital";
  const { data: matchedRoles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", role);
  const userIds = (matchedRoles ?? []).map((r) => r.user_id);
  // Also include admins
  const { data: adminRoles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  for (const r of adminRoles ?? []) userIds.push(r.user_id);

  if (userIds.length === 0) return;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name")
    .in("id", userIds);
  const recipients = (profiles ?? []).filter((p) => p.email);

  // Try to import the email helper if scaffolded (requires email domain).
  try {
    const mod = (await import("@/lib/email-templates/send-email").catch(() => null)) as
      | { sendTemplateEmail?: (name: string, to: string, opts: unknown) => Promise<unknown> }
      | null;
    if (!mod?.sendTemplateEmail) {
      console.info("[notifyResponders] email templates not scaffolded; skipping send");
      return;
    }
    await Promise.all(
      recipients.map((p) =>
        mod.sendTemplateEmail!("incident-alert", p.email as string, {
          templateData: {
            name: p.full_name ?? "Responder",
            incidentType: incident.type,
            description: incident.description ?? "",
            address: incident.address ?? "",
            lat: incident.lat,
            lng: incident.lng,
          },
          idempotencyKey: `incident-${incident.id}-${p.id}`,
        }),
      ),
    );
  } catch (e) {
    console.warn("[notifyResponders] send failed", e);
  }
}
