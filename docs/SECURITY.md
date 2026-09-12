# Security design and audit

## Trust boundary

All application tables use RLS. The browser gets SELECT only; writes go through a fixed-action RPC gateway. The gateway validates the current Auth UUID and active database status, then checks ownership, blocks, membership, permissions, and staff roles for the requested operation. Unknown actions fail closed. User-editable Auth metadata is never used for authorization.

`cx_private` must remain outside the exposed PostgREST schemas. Definer helpers live there with an empty search path and explicit EXECUTE grants. Public RPC wrappers use SECURITY INVOKER. The rate-limit and notification helpers are not directly granted to API roles. Private settings, bookmarks, notifications, messages, staff notes, and audit records have distinct read policies. Engagement RPCs return aggregated counts and no voter/bookmark identities.

Administrators have read access to moderated content through RLS, while messages remain participant-only in the application. A trusted infrastructure operator still has database access. Messages are not end-to-end encrypted. Application audit records cannot be edited or deleted by browser roles; a database superuser can change them, so use external audit shipping for stronger immutability.

## Authentication and abuse

Supabase Edge Functions validate bearer tokens with `getUser`; the browser manages persistent Supabase sessions. Account and role status are read from the DB, not from editable cookies. DB mutation limits are transactional: 90 commands/minute, 8 posts/minute, 20 messages/minute, 5 reports/minute, 3 support tickets/minute, 2 new communities/servers per minute, and 6 uploads/minute per account. Limits are not IP/device identity verification and do not replace provider-level bot protection.

Supabase Auth has its own direct endpoint rate limits. Production SMTP, minimum password length, CAPTCHA, leaked-password protection, allowed callback URLs, short access-token lifetime, and email confirmation require dashboard configuration. CAPTCHA keys and challenges are not bundled. Signed-out refresh sessions are revoked, but previously issued access tokens can remain valid until expiry. A deactivated profile immediately blocks application writes and message access.

## Input, output, and media

- SQL receives typed parameters through Supabase RPC; no user-built SQL is executed.
- React escapes user text. Links are tokenized rather than inserted as raw HTML. External links use safe rel attributes.
- Profile/server website columns accept only HTTP(S). Hashtags and usernames are constrained.
- Media POST checks an explicit allowed Origin list, Auth user, rate limit, size, declared MIME, extension, and binary signature. Filenames are generated UUIDs under the owner's UUID.
- Storage is private and has no client upload/update policy. The Supabase-managed server key uploads only after validation. Reads require current RLS authorization and use five-minute signed URLs. A previously issued signed URL remains usable until expiry after a privacy change.
- Signature checks are not malware scanning, decompression-bomb detection, transcoding, or a full media decoder. Production operators should add scanning/transcoding and enforce request body limits at the host. Do not enable unrestricted direct Storage writes.
- The static HTML includes a CSP meta policy restricting scripts and API destinations. GitHub Pages does not support arbitrary app-controlled HTTP response headers.

## Deletion and retention

Account deletion requires a authenticated POST from an allowed origin and explicit confirmation. The handler refuses deletion while the user owns a community or is the platform owner. It deactivates the profile, deletes uploaded files, removes owned server profiles, revokes sessions, then deletes the Auth user. Cascades remove profile data, authored posts, reactions, settings, and conversations/messages. Audit actor references are set null. If a service fails, the account remains inactive for safe staff recovery; deletion across Auth/Storage/Postgres is not an atomic distributed transaction.

Unattached uploads are not automatically garbage-collected in this version. Add a scheduled cleanup of sufficiently old, unreferenced objects after reviewing retention policy. Legal retention and backup expiry must be defined by the operator; no unsupported compliance or instant backup deletion claim is made.

## Verification performed

The automated suite executes all four SQL migrations under simulated Supabase roles in PGlite and tests direct escalation attempts, private content and media, bookmarks, DM/block rules, community moderator scope, audit/verification note privacy, reserved names, and edit filter bypass. TypeScript checking and the production static Vite build pass. Live Supabase migrations succeeded; the security advisor reports no database/RLS warnings after hardening. Its remaining warning is dashboard-controlled leaked-password protection being disabled:

https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Live Edge smoke checks verify missing/invalid tokens are rejected, allowed preflights succeed, and untrusted origins are rejected. No browser screenshot, interactive accessibility, SMTP, or live signed-in upload/deletion test is claimed.

