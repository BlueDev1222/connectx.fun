import { authenticated, adminDb, apiError } from "@/lib/api";
import { lookupMinecraft } from "@/lib/minecraft";
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const { error } = await db.rpc("cx_upload_check");
    if (error) throw error;
    const { data: profile } = await db
      .from("cx_profiles")
      .select("minecraft_username")
      .eq("id", user.id)
      .single();
    const identity = await lookupMinecraft(profile?.minecraft_username || "");
    const { error: updateError } = await adminDb()
      .from("cx_profiles")
      .update({
        minecraft_uuid: identity.uuid,
        skin_url: identity.skinUrl,
        cape_url: identity.capeUrl,
        identity_verified: false,
      })
      .eq("id", user.id)
      .eq("minecraft_username", profile!.minecraft_username);
    if (updateError) throw updateError;
    return Response.json(identity);
  } catch (e) {
    return apiError(e);
  }
}
