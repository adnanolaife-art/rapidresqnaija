# Code Style — RapidResQ Naija

## Language
- **TypeScript strict.** No `any`; use `unknown` + narrow.
- Prefer `type` for unions/aliases, `interface` only for extensible object contracts.
- Use `zod` for every external boundary (server fn input, webhook body, form).

## React
- Function components + hooks only.
- One component per file. File name = component name (PascalCase).
- Keep components < ~150 LOC — extract subcomponents or hooks.
- Data fetching: TanStack Query (`useSuspenseQuery` in loader-backed routes). Never `useEffect + fetch`.
- Side effects that read `window`/`localStorage`: inside `useEffect` (SSR-safe).

## Files & folders
```
src/
  routes/           # file-based routes only
  components/
    ui/             # shadcn primitives (unchanged)
    <feature>/      # feature-scoped components
  hooks/
  lib/              # *.functions.ts (RPC), utilities
  domain/           # pure logic + types
  integrations/     # supabase client, auth middleware
```

## Naming
- Components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Server fns: `<verbNoun>` inside `<feature>.functions.ts`
- DB tables: `snake_case`, plural (`incidents`, `user_roles`)
- Enums: `snake_case` values (`en_route`)

## Imports
- Absolute via `@/` alias. No deep relative paths (`../../../`).
- Group: node/react → third-party → `@/…` → relative.

## Styling
- Tailwind v4 utilities only. **Zero hardcoded colors.** Use semantic tokens (`bg-primary`, `text-destructive`).
- No inline `style={{ color: '#...' }}` unless dynamic from data (e.g., agency brand).
- Radii, spacing, shadows from tokens in `src/styles.css`.

## Errors
- Server fns: throw typed errors; never leak stack traces to client.
- Client: surface via `toast` + inline message. Never `alert()`.

## Comments
- Explain **why**, not what. Delete dead code, don't comment it out.
