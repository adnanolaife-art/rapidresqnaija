// Fire-and-forget email helpers for admin messaging.
// Fails soft when the email template system is not scaffolded yet.

async function tryEmail(name: string, to: string, templateData: Record<string, unknown>, idempotencyKey: string) {
  try {
    const modPath = "@/lib/email-templates/send-email";
    const mod = (await import(/* @vite-ignore */ modPath).catch(() => null)) as
      | { sendTemplateEmail?: (n: string, t: string, o: unknown) => Promise<unknown> }
      | null;
    if (!mod?.sendTemplateEmail) return;
    await mod.sendTemplateEmail(name, to, { templateData, idempotencyKey });
  } catch (e) {
    console.warn("[admin.server email]", (e as Error).message);
  }
}

export async function emailUserMessage(messageId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: msg } = await supabaseAdmin
    .from("messages")
    .select("id, recipient_id, subject, body, sender_id, created_at")
    .eq("id", messageId)
    .single();
  if (!msg?.recipient_id) return;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", msg.recipient_id)
    .single();
  if (!profile?.email) return;
  await tryEmail(
    "admin-message",
    profile.email,
    {
      name: profile.full_name ?? "there",
      subject: msg.subject ?? "New message from RapidResQ",
      body: msg.body,
    },
    `msg-${msg.id}`,
  );
}

export async function emailBroadcast(messageId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: msg } = await supabaseAdmin
    .from("messages")
    .select("id, subject, body, target_role")
    .eq("id", messageId)
    .single();
  if (!msg) return;

  let userIds: string[] = [];
  if (msg.target_role) {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", msg.target_role);
    userIds = (data ?? []).map((r) => r.user_id);
  } else {
    const { data } = await supabaseAdmin.from("profiles").select("id");
    userIds = (data ?? []).map((p) => p.id);
  }
  if (userIds.length === 0) return;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);
  const recipients = (profiles ?? []).filter((p) => p.email);

  await Promise.all(
    recipients.map((p) =>
      tryEmail(
        "admin-broadcast",
        p.email as string,
        {
          name: p.full_name ?? "there",
          subject: msg.subject ?? "Announcement from RapidResQ",
          body: msg.body,
        },
        `bcast-${msg.id}-${p.id}`,
      ),
    ),
  );
}
