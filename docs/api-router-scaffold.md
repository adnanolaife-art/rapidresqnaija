# API & Router Scaffold

Two ways to run server code. Pick the right one.

| Use | Choose |
| --- | --- |
| Client calls own backend (DB read/write, business logic) | `createServerFn` |
| External caller (webhook, cron, public API) | `src/routes/api/public/*` server route |

## 1. Server function (RPC)

File: `src/lib/<feature>.functions.ts` (client-safe path).

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(["medical", "fire", "police", "traffic", "other"]),
  note: z.string().max(500).optional(),
});

export const createIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("incidents")
      .insert({ ...data, citizen_id: userId, status: "pending" })
      .select()
      .single();
    if (error) throw new Error("Could not create incident");
    return row;
  });
```

Call from a component:
```ts
const create = useServerFn(createIncident);
const mutation = useMutation({ mutationFn: create });
```

### Rules
- Read `process.env.*` **inside** `.handler()`, never at module scope.
- `.inputValidator()` before `.handler()`, no interruptions.
- Protected fns must not be called from a public route `loader` (SSR has no token).
- One server fn = one responsibility. Compose in the handler.

## 2. Public API route (webhook / cron)

File: `src/routes/api/public/<name>.ts`.

```ts
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/public/sms-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("x-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", process.env.SMS_WEBHOOK_SECRET!)
          .update(body).digest("hex");
        if (
          sig.length !== expected.length ||
          !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
        ) {
          return new Response("Invalid signature", { status: 401 });
        }
        const payload = JSON.parse(body);
        // ... handle
        return new Response("ok");
      },
    },
  },
});
```

### Rules
- Always signature-verify before parsing.
- Use `supabaseAdmin` (dynamic import inside handler) for privileged writes.
- Return small responses; no HTML.
- Idempotent: check `event_id` against a dedupe table.

## Route file naming (page routes)
- `src/routes/index.tsx` → `/`
- `src/routes/_authenticated/dashboard.tsx` → `/dashboard` (gated)
- `src/routes/incidents.$id.tsx` → `/incidents/:id`
- Every shareable route defines its own `head()` metadata.
