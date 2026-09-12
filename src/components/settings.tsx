"use client";
import { useState, useEffect } from "react";
import Link from "@/lib/link";
import { useApp } from "./provider";
import { Action, Empty, Field, Loading, Modal } from "./ui";
import { browserDb } from "@/lib/supabase";
import {edgeJson,downloadExport} from '@/lib/edge-api';
import { playstyles, type Row } from "@/lib/types";
export function SettingsPage() {
  const { user, ready, settings, command, notice, refresh, upload } = useApp();
  const [tab, setTab] = useState("Edit profile"),
    [confirm, setConfirm] = useState(""),
    [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!user || tab !== "Safety") return;
    void (async () => {
      const [b, m] = await Promise.all([
        browserDb().from("cx_blocks").select("*").eq("user_id", user.id),
        browserDb().from("cx_mutes").select("*").eq("user_id", user.id),
      ]);
      setRows([
        ...(b.data || []).map((r) => ({ ...r, kind: "block" })),
        ...(m.data || []).map((r) => ({ ...r, kind: "mute" })),
      ]);
    })();
  }, [tab, user?.id]);
  if (!ready) return <Loading />;
  if (!user)
    return (
      <Empty title="Make this world your own">
        <Link href="/login">Sign in to manage your account.</Link>
      </Empty>
    );
  return (
    <>
      <div className="page-heading">
        <h1>Settings</h1>
      </div>
      <div className="settings-tabs">
        {[
          "Edit profile",
          "Account",
          "Appearance",
          "Privacy",
          "Notifications",
          "Safety",
          "Account management",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="content-panel">
        <h2>{tab}</h2>
        {tab === "Edit profile" ? (
          <>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await command(
                    "profile",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                  await refresh();
                  notice("Profile saved.");
                } catch (e) {
                  notice((e as Error).message);
                }
              }}
            >
              {[
                ["display_name", "Display name"],
                ["username", "Username"],
                ["bio", "Bio"],
                ["location", "Location · optional"],
                ["website", "Website"],
                ["minecraft_username", "Minecraft username · self-declared"],
                ["favorite_server", "Favorite server"],
                ["version", "Favorite Minecraft version"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  {key === "bio" ? (
                    <textarea
                      name={key}
                      defaultValue={user[key]}
                      maxLength={320}
                    />
                  ) : (
                    <input
                      name={key}
                      defaultValue={user[key] || ""}
                      required={["display_name", "username"].includes(key)}
                      type={key === "website" ? "url" : "text"}
                      maxLength={key === "username" ? 24 : 100}
                    />
                  )}
                </Field>
              ))}
              <Field label="Playstyle">
                <select name="playstyle" defaultValue={user.playstyle}>
                  {playstyles.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <button className="button">Save profile</button>
            </form>
            <div className="section-divider" />
            <h3>Minecraft skin and UUID</h3>
            <p>
              Save your Minecraft username first. Lookup associates a public
              skin and UUID; it does not verify account ownership.
            </p>
            <Action
              run={async () => {
                await edgeJson('minecraft',{method:'POST'});
                await refresh();
                notice(
                  "Minecraft profile looked up. Ownership remains unverified.",
                );
              }}
            >
              Look up Minecraft profile
            </Action>
            <div className="section-divider" />
            {["avatar", "banner"].map((kind) => (
              <Field key={kind} label={"Upload " + kind}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const path = await upload(file);
                      await command("profile_media", { kind, path });
                      await refresh();
                      notice("Image updated.");
                    } catch (e) {
                      notice((e as Error).message);
                    }
                  }}
                />
              </Field>
            ))}
          </>
        ) : tab === "Account" ? (
          <>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const d = Object.fromEntries(new FormData(e.currentTarget));
                  const { error } = await browserDb().auth.updateUser({
                    ...(d.email ? { email: String(d.email) } : {}),
                    ...(d.password ? { password: String(d.password) } : {}),
                  });
                  if (error) throw error;
                  notice(
                    "Account update requested. Check your email for confirmations.",
                  );
                } catch (e) {
                  notice((e as Error).message);
                }
              }}
            >
              <Field label="New email address">
                <input name="email" type="email" autoComplete="email" />
              </Field>
              <Field label="New password · at least 12 characters">
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                />
              </Field>
              <button className="button">Update account</button>
            </form>
            <h3>Sessions</h3>
            <p className="muted">
              Sign out other devices if you no longer recognize or use them.
            </p>
            <Action
              run={async () => {
                const { error } = await browserDb().auth.signOut({
                  scope: "others",
                });
                if (error) throw error;
                notice(
                  "Other refresh sessions revoked. Existing access tokens expire shortly.",
                );
              }}
            >
              Sign out other devices
            </Action>
            <h3>Connected accounts</h3>
            <p className="muted">
              Minecraft identities are self-declared. Verified
              Microsoft/Minecraft ownership and additional OAuth providers are
              not enabled.
            </p>
            <Action
              run={async () => {
                await browserDb().auth.signOut();
                location.href = "/";
              }}
            >
              Sign out
            </Action>
          </>
        ) : tab === "Appearance" ? (
          <div className="theme-options">
            {["dark", "light"].map((theme) => (
              <Action
                key={theme}
                className="theme-option"
                run={async () => {
                  document.documentElement.dataset.theme = theme;
                  localStorage.setItem("cx-theme", theme);
                  await command("settings", { theme });
                  await refresh();
                }}
              >
                <span className={"theme-swatch " + theme} />
                {theme === "dark" ? "After dark" : "Daylight"}
              </Action>
            ))}
          </div>
        ) : tab === "Privacy" ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await command("settings", {
                  private_account: f.has("private_account"),
                  likes_visible: f.has("likes_visible"),
                  communities_visible: f.has("communities_visible"),
                  search_visible: f.has("search_visible"),
                  dm_policy: f.get("dm_policy"),
                  mention_policy: f.get("mention_policy"),
                });
                await refresh();
                notice("Privacy preferences saved.");
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            {[
              ["private_account", "Private account · approve new followers"],
              ["likes_visible", "Show my likes publicly"],
              ["communities_visible", "Show my community memberships"],
              ["search_visible", "Allow search engine indexing"],
            ].map(([k, label]) => (
              <label className="check" key={k}>
                <input type="checkbox" name={k} defaultChecked={settings[k]} />
                {label}
              </label>
            ))}
            {[
              ["dm_policy", "Who can message me?"],
              ["mention_policy", "Who can notify me with a mention?"],
            ].map(([k, label]) => (
              <Field key={k} label={label}>
                <select name={k} defaultValue={settings[k]}>
                  <option value="everyone">Everyone</option>
                  <option value="following">People I follow</option>
                  <option value="nobody">Nobody</option>
                </select>
              </Field>
            ))}
            <p className="muted">
              Mention preferences control notifications. Blocks prevent
              interactions and messages in both directions.
            </p>
            <button className="button">Save privacy preferences</button>
          </form>
        ) : tab === "Notifications" ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await command("settings", {
                  notifications: Object.fromEntries(
                    [
                      "like",
                      "reply",
                      "mention",
                      "follow",
                      "message",
                      "community",
                      "verification",
                      "repost",
                    ].map((k) => [k, f.has(k)]),
                  ),
                });
                await refresh();
                notice("Notification preferences saved.");
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            {[
              "like",
              "reply",
              "mention",
              "follow",
              "message",
              "community",
              "verification",
              "repost",
            ].map((k) => (
              <label className="check" key={k}>
                <input
                  type="checkbox"
                  name={k}
                  defaultChecked={settings.notifications?.[k] !== false}
                />
                {k}
              </label>
            ))}
            <button className="button">Save notifications</button>
          </form>
        ) : tab === "Safety" ? (
          <>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const words = String(new FormData(e.currentTarget).get("words"))
                  .split("\n")
                  .map((w) => w.trim())
                  .filter(Boolean);
                try {
                  await command("settings", { muted_words: words });
                  await refresh();
                  notice("Muted words saved.");
                } catch (e) {
                  notice((e as Error).message);
                }
              }}
            >
              <Field label="Muted words and hashtags · one per line">
                <textarea
                  name="words"
                  defaultValue={(settings.muted_words || []).join("\n")}
                />
              </Field>
              <button className="button">Save muted words</button>
            </form>
            <h3>Blocked and muted accounts</h3>
            {rows.map((r, i) => (
              <div className="safety-row" key={i}>
                <small>
                  {r.target_id} · {r.kind}
                </small>
                <Action
                  run={async () => {
                    await command(r.kind, { id: r.target_id });
                    setRows(rows.filter((x) => x !== r));
                  }}
                >
                  Remove
                </Action>
              </div>
            ))}
          </>
        ) : (
          <>
            <h3>Your data, your choice</h3>
            <p>
              Export your profile, posts, reactions, connections, communities,
              and settings as JSON.
            </p>
            <Action run={downloadExport} className="button secondary">
              Download account data
            </Action>
            <h3>Deactivate account</h3>
            <p>
              Your profile and posts become unavailable. Contact support to
              request reactivation. Transfer any communities you own first.
            </p>
            <button
              className="button secondary"
              onClick={() => setConfirm("deactivate")}
            >
              Deactivate account
            </button>
            <h3>Delete account</h3>
            <p>
              Permanent deletion removes your profile, posts, messages, media,
              and account details. Communities must be transferred before you
              can leave.
            </p>
            <button
              className="button danger"
              onClick={() => setConfirm("delete")}
            >
              Delete account permanently
            </button>
          </>
        )}
      </section>
      {confirm && (
        <Modal
          title={
            confirm === "delete"
              ? "Permanently delete your account?"
              : "Deactivate your account?"
          }
          onClose={() => setConfirm("")}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (confirm === "delete") {
                  await edgeJson('delete', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ confirmation: "DELETE" }),
                  });
                } else await command("deactivate");
                await browserDb().auth.signOut();
                location.href = "/";
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            <Field
              label={
                "Type " +
                (confirm === "delete" ? "DELETE" : "DEACTIVATE") +
                " to confirm"
              }
            >
              <input
                required
                pattern={confirm === "delete" ? "DELETE" : "DEACTIVATE"}
              />
            </Field>
            <button className="button danger">Confirm {confirm}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
