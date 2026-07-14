import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground soft-shadow">
            <Siren className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">
            RapidResQ <span className="text-primary">Naija</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link to="/responders" className="hover:text-foreground">For responders</Link>
          <Link to="/agencies" className="hover:text-foreground">Agencies</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Get the app
          </Link>
        </div>
      </div>
    </header>
  );
}
