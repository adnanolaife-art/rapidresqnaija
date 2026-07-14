import { createFileRoute, Link } from "@tanstack/react-router";
import { Siren, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to RapidResQ Naija" },
      { name: "description", content: "Sign in or create your RapidResQ Naija account to activate one-tap SOS." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(50% 60% at 20% 20%, oklch(1 0 0 / 0.25), transparent 70%), radial-gradient(40% 50% at 90% 80%, oklch(0.58 0.24 27 / 0.35), transparent 70%)" }}
          aria-hidden
        />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Siren className="h-5 w-5" />
          </span>
          <span className="text-base font-bold">RapidResQ Naija</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">One tap.<br />Help on the way.</h2>
          <p className="mt-4 max-w-sm text-primary-foreground/85">
            Sign in to activate SOS, add your next-of-kin and stay ready before you need it.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/70">Protected by Lovable Cloud. Your data is never sold.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Siren className="h-5 w-5" />
              </span>
              <span className="text-base font-bold">RapidResQ Naija</span>
            </Link>
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight lg:mt-0">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with phone or email to continue.</p>
          <div className="mt-8 grid gap-3">
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Phone className="h-4 w-4" /> Continue with phone
            </button>
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-accent">
              <Mail className="h-4 w-4" /> Continue with email
            </button>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            Authentication is not yet wired up. Enable Lovable Cloud to activate real sign-in with
            phone OTP and email.
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
