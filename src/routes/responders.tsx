import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, MapPin, ShieldCheck, ClipboardList, ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/responders")({
  head: () => ({
    meta: [
      { title: "For Responders — RapidResQ Naija" },
      { name: "description", content: "A calm command dashboard for police, fire, ambulance and FRSC responders. Live queue, one-tap accept, GPS routing, evidence intake." },
      { property: "og:title", content: "RapidResQ for Responders" },
      { property: "og:description", content: "Live incident queue, accept & route in one tap." },
    ],
  }),
  component: Responders,
});

function Responders() {
  const features = [
    { icon: Radio, title: "Live incident queue", body: "Prioritized by type, distance and severity. One tap to accept." },
    { icon: MapPin, title: "GPS routing", body: "Turn-by-turn route to the citizen with live ETA broadcast." },
    { icon: ClipboardList, title: "Evidence intake", body: "Photos, voice notes and citizen history in one thread." },
    { icon: ShieldCheck, title: "Chain of custody", body: "Every state transition audited automatically." },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">For Responders</span>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Command your shift with clarity.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Built with field responders in Lagos, Abuja and Port Harcourt. Big targets, low bandwidth
          friendly, ruggedized for real conditions.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground soft-shadow hover:bg-primary/90">
            Responder sign in <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/contact" className="inline-flex items-center rounded-xl border border-border px-6 py-3 text-base font-semibold hover:bg-accent">
            Onboard my agency
          </Link>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
