import { createFileRoute } from "@tanstack/react-router";
import { Siren, MapPin, Radio, Bell, ShieldCheck, Activity } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How RapidResQ Works — From tap to dispatch in seconds" },
      { name: "description", content: "See how RapidResQ Naija routes your emergency to the nearest police, fire, ambulance or FRSC responder — with family notified in real time." },
      { property: "og:title", content: "How RapidResQ Works" },
      { property: "og:description", content: "From SOS tap to responder dispatch in under 8 seconds." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { icon: Siren, title: "1. You tap SOS", body: "Choose an emergency type or hold the SOS button. Voice, photo, and short note are optional but powerful." },
  { icon: MapPin, title: "2. We locate you", body: "Precise GPS + reverse-geocoded address attach automatically. Works offline with cached last-known location." },
  { icon: Radio, title: "3. Nearest responder accepts", body: "The incident is broadcast to responders on shift within jurisdiction. First accept locks assignment." },
  { icon: Bell, title: "4. Family stays informed", body: "Your next-of-kin gets an SMS with a live tracking link — no app install required for them." },
  { icon: Activity, title: "5. Live incident timeline", body: "Chat with the responder, share media, confirm arrival. Every transition is timestamped." },
  { icon: ShieldCheck, title: "6. Resolved & audited", body: "Once resolved, an audit log is created. Only authorized agency admins can review." },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 pb-20 pt-16 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Designed for the worst day. Calm, fast, reliable.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          RapidResQ Naija turns a chaotic emergency into a coordinated response — with humans on
          both sides and machines doing the routing.
        </p>
        <ol className="mt-14 space-y-4">
          {steps.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-6 soft-shadow">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <SiteFooter />
    </div>
  );
}
