import { authenticated, apiError } from "@/lib/api";
export async function GET() {
  try {
    const { db, user } = await authenticated();
    const output: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
    };
    for (const [table, column] of [
      ["cx_profiles", "id"],
      ["cx_posts", "author_id"],
      ["cx_reactions", "user_id"],
      ["cx_follows", "follower_id"],
      ["cx_members", "user_id"],
      ["cx_settings", "user_id"],
    ]) {
      const all: unknown[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await db
          .from(table)
          .select("*")
          .eq(column, user.id)
          .range(offset, offset + 499);
        if (error) throw error;
        all.push(...data);
        if (data.length < 500) break;
      }
      output[table.replace("cx_", "")] = all;
    }
    return new Response(JSON.stringify(output, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="connectx-account.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e, 401);
  }
}
