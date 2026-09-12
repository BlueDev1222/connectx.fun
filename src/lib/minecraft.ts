import "server-only";
export type MinecraftIdentity = {
  username: string;
  uuid: string;
  skinUrl: string | null;
  capeUrl: string | null;
  verified: false;
};
export async function lookupMinecraft(
  username: string,
): Promise<MinecraftIdentity> {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username))
    throw Error("Enter a valid Minecraft username.");
  const endpoint = process.env.MINECRAFT_LOOKUP_URL;
  if (!endpoint)
    throw Error(
      "Minecraft skin lookup is not configured. Your self-declared username can still be saved.",
    );
  const url = new URL(endpoint);
  if (url.protocol !== "https:")
    throw Error("Minecraft lookup requires a trusted HTTPS endpoint.");
  url.searchParams.set("username", username);
  const response = await fetch(url, {
    headers: process.env.MINECRAFT_LOOKUP_TOKEN
      ? { Authorization: "Bearer " + process.env.MINECRAFT_LOOKUP_TOKEN }
      : {},
    signal: AbortSignal.timeout(5000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok)
    throw Error("Minecraft identity lookup failed. Try again later.");
  const data = await response.json();
  if (
    typeof data.username !== "string" ||
    data.username.toLowerCase() !== username.toLowerCase() ||
    typeof data.uuid !== "string" ||
    !/^[a-f0-9]{32}$/i.test(data.uuid.replaceAll("-", ""))
  )
    throw Error("Identity provider returned an invalid profile.");
  function texture(value: unknown) {
    if (!value) return null;
    if (typeof value !== "string") throw Error("Invalid skin response.");
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "textures.minecraft.net"
    )
      throw Error("Only official Minecraft texture URLs are accepted.");
    return parsed.href;
  }
  return {
    username: data.username,
    uuid: data.uuid.replaceAll("-", ""),
    skinUrl: texture(data.skinUrl),
    capeUrl: texture(data.capeUrl),
    verified: false,
  };
}
