import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact RapidResQ Naija" },
      { name: "description", content: "Reach the RapidResQ Naija team — for agency partnerships, press, or general questions." },
      { property: "og:title", content: "Contact RapidResQ Naija" },
      { property: "og:description", content: "Talk to the team behind Nigeria's unified emergency network." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 pb-20 pt-16 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Let's talk.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Partnerships, press or product questions — we read every message.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Mail, title: "Email", body: "hello@rapidresq.ng" },
            { icon: Phone, title: "Call", body: "+234 800 RESQ 000" },
            { icon: MapPin, title: "Office", body: "Yaba, Lagos" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
              <p className="mt-1 text-base font-medium">{body}</p>
            </div>
          ))}
        </div>
        <form className="mt-12 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" placeholder="Your full name" />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" />
          </div>
          <Field label="Organization" name="org" placeholder="Optional" />
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              placeholder="How can we help?"
            />
          </div>
          <button type="button" className="mt-2 inline-flex w-fit items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Send message
          </button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
    </div>
  );
}
