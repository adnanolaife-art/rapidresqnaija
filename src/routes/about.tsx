import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About RapidResQ Naija — Building Nigeria's emergency network" },
      { name: "description", content: "We're building the emergency response network Nigeria deserves — unified, transparent, and citizen-first." },
      { property: "og:title", content: "About RapidResQ Naija" },
      { property: "og:description", content: "The story behind Nigeria's unified emergency response network." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">About</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Nigeria deserves an emergency network that works.</h1>
        <div className="mt-8 space-y-5 text-lg text-muted-foreground">
          <p>Every year, Nigerians lose loved ones not because help doesn't exist, but because the path to it is broken. Multiple numbers, unclear jurisdictions, no visibility.</p>
          <p>RapidResQ Naija is our answer: one app, one tap, one coordinated network across police, fire, ambulance and FRSC — with families kept in the loop and every action audited.</p>
          <p>We're a Nigerian team building for Nigerian realities: patchy networks, code-mixing, urban chaos and rural distances. This isn't a foreign import — it's built here, for here.</p>
        </div>
        <div className="mt-10">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground soft-shadow hover:bg-primary/90">
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
