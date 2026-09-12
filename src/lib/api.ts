import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverDb } from "./server";
export async function authenticated(request?: Request) {
  if (request && request.method !== "GET") {
    const origin = request.headers.get("origin");
    const expected = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ).origin;
    if (origin !== expected) throw Error("Invalid request origin.");
  }
  const db = await serverDb();
  if (!db) throw Error("Supabase is not configured.");
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw Error("Sign in to continue.");
  const { data: profile } = await db
    .from("cx_profiles")
    .select("status")
    .eq("id", user.id)
    .single();
  if (profile?.status !== "active")
    throw Error("An active account is required.");
  return { db, user };
}
export function adminDb() {
  if (!process.env.SUPABASE_SECRET_KEY)
    throw Error(
      "This feature requires the server-only Supabase secret key to be configured.",
    );
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function apiError(e: unknown, status = 400) {
  return Response.json(
    { error: e instanceof Error ? e.message : "Request failed." },
    { status },
  );
}
