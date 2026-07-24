import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Siren, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to RapidResQ Naija" },
      { name: "description", content: "Sign in or create your RapidResQ Naija account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

const ROLE_OPTIONS: { value: AppRole; label: string; hint: string }[] = [
  { value: "citizen", label: "Citizen", hint: "I want to report emergencies" },
  { value: "responder_police", label: "Police", hint: "Officer / dispatcher" },
  { value: "responder_fire", label: "Fire & Rescue", hint: "Firefighter / rescue" },
  { value: "responder_hospital", label: "Hospital / Ambulance", hint: "Medical responder" },
  { value: "responder_frsc", label: "FRSC", hint: "Road safety officer" },
];

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("citizen");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your email.");
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone, role },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      await refreshRoles();
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Siren className="h-5 w-5" />
          </span>
          <span className="text-base font-bold">RapidResQ Naija</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Every second counts.
            <br />
            Help is closer than you think.
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/85">
            Citizens report. Responders receive. Admins oversee. All in one secure network.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/70">
          Protected by Lovable Cloud. Your data is never sold.
        </p>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Siren className="h-5 w-5" />
              </span>
              <span className="text-base font-bold">RapidResQ Naija</span>
            </Link>
          </div>
          {mode !== "forgot" && (
            <div className="mb-6 inline-flex rounded-xl bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg px-4 py-1.5 font-medium ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg px-4 py-1.5 font-medium ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                Create account
              </button>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Join RapidResQ" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to access your dashboard."
              : mode === "signup"
              ? "Create your account. Admins are granted separately by an existing admin."
              : "Enter your email and we'll send you a reset link."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            {mode === "signup" && (
              <>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium">Full name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 …"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium">I am a…</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {mode !== "forgot" && (
              <div className="grid gap-1.5">
                <label className="text-xs font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="mt-1 self-end text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to sign in
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
