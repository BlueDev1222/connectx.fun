# ConnectX

A Minecraft community social platform built with Next.js 16, React 19, TypeScript, and Supabase (Postgres, Auth, private Storage, and Realtime). Dark forest/lime branding, light mode, desktop sidebars, and mobile navigation.

## Run locally

Requires Node.js 24 and npm. Clone this repository, then:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell use `Copy-Item .env.example .env.local`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. Open http://localhost:3000. Without Supabase configuration, the public UI renders a clearly labeled preview; it does not simulate saved accounts or posts.

The publishable key is intentionally public. Set `SUPABASE_SECRET_KEY` **only in the server environment** for validated media uploads and account deletion. Never use a `NEXT_PUBLIC_` prefix for that key. Environment files are ignored by Git.

## Database setup

Apply the SQL files in `supabase/migrations` in filename order using the Supabase SQL editor or the Supabase CLI migration workflow. Use an empty development project first. The `cx_` prefix isolates this application from the repository's original tables. Original `profiles`, `posts`, and related tables are not renamed or deleted.

The migrations install all tables, indexes, RLS policies, private authorization helpers, allowlisted command RPCs, an Auth registration trigger, a private `connectx-media` bucket, and Realtime publication entries. Existing Auth users receive a nonprivileged `player_<id>` profile. No user becomes an administrator automatically. The old registration trigger's public execution privilege is revoked, while its trigger continues to work.

For local Supabase, install Docker and the Supabase CLI, initialize a local project with `supabase init`, run `supabase start`, and apply the migrations using the local migration workflow. Never run a reset against a production database.

For the existing ConnectX project `onvmeffhmruzshqlwakx`, the four included migrations were applied during implementation. Do not paste them a second time. The local files match the applied migrations.

## Authentication setup

In Supabase Authentication:

- Set Site URL to the deployed origin and allow `/auth/callback` and `/auth/callback?next=/reset-password` on that origin and your local development origin.
- Enable email/password authentication and email confirmation. Configure an SMTP provider for production email delivery.
- Set a minimum password length of 12 and enable leaked-password protection if available on your plan. The live project advisor currently reports leaked-password protection disabled; this dashboard setting remains to be enabled.
- Configure Auth rate limits and bot protection appropriate to your deployment. Supabase's built-in rate limits protect direct Auth requests; application DB writes have separate transactional limits.
- Registration records a username, display name, age confirmation, and terms acceptance timestamp. Age confirmation is a declaration, not identity verification. The operator must review regional eligibility requirements.

Email verification, password reset, email/password changes, local logout, and revocation of other sessions are implemented. Discord, Google, and verified Microsoft/Minecraft ownership are future integrations; no provider is presented as proof of Minecraft ownership.

## Owner and administration

See [secure initial owner setup](docs/ADMIN.md). The `/admin` page checks a current Auth user and database role on the server. Every privileged database command independently checks the same database-backed authorization. Browser storage, usernames, and editable user metadata cannot grant privileges.

## Features

- Public landing, player profiles, Minecraft identity fields, and searchable help/legal/safety pages.
- Text/media/GIF/video posts, links, server addresses, polls, replies, quote links, likes, repost records, private bookmarks, reporting, and 15-minute editing.
- Chronological For you, Following, and Communities feeds, bounded pagination, word/account mute filtering, hashtags, mentions, and distinct-creator trending.
- Public/private/request communities, membership approvals, owner/admin/moderator/member roles, configurable moderator permissions, bans/mutes, content moderation, audit history, and ownership transfer.
- Server directory and profiles, Java/Bedrock address copy, categories, and ownership.
- Private one-to-one messages with attachments, replies, reports, hiding, DM preferences, block checks, and Realtime refresh. Messages are **not end-to-end encrypted**.
- Notifications and follow requests, read controls, profile/account/privacy/appearance settings, JSON export, deactivation, and confirmed account deletion.
- Staff verification for users and communities, moderation queues, account/community restrictions, role assignment by the owner, configuration, support tickets, and append-only application audit logs.

See [implementation boundaries and deployment](docs/DEPLOYMENT.md) and [security design](docs/SECURITY.md) before launch. The legal pages are marked templates and require professional review. Server player counts and the Status page do not invent monitoring results.

## Development data

`npm run seed` creates clearly named development accounts, posts, communities, servers, and hashtags in a **localhost Supabase project only**. It requires `SUPABASE_SECRET_KEY`, generates random passwords, and never prints or installs production default credentials. It refuses non-loopback database URLs. See `scripts/seed.mjs`.

## Validation

```sh
npm run typecheck
npm test
npm run build
npm start
```

Tests execute the SQL migrations in embedded Postgres (PGlite) with simulated Auth and Storage schemas. They exercise actual RLS and RPC behavior for anonymous writes, privilege escalation, private posts, follow approvals, blocks, DM privacy, community role scope, verification/audit privacy, media access, reserved handles, and content filtering. File-validation tests reject spoofed uploads. This is not a substitute for testing production SMTP, Storage credentials, or browser interaction flows against a staging deployment.

## Repository layout

```
src/app/                  Next.js routes, metadata, callbacks, server APIs
src/components/           Feed, profiles, communities, messages, admin, settings
src/lib/                  Supabase clients, types, validation, information content
supabase/migrations/      Versioned schema, authorization, storage, hardening
scripts/                  Local-only seed and audited owner bootstrap
tests/                    Executable SQL permission and upload tests
docs/                     Administration, security, deployment notes
public/community-build.png Original generated illustrative landing asset
```

The former static HTML entrypoints redirect to the new routes when served by Next.js. This full-stack app cannot run on GitHub Pages. `CNAME` is retained as a record of the original domain; it does not deploy the new application.

