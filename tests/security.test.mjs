import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001",
  bob = "00000000-0000-4000-8000-000000000002",
  eve = "00000000-0000-4000-8000-000000000003";
async function as(id, sql) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id || ""}',false); set role ${id ? "authenticated" : "anon"};`,
  );
  return db.exec(sql);
}
async function command(id, action, payload) {
  return as(
    id,
    `select public.cx_command('${action}','${JSON.stringify(payload).replaceAll("'", "''")}'::jsonb) as result`,
  );
}
before(async () => {
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant select,insert,update,delete on storage.objects to anon,authenticated;`,
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((x) => x.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  await db.exec(
    `insert into auth.users(id,raw_user_meta_data) values('${alice}','{"username":"alice"}'),('${bob}','{"username":"bob"}'),('${eve}','{"username":"eve"}');`,
  );
});
after(() => db.close());
test("anonymous writes and direct role escalation fail", async () => {
  await assert.rejects(command(null, "post", { body: "hello" }));
  await assert.rejects(
    as(
      alice,
      `update public.cx_roles set role='owner' where user_id='${alice}'`,
    ),
  );
  await assert.rejects(
    command(alice, "verify", {
      id: alice,
      target_type: "profile",
      verified: true,
      category: "Staff",
    }),
  );
  await assert.rejects(
    command(alice, "staff", {
      id: alice,
      operation: "role",
      value: "owner",
      reason: "exploit",
    }),
  );
});
test("posts persist; private bookmarks do not leak; author deletion enforced", async () => {
  let r = await command(alice, "post", { body: "A survival build #Builders" });
  const id = r[0].rows[0].result.id;
  await command(alice, "reaction", { id, kind: "bookmark" });
  const rows = await as(
    bob,
    `select * from public.cx_reactions where post_id='${id}'`,
  );
  assert.equal(rows[0].rows.length, 0);
  await assert.rejects(command(bob, "delete_post", { id }));
  await command(bob, "reaction", { id, kind: "like" });
  r = await as(
    bob,
    `select public.cx_post_stats(array['${id}'::uuid]) as stats`,
  );
  assert.equal(r[0].rows[0].stats[id].likes, 1);
});
test("private accounts require approved follow and blocks revoke visibility", async () => {
  await command(alice, "settings", { private_account: true });
  let r = await as(
    bob,
    `select * from public.cx_posts where author_id='${alice}'`,
  );
  assert.equal(r[0].rows.length, 0);
  await command(bob, "follow", { id: alice });
  r = await as(bob, `select * from public.cx_posts where author_id='${alice}'`);
  assert.equal(r[0].rows.length, 0);
  await command(alice, "follow_request", { id: bob, accept: true });
  r = await as(bob, `select * from public.cx_posts where author_id='${alice}'`);
  assert.equal(r[0].rows.length, 1);
  await command(alice, "block", { id: bob });
  r = await as(bob, `select * from public.cx_posts where author_id='${alice}'`);
  assert.equal(r[0].rows.length, 0);
  await assert.rejects(
    command(bob, "message", { recipient: alice, body: "blocked message" }),
  );
  await command(alice, "block", { id: bob });
  await command(alice, "settings", { private_account: false });
});
test("messages remain private and DM preferences are checked server side", async () => {
  let r = await command(alice, "message", {
    recipient: bob,
    body: "Private build coordinates",
  });
  const id = r[0].rows[0].result.id;
  r = await as(
    eve,
    `select * from public.cx_messages where conversation_id='${id}'`,
  );
  assert.equal(r[0].rows.length, 0);
  r = await as(
    bob,
    `select * from public.cx_messages where conversation_id='${id}'`,
  );
  assert.equal(r[0].rows.length, 1);
  await command(bob, "settings", { dm_policy: "nobody" });
  await assert.rejects(
    command(alice, "message", { recipient: bob, body: "Forbidden message" }),
  );
});
test("private community content and moderation are scoped", async () => {
  let r = await command(alice, "community", {
    name: "Builders",
    handle: "builders",
    privacy: "private",
  });
  const cid = r[0].rows[0].result.id;
  r = await command(alice, "post", {
    body: "Private community build",
    community_id: cid,
  });
  const id = r[0].rows[0].result.id;
  r = await as(eve, `select * from public.cx_posts where id='${id}'`);
  assert.equal(r[0].rows.length, 0);
  await assert.rejects(
    command(eve, "moderate_post", {
      id,
      removed: true,
      reason: "unauthorized",
    }),
  );
  await command(bob, "join", { id: cid });
  await command(alice, "member", {
    id: bob,
    community_id: cid,
    state: "active",
    role: "moderator",
    permissions: ["delete_posts"],
    reason: "Trusted builder",
  });
  await command(bob, "moderate_post", {
    id,
    removed: true,
    reason: "Rule violation",
  });
  await assert.rejects(
    command(bob, "member", {
      id: eve,
      community_id: cid,
      state: "active",
      role: "administrator",
      reason: "Escalation",
    }),
  );
  await assert.rejects(command(alice, "deactivate", {}));
});
test("admin verification creates audit without exposing notes", async () => {
  await db.exec(
    `reset role; update public.cx_roles set role='owner' where user_id='${alice}'`,
  );
  await command(alice, "verify", {
    id: bob,
    target_type: "profile",
    verified: true,
    category: "Builder",
    notes: "Private review evidence",
  });
  let r = await as(
    bob,
    `select verified from public.cx_profiles where id='${bob}'`,
  );
  assert.equal(r[0].rows[0].verified, true);
  r = await as(bob, "select * from public.cx_verification_records");
  assert.equal(r[0].rows.length, 0);
  r = await as(alice, "select * from public.cx_audit where action='verified'");
  assert.equal(r[0].rows.length, 1);
  await assert.rejects(as(alice, "delete from public.cx_audit"));
});
test("storage rejects direct uploads and hides another user’s private attachment", async () => {
  await assert.rejects(
    as(
      eve,
      `insert into storage.objects(bucket_id,name) values('connectx-media','${eve}/evil.html')`,
    ),
  );
  await db.exec(
    `reset role; insert into storage.objects(bucket_id,name) values('connectx-media','${alice}/private.png')`,
  );
  let r = await as(eve, "select * from storage.objects");
  assert.equal(r[0].rows.length, 0);
  r = await as(alice, "select * from storage.objects");
  assert.equal(r[0].rows.length, 1);
});
test("reserved handles and spam bypass through edits fail", async () => {
  await assert.rejects(
    command(bob, "profile", { username: "admin", display_name: "Escalation" }),
  );
  await command(alice, "config", {
    key: "blocked_phrases",
    value: ["malware.example"],
  });
  let r = await command(eve, "post", { body: "Allowed post" });
  const id = r[0].rows[0].result.id;
  await assert.rejects(
    command(eve, "edit_post", { id, body: "Visit malware.example" }),
  );
  await assert.rejects(
    command(eve, "post", { body: " ", poll_options: ["", "test"] }),
  );
});
test("trending aggregates distinct creators and obeys privacy", async () => {
  let r = await as(null, "select public.cx_trending() as topics");
  assert.ok(Array.isArray(r[0].rows[0].topics));
  assert.equal(
    r[0].rows[0].topics.find((x) => x.topic === "builders").creators,
    1,
  );
});
