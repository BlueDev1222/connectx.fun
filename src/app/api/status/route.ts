import { serverDb } from "@/lib/server";
export async function GET() {
  let database = "Not configured",
    authentication = "Not configured";
  const db = await serverDb();
  if (db) {
    try {
      const { error } = await db
        .from("cx_config")
        .select("key")
        .eq("key", "post_limit");
      database = error ? "Unavailable" : "Reachable";
      const res = await fetch(
        process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/health",
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          },
          signal: AbortSignal.timeout(5000),
        },
      );
      authentication = res.ok ? "Reachable" : "Unavailable";
    } catch {
      database = "Check failed";
    }
  }
  return Response.json(
    {
      website: "Reachable",
      authentication,
      database,
      media: "Not monitored",
      messaging: "Not monitored",
      checked_at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
