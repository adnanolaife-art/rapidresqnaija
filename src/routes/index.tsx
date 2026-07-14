import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Siren, MapPin, Users, Radio, ShieldCheck, Ambulance, Flame, Car,
  ArrowRight, Phone, Bell, Activity,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Agencies />
      <Surfaces />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, oklch(0.55 0.15 155 / 0.18), transparent 70%), radial-gradient(50% 40% at 90% 20%, oklch(0.58 0.24 27 / 0.12), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Activity className="h-3.5 w-3.5" /> Live across 36 states
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            One tap. <span className="text-primary">Help on the way.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            RapidResQ Naija unites police, fire, ambulance and FRSC into a single SOS. Your
            location, your family, the nearest responder — connected in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground soft-shadow transition hover:bg-primary/90">
              Get RapidResQ <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-base font-semibold text-foreground hover:bg-accent">
              See how it works
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 text-sm">
            <Stat kpi="< 8s" label="Alert to dispatch" />
            <Stat kpi="4" label="Agencies unified" />
            <Stat kpi="24/7" label="Live monitoring" />
          </dl>
        </div>
        <div className="relative"><SosPreview /></div>
      </div>
    </section>
  );
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div>
      <dt className="text-2xl font-bold tabular-nums text-foreground">{kpi}</dt>
      <dd className="mt-1 text-muted-foreground">{label}</dd>
    </div>
  );
}

function SosPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-transparent to-emergency/15 blur-2xl" aria-hidden />
      <div className="rounded-[2rem] border border-border bg-card p-5 soft-shadow">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">RapidResQ</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> GPS locked
          </span>
        </div>
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            aria-label="Send SOS"
            className="emergency-glow relative flex h-48 w-48 items-center justify-center rounded-full bg-emergency text-emergency-foreground ring-8 ring-emergency/15 transition active:scale-95"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-emergency/30" aria-hidden />
            <div className="relative flex flex-col items-center">
              <Siren className="h-10 w-10" />
              <span className="mt-2 text-xl font-extrabold tracking-wide">SOS</span>
              <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">Hold to send</span>
            </div>
          </button>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Sends location, alerts family, notifies the closest responder.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { icon: Ambulance, label: "Medical" },
            { icon: Flame, label: "Fire" },
            { icon: ShieldCheck, label: "Police" },
            { icon: Car, label: "FRSC" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-3 text-xs font-medium">
              <Icon className="h-5 w-5 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:px-6">
        <span>Nigerian Police Force</span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
        <span>Federal Fire Service</span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
        <span>NEMA</span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
        <span>FRSC</span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
        <span>State Ambulance Services</span>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Siren, title: "Tap SOS", body: "Choose emergency type or hold the button. Voice, photo and note optional." },
    { icon: MapPin, title: "We locate you", body: "Precise GPS + reverse geocoded address is attached instantly." },
    { icon: Radio, title: "Nearest responder accepts", body: "Dispatched to police, fire, ambulance or FRSC — whichever is closest." },
    { icon: Bell, title: "Family gets notified", body: "Your next-of-kin receives an SMS with a live tracking link." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for the moments that matter most</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          A calm interface for the worst day. Big buttons, one-hand use, works on low bandwidth.
        </p>
      </div>
      <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="relative rounded-2xl border border-border bg-card p-6 soft-shadow">
            <span className="absolute right-4 top-4 text-xs font-bold text-muted-foreground/60">0{i + 1}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Agencies() {
  const items = [
    { icon: Ambulance, label: "Medical", desc: "Ambulance dispatch, hospital handoff, medical history relayed." },
    { icon: Flame, label: "Fire", desc: "Nearest station alerted with structure type and access notes." },
    { icon: ShieldCheck, label: "Police", desc: "Silent alerts, evidence capture, family confirmation." },
    { icon: Car, label: "FRSC", desc: "Road incidents geo-tagged with photos and vehicle info." },
  ];
  return (
    <section className="bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Every agency, one network</h2>
            <p className="mt-3 text-muted-foreground">
              We route to the right desk in the right jurisdiction — no callbacks, no confusion.
            </p>
          </div>
          <Link to="/agencies" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Partner with us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{label}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Surfaces() {
  const surfaces = [
    { tag: "Citizen", title: "The SOS in your pocket", body: "One-tap alerts, family tracking link, incident chat with the responder team.", icon: Phone, cta: ["Get the app", "/auth"] as const },
    { tag: "Responder", title: "Command dashboard", body: "Live queue, accept & assign, GPS routing, status transitions, evidence intake.", icon: Radio, cta: ["Responder login", "/responders"] as const },
    { tag: "Admin", title: "Agency & audit console", body: "Analytics, agency roster, audit log, escalation controls, compliance exports.", icon: Users, cta: ["Admin console", "/agencies"] as const },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Three surfaces. One mission.</h2>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {surfaces.map(({ tag, title, body, icon: Icon, cta }) => (
          <div key={tag} className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">{tag}</span>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">{title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{body}</p>
            <Link to={cta[1]} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {cta[0]} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-primary-foreground sm:px-14">
        <div
          className="absolute inset-0 -z-0 opacity-30"
          style={{ background: "radial-gradient(40% 60% at 90% 0%, oklch(1 0 0 / 0.35), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">When seconds count, don't dial. Tap.</h2>
            <p className="mt-3 text-primary-foreground/85">
              Set up in under a minute. Add your next-of-kin. Be ready before you need it.
            </p>
          </div>
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-base font-semibold text-foreground shadow-lg hover:bg-background/90">
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
