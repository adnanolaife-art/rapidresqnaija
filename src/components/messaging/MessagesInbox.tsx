import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listMyInbox, markMessageRead, userMessageAdmin } from "@/lib/admin.functions";

export function MessagesInbox() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyInbox);
  const markFn = useServerFn(markMessageRead);
  const sendFn = useServerFn(userMessageAdmin);

  const [open, setOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");

  const inbox = useQuery({ queryKey: ["my-inbox"], queryFn: () => listFn() });

  useEffect(() => {
    const ch = supabase
      .channel("inbox-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["my-inbox"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const unread = (inbox.data ?? []).filter((m) => !m.read_at && m.recipient_id).length;

  const send = useMutation({
    mutationFn: () => sendFn({ data: { subject: subject.trim() || undefined, body: body.trim() } }),
    onSuccess: () => {
      toast.success("Message sent to admin");
      setBody("");
      setSubject("");
      setComposeOpen(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
      >
        <Bell className="h-3.5 w-3.5" />
        Inbox
        {unread > 0 && (
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card shadow-xl sm:right-6 sm:left-auto sm:top-20 sm:mx-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold">Messages</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComposeOpen((v) => !v)}
                className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
              >
                Contact admin
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {composeOpen && (
            <div className="border-b border-border bg-muted/30 p-3">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (optional)"
                className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                maxLength={200}
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Message admin…"
                maxLength={4000}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
              <button
                disabled={!body.trim() || send.isPending}
                onClick={() => send.mutate()}
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                {send.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Send
              </button>
            </div>
          )}
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {inbox.isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
            {inbox.data?.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No messages yet.</div>
            )}
            {inbox.data?.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (!m.read_at && m.recipient_id) {
                    markFn({ data: { id: m.id } }).then(() =>
                      qc.invalidateQueries({ queryKey: ["my-inbox"] }),
                    );
                  }
                }}
                className={`block w-full px-4 py-3 text-left text-sm hover:bg-accent ${!m.read_at && m.recipient_id ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {m.is_broadcast ? "📢 Broadcast" : "Admin"}
                    {m.subject ? ` — ${m.subject}` : ""}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-foreground/80">{m.body}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
