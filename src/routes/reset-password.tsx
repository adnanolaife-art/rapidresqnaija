import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Siren, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — RapidResQ Naija" },
      { name: "description", content: "Set a new password for your RapidResQ Naija account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-consumes the recovery token in the URL hash and fires
    // a PASSWORD_RECOVERY event, giving the client a temporary session
    // that permits updateUser({ password }).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Siren className="h-5 w-5" />
          </span>
          <span className="text-base font-bold">RapidResQ Naija</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready
            ? "Choose a strong password you'll remember."
            : "Waiting for reset link to be validated…"}
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">New password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">Confirm new password</label>
            <input
              type={show ? "text" : "password"}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !ready}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
