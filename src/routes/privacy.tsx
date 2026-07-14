import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — RapidResQ Naija" },
      { name: "description", content: "How RapidResQ Naija handles your data." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy</h1>
        <p className="mt-4 text-muted-foreground">
          We treat every field as PII until proven otherwise. Location is only shared with the
          responder handling your incident and your listed next-of-kin. Full policy coming soon.
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
