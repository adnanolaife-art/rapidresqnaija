# Component Builder Guide

How to add a new UI component to RapidResQ Naija.

## Decision tree
1. Is it a **shadcn primitive** (Button, Dialog, Input)? Use as-is from `src/components/ui/`. Don't fork.
2. Is it a **feature composition** (IncidentCard, SosButton)? Create under `src/components/<feature>/`.
3. Is it a **layout** (AppShell, DashboardShell)? Create under `src/components/layout/`.

## Template
```tsx
// src/components/incidents/IncidentCard.tsx
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/incidents/StatusPill";
import type { Incident } from "@/domain/incident";

type Props = {
  incident: Incident;
  onAccept?: (id: string) => void;
  className?: string;
};

export function IncidentCard({ incident, onAccept, className }: Props) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        "flex flex-col gap-3",
        className,
      )}
      aria-label={`Incident ${incident.code}`}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{incident.type}</h3>
        <StatusPill status={incident.status} />
      </header>
      {/* ... */}
    </article>
  );
}
```

## Rules
- **Props first.** Fully typed, no `any`. `className` always optional passthrough via `cn()`.
- **Semantic tokens only.** `bg-card`, `text-muted-foreground` — never `bg-white`, `text-[#333]`.
- **Composable.** Accept `children` or slot props over hardcoded content.
- **Accessible.** `aria-*` on icon buttons, `role` where semantics need help.
- **No data fetching inside presentation.** Fetch in the route/hook, pass down.
- **Loading & empty states are required** for any component that renders async data.
- **Storybook-ready mindset:** component works with props alone, no hidden context.

## SOS button (special)
- Min 88×88 px, `rounded-full`, `bg-emergency text-emergency-foreground`.
- Haptic (`navigator.vibrate?.(50)`) + optimistic UI on press.
- Never gated behind a modal on first press.

## Checklist before merging
- [ ] Renders in light + dark
- [ ] Keyboard reachable, visible focus
- [ ] No hardcoded color/spacing values
- [ ] Loading + empty + error states covered where relevant
- [ ] Under 150 LOC or split
