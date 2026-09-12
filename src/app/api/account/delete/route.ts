import { authenticated, adminDb, apiError } from "@/lib/api";
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const payload = await request.json();
    if (payload.confirmation !== "DELETE")
      throw Error("Deletion confirmation is required.");
    const [communities, servers, role] = await Promise.all([
      db.from("cx_communities").select("id").eq("owner_id", user.id).limit(1),
      db.from("cx_servers").select("id").eq("owner_id", user.id).limit(1),
      db.from("cx_roles").select("role").eq("user_id", user.id).single(),
    ]);
    if (communities.error || servers.error || role.error)
      throw Error("Unable to verify account ownership.");
    if (communities.data?.length || role.data?.role === "owner")
      throw Error(
        "Transfer community and platform ownership before deleting your account.",
      );
    const admin = adminDb();
    // Disable writes before cleanup. A retry can be performed by staff if storage is unavailable.
    const { error: statusError } = await admin
      .from("cx_profiles")
      .update({ status: "deactivated" })
      .eq("id", user.id);
    if (statusError) throw statusError;
    for (;;) {
      const { data, error } = await admin.storage
        .from("connectx-media")
        .list(user.id, { limit: 100 });
      if (error) throw error;
      if (!data.length) break;
      const removed = await admin.storage
        .from("connectx-media")
        .remove(data.map((f) => user.id + "/" + f.name));
      if (removed.error) throw removed.error;
    }
    const { error: serverError } = await admin
      .from("cx_servers")
      .delete()
      .eq("owner_id", user.id);
    if (serverError) throw serverError;
    const {
      data: { session },
    } = await db.auth.getSession();
    if (session) {
      const signedOut = await admin.auth.admin.signOut(
        session.access_token,
        "global",
      );
      if (signedOut.error) throw signedOut.error;
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return Response.json({ deleted: true });
  } catch (e) {
    return apiError(e);
  }
}
