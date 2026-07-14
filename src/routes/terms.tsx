import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — RapidResQ Naija" },
      { name: "description", content: "Terms of use for RapidResQ Naija." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tight">Terms</h1>
        <p className="mt-4 text-muted-foreground">
          RapidResQ Naija is provided to help route emergencies faster. It complements — but does
          not replace — official emergency numbers. Full terms coming soon.
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
