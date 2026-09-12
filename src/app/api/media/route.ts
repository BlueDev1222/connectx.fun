import { authenticated, adminDb, apiError } from "@/lib/api";
import { MAX_MEDIA_BYTES, validateMedia } from "@/lib/media-validation";
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    if (!request.headers.get("content-length"))
      throw Error("Upload requires a Content-Length header.");
    if (Number(request.headers.get("content-length")) > MAX_MEDIA_BYTES + 65536)
      throw Error("Upload exceeds 20 MB.");
    const { error } = await db.rpc("cx_upload_check");
    if (error) throw error;
    const form = await request.formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size > MAX_MEDIA_BYTES)
      throw Error("Choose an image or video up to 20 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = validateMedia(bytes, file.type, file.name);
    const path = user.id + "/" + crypto.randomUUID() + "." + ext;
    const result = await adminDb()
      .storage.from("connectx-media")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (result.error) throw result.error;
    return Response.json({ path });
  } catch (e) {
    return apiError(e);
  }
}
