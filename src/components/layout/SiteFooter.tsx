import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Siren className="h-5 w-5" />
            </span>
            <span className="text-base font-bold">RapidResQ Naija</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Emergency response, unified for every Nigerian.
          </p>
        </div>
        <FooterCol title="Product" links={[["How it works", "/how-it-works"], ["For responders", "/responders"], ["Agencies", "/agencies"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"]]} />
        <FooterCol title="Legal" links={[["Privacy", "/privacy"], ["Terms", "/terms"]]} />
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <p>© {new Date().getFullYear()} RapidResQ Naija. All rights reserved.</p>
          <p>Made in Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link to={href} className="hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
