# Deployment

This repository replaces a static site with a Next.js server application. GitHub Pages cannot execute its API routes, SSR authentication, or protected admin page. Deploy to a Next.js-compatible Node host (or a supported Next.js deployment platform). No domain or production web deployment was changed by this implementation.

1. Review and apply migrations on staging first. For the connected existing project, the included migrations have already been applied.
2. Configure the environment from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS origin. Public environment values are compiled into the client and require a rebuild when changed.
3. Set `SUPABASE_SECRET_KEY` only in the server's secret store. It is required for media upload and permanent account deletion. Never include it in frontend configuration, logs, or Git.
4. Configure Supabase Auth URLs, SMTP, email confirmation, password policy, and anti-abuse settings. Confirm email links return to `/auth/callback`.
5. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`. Start with `npm start` behind HTTPS. Set upload body limits to at most 20 MB plus multipart overhead. Forward the original Origin without replacing it with an untrusted hostname.
6. Create the owner using `docs/ADMIN.md`. Test with two ordinary accounts and a separate staff account before directing traffic to the new host.
7. Review legal templates, operator identity/contact details, backups, retention, and support operations. Add an external recovery contact for users unable to sign in. Set up monitoring and incident alerts; the built-in Status page is a connectivity check only.
8. Point the domain to the new web host only after staging validation. Keep database backups and review migration changes before rollout.

## Implemented boundaries

- The home tabs use chronological feeds. No opaque engagement-ranking system is claimed. Reposts are stored, counted, notified, and visible through the original post; this version does not insert duplicate repost cards into timelines.
- Search covers post text/hashtags, people by username, communities and servers by name, with category filters. Feed pages contain 20 posts; directories contain 18; admin pages contain 25. Some secondary membership/connection panels cap results at 50–100 and feed relationship filters at 1,000; they need cursor pagination before very large accounts are supported.
- Community permissions are a fixed, validated capability vocabulary configurable per moderator, not arbitrary executable policies. All staff actions are checked again in Postgres.
- Minecraft username, UUID, skin/cape fields, favorite version/server, and playstyle have storage support. The default identity is self-declared. A trusted identity adapter contract is included for lookup; actual verified Microsoft/Minecraft ownership is a future integration requiring an audited OAuth/token exchange. No Minecraft password is stored.
- Direct messages are one-to-one. Group conversations and typing/read indicators are not implemented. Realtime refresh applies to notifications and messages.
- Polls have 2–4 options and close after 24 hours. Uploads support JPEG, PNG, WebP, GIF, MP4, and WebM up to 20 MB. External GIF catalog search, media transcoding, and malware scanning require additional services.
- Status labels database/Auth reachability; media and messaging are explicitly unmonitored. Live Minecraft server player-count monitoring is not configured.
- Exact private account/community handles can receive follow/join requests, while private profile and community content stays hidden.
- Legal pages are templates. No public third-party API, default admin password, external analytics SDK, or verified Minecraft ownership is enabled.

## Rollback and compatibility

The original tables remain untouched except for revoking direct execution of the legacy Auth trigger function. The previous HTML implementation remains in Git history. Rolling the website back does not remove the `cx_` schema. Do not drop tables or reverse migrations without a verified backup and data migration plan. The existing two Auth accounts were given normal, unverified ConnectX profiles; no owner was inferred from a username.
