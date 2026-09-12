import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
try {
  process.loadEnvFile(".env.local");
} catch {}
const url = process.env.VITE_SUPABASE_URL;
if (
  !url ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
)
  throw Error("Development seed refuses non-loopback Supabase projects.");
if (!process.env.SUPABASE_SECRET_KEY)
  throw Error("Set the local server key in .env.local.");
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const suffix = Date.now().toString(36);
const players = [
  ["spruce", "Spruce & Stone", "Builder"],
  ["redwire", "Redwire Labs", "Redstone"],
  ["ender", "Ender Trails", "SMP"],
];
for (const [handle, name, playstyle] of players) {
  const email = `${handle}.${suffix}@example.test`,
    password = randomBytes(32).toString("base64url"),
    username = `${handle}_${suffix}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: `[DEV] ${name}` },
  });
  if (error) throw error;
  const client = createClient(
    url,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  for (const [action, payload] of [
    [
      "profile",
      {
        username,
        display_name: `[DEV] ${name}`,
        bio: "Development-only sample account.",
        playstyle,
      },
    ],
    [
      "community",
      {
        name: `[DEV] ${name}`,
        handle: `${handle}-${suffix}`,
        description: "Development-only Minecraft community.",
        privacy: "public",
        category: "Building Community",
      },
    ],
    [
      "post",
      {
        body: `[DEV] A new survival build is taking shape. What would you add next? #Minecraft #Builders`,
      },
    ],
    [
      "post",
      {
        body: "[DEV] Which world should we explore this weekend?",
        poll_options: ["Survival", "Creative", "Modded"],
      },
    ],
    [
      "server",
      {
        name: `[DEV] ${name} SMP`,
        description:
          "Development-only server profile. This address is an example.",
        java_address: "play.example.test",
        version: "1.21",
        category: "SMP",
      },
    ],
  ]) {
    const result = await client.rpc("cx_command", { action, payload });
    if (result.error) throw result.error;
  }
  await client.auth.signOut();
  console.log(
    `Created development fixture @${username}; Auth UUID ${data.user.id}. No password printed.`,
  );
}
