# GitHub Pages + Supabase deployment

ConnectX requires only the existing GitHub repository and Supabase project. No Node server runs on your PC or another web host.

## Frontend

1. GitHub repository Settings → Pages: choose GitHub Actions as Source; keep connectx.fun as custom domain.
2. The pages.yml workflow installs locked dependencies, typechecks, tests, builds static dist files, and deploys them. Pushes to main trigger it automatically.
3. The published artifact includes CNAME and .nojekyll. Static assets use the root base for the custom domain.
4. Routes use /#/ paths so direct links and refreshes work on Pages. Do not remove the hash without implementing a different static routing strategy.

## Supabase

The four existing migrations are already applied. The connectx-api Edge Function is deployed separately from the frontend and is not redeployed by the Pages workflow. After editing backend code, deploy it using the Supabase connector or CLI. Keep the included verify_jwt=false setting only while the explicit Auth getUser(token) checks remain intact.

Supabase supplies SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY inside the Edge runtime. Never copy the service-role key to GitHub, frontend environment variables, or Pages files. The browser sends its signed-in access token when calling protected endpoints.

Auth URL configuration: Site URL https://connectx.fun and allowed redirect https://connectx.fun/**. Configure production SMTP and password/abuse policies. The remaining previously reported security advisor warning is leaked-password protection disabled.

## Verification and limitations

Static production build, TypeScript, and 13 tests pass. Live Edge checks cover public status, missing/invalid bearer tokens, disallowed origins, and CORS preflight. Full signed-in registration/email/upload/deletion testing requires a staging account; no such test is claimed.

The database remains the source of truth for roles, verification, privacy, blocks, and moderation. Admin JavaScript is public because Pages is static, but private staff data and writes are inaccessible without database authorization. No server-rendered profile metadata is available. Some secondary lists have documented 50–100 row caps; feed relationship filters cap at 1,000. The main directories, feed, and admin lists are paginated.

Chronological feeds, one-to-one messages, 24-hour polls, and explicitly unmonitored server/status metrics retain their existing behavior. Reposts are recorded and counted but do not create duplicate timeline cards. Legal templates and actual operator contact/retention practices require review. Hosting availability is provided by GitHub/Supabase and remains subject to their service limits; an absolute uptime guarantee is not claimed.
