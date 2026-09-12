# ConnectX development

This app must run using GitHub Pages and Supabase only. Keep the frontend static (Vite + React), use hash routing for Pages-compatible deep links, and put privileged operations in Supabase Edge Functions. Never reintroduce a Node/Next.js hosting requirement or include a service-role key in frontend code.

All database permissions must be enforced by RLS/RPCs or authenticated Edge Functions. Run npm test, npm run typecheck, and npm run build before publishing. Keep the private schema outside the exposed Data API schemas. Use the existing Supabase project and preserve existing user data.
