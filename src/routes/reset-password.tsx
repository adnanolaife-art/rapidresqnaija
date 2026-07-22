import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Siren, Loader2, Eye, EyeOff, MailWarning } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — RapidResQ Naija" },
      { name: "description", content: "Set a new password for your RapidResQ Naija account." },
      { property: "og:title", content: "Reset your password — RapidResQ Naija" },
      { property: "og:description", content: "Set a new password for your RapidResQ Naija account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

type ResetState = "checking" | "ready" | "invalid" | "missing";

function getResetLinkError() {
  if (typeof window === "undefined") return "";

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  return (
    hashParams.get("error_description") ||
    searchParams.get("error_description") ||
    hashParams.get("error") ||
    searchParams.get("error") ||
    ""
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [resetState, setResetState] = useState<ResetState>("checking");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const resetLinkError = getResetLinkError();
    if (resetLinkError) {
      setLinkError(resetLinkError.replace(/\+/g, " "));
      setResetState("invalid");
      return;
    }

    // Supabase auto-consumes the recovery token in the URL hash and fires
    // a PASSWORD_RECOVERY event, giving the client a temporary session
    // that permits updateUser({ password }).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setResetState("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setResetState("ready");
        return;
      }

      window.setTimeout(() => {
        setResetState((current) => (current === "checking" ? "missing" : current));
      }, 1200);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
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

  async function resendResetLink(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address first");
      return;
    }

    setResendBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("A fresh password reset link has been sent.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResendBusy(false);
    }
  }

  const ready = resetState === "ready";
  const needsFreshLink = resetState === "invalid" || resetState === "missing";

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
          {ready && "Choose a strong password you'll remember."}
          {resetState === "checking" && "Waiting for reset link to be validated…"}
          {resetState === "invalid" && "This reset link has expired or is no longer valid."}
          {resetState === "missing" && "Open the password reset link from your email, or request a fresh one below."}
        </p>

        {needsFreshLink && (
          <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <div className="flex gap-3">
              <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold text-foreground">Request a new reset link</p>
                <p className="mt-1 text-muted-foreground">
                  {linkError || "Password reset links are time-limited and can only be used once."}
                </p>
              </div>
            </div>

            <form onSubmit={resendResetLink} className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-xs font-medium">
                Email address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>
              <button
                type="submit"
                disabled={resendBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {resendBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send new reset link
              </button>
              <Link to="/auth" className="text-center text-xs font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </form>
          </div>
        )}

        <form onSubmit={onSubmit} className={`mt-6 grid gap-3 ${needsFreshLink ? "hidden" : ""}`}>
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
