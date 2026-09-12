import { NextResponse } from "next/server";
import { serverDb } from "@/lib/server";
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    next = url.searchParams.get("next");
  const destination = next === "/reset-password" ? next : "/home";
  const db = await serverDb();
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, url.origin));
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", url.origin),
  );
}
