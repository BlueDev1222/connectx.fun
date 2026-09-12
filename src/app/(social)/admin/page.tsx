import { serverDb } from "@/lib/server";
import Admin from "@/components/admin";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Page() {
  const db = await serverDb();
  const result = db ? await db.auth.getUser() : null;
  const user = result?.data.user;
  const role =
    user && db
      ? await db.from("cx_roles").select("role").eq("user_id", user.id).single()
      : null;
  const profile =
    user && db
      ? await db.from("cx_profiles").select("status").eq("id", user.id).single()
      : null;
  if (
    !user ||
    !["admin", "owner"].includes(role?.data?.role || "") ||
    profile?.data?.status !== "active"
  )
    return (
      <section className="empty">
        <h1>403 · Staff access only</h1>
        <p>This page requires an active ConnectX administrator account.</p>
        <Link className="button" href="/home">
          Back to home
        </Link>
      </section>
    );
  return <Admin />;
}
