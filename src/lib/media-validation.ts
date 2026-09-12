export const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
export function validateMedia(
  bytes: Uint8Array,
  mime: string,
  filename: string,
) {
  const signatures: Record<string, { ext: string[]; check: () => boolean }> = {
    "image/jpeg": {
      ext: ["jpg", "jpeg"],
      check: () => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
    },
    "image/png": {
      ext: ["png"],
      check: () =>
        [137, 80, 78, 71, 13, 10, 26, 10].every((x, i) => bytes[i] === x),
    },
    "image/gif": {
      ext: ["gif"],
      check: () =>
        ["GIF87a", "GIF89a"].includes(
          new TextDecoder().decode(bytes.slice(0, 6)),
        ),
    },
    "image/webp": {
      ext: ["webp"],
      check: () =>
        new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
        new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
    },
    "video/mp4": {
      ext: ["mp4"],
      check: () => new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp",
    },
    "video/webm": {
      ext: ["webm"],
      check: () => [26, 69, 223, 163].every((x, i) => bytes[i] === x),
    },
  };
  const rule = signatures[mime],
    ext = filename.split(".").pop()?.toLowerCase();
  if (!rule || !ext || !rule.ext.includes(ext) || !rule.check())
    throw Error(
      "File extension, type, and content must match a supported image or video.",
    );
  if (bytes.length > MAX_MEDIA_BYTES || bytes.length < 12)
    throw Error("Media must be between 12 bytes and 20 MB.");
  return rule.ext[0];
}
