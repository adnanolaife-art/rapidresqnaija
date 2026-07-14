import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, BarChart3, ShieldCheck, FileText, ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "Agencies & Admins — RapidResQ Naija" },
      { name: "description", content: "Manage your agency roster, monitor response KPIs, audit incident history, and export compliance reports." },
      { property: "og:title", content: "RapidResQ for Agencies" },
      { property: "og:description", content: "Analytics, audit, roster and escalation — one console." },
    ],
  }),
  component: Agencies,
});

function Agencies() {
  const features = [
    { icon: BarChart3, title: "Response analytics", body: "ETA, resolution time, false-alarm rate — sliced by station and time." },
    { icon: Users, title: "Roster & shifts", body: "Manage responders, shift schedules and jurisdictions in one place." },
    { icon: ShieldCheck, title: "Audit trail", body: "Every accept, transition and resolution is recorded and non-editable." },
    { icon: FileText, title: "Compliance exports", body: "One-click CSV/PDF for monthly government reporting." },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">For Agencies</span>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Run your emergency operation like a modern org.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          A single console for your entire agency — from state HQ to the local station. Built with
          Nigerian public-service workflows in mind.
        </p>
        <div className="mt-8">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground soft-shadow hover:bg-primary/90">
            Book a briefing <ArrowRight className="h-4 w-4" />
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
