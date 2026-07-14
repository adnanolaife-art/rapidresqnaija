# Security — RapidResQ Naija

Emergency data is sensitive. Treat every field as PII until proven otherwise.

## Auth
- Lovable Cloud Auth (email + phone OTP for citizens; email + MFA for responders/admins).
- Session stored in Supabase client; server fns verify via `requireSupabaseAuth` middleware.
- **Never** trust client-supplied `user_id` — read from `context.userId`.

## Roles
- Enum `app_role`: `citizen | responder | agency_admin | super_admin`.
- Stored in `public.user_roles` (separate table — never on `profiles`).
- Check via `public.has_role(auth.uid(), 'role')` SECURITY DEFINER function.

## RLS (mandatory on every public table)
- `incidents`: citizen sees own; responder sees assigned or agency-broadcast; admin sees agency scope.
- `user_roles`: user reads own; only super_admin writes.
- `audit_logs`: append-only; readable by admins only.
- `next_of_kin`: owner-only read/write.
- Deny-by-default: no `USING (true)` policies unless the row is truly public.

## Grants (every new table)
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
GRANT ALL ON public.<t> TO service_role;
```
Add `anon` only for genuinely public reads.

## Secrets
- All API keys in Lovable Cloud secrets. Never in code, never in `VITE_*`.
- `VITE_*` = public config only (publishable keys, project URL).

## Webhooks (`/api/public/*`)
- Verify HMAC signature with `timingSafeEqual` **before** parsing body.
- Reject unknown event types.
- Idempotency key required on state-changing webhooks.

## Input validation
- Every server fn: `.inputValidator(z.object({...}).parse)`.
- Coerce numbers, clamp ranges (lat/lng bounds), trim strings, cap lengths.

## Media uploads
- Signed URLs, scoped to incident id.
- MIME + size limits enforced server-side.
- Storage bucket private by default.

## PII handling
- Location precision reduced for analytics (round to 3 decimals).
- Phone numbers masked in admin lists (`+234 ••• •• 1234`).
- Right-to-delete: soft-delete profile, hard-delete media after 30 days.

## Audit
- Every incident state change → `audit_logs` row (actor, action, before, after, ts).
- Admin reads audit; nobody edits it.

## Rate limits
- SOS: 1 active incident per user; new creation blocked while one is `pending|accepted|en_route|on_scene`.
- Login: 5 attempts / 15 min per identifier.
