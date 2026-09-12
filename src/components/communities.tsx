"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Blocks, Users, BadgeCheck } from "lucide-react";
import { browserDb, configured } from "@/lib/supabase";
import { useApp } from "./provider";
import { Action, Empty, Field, Loading, Modal, Name, Media } from "./ui";
import { Feed, Report } from "./posts";
import type { Row } from "@/lib/types";
function EntityMedia({
  id,
  kind,
}: {
  id: string;
  kind: "community" | "server";
}) {
  const { upload, notice } = useApp();
  return (
    <div className="entity-media">
      {[kind === "community" ? "icon" : "logo", "banner"].map((slot) => (
        <Field label={"Upload " + slot} key={slot}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const path = await upload(file);
                const { error } = await browserDb().rpc("cx_entity_media", {
                  target: id,
                  kind: kind + "_" + slot,
                  path,
                });
                if (error) throw error;
                notice("Image saved. Refresh this page to view it.");
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          />
        </Field>
      ))}
    </div>
  );
}
export function Community({ handle }: { handle: string }) {
  const { user, command, notice } = useApp();
  const [community, setCommunity] = useState<Row | null>(null),
    [member, setMember] = useState<Row | null>(null),
    [tab, setTab] = useState("Feed"),
    [report, setReport] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0),
    [memberCount, setMemberCount] = useState(0);
  useEffect(() => {
    if (!configured) {
      setError("Connect Supabase to load communities.");
      return;
    }
    void (async () => {
      const db = browserDb();
      const { data, error } = await db
        .from("cx_communities")
        .select("*")
        .eq("handle", handle)
        .single();
      if (error) {
        setError("This community is private, suspended, or unavailable.");
        return;
      }
      setCommunity(data);
      void db
        .rpc("cx_community_count", { target: data.id })
        .then(({ data: n }) => setMemberCount(Number(n) || 0));
      if (user) {
        const { data: m } = await db
          .from("cx_members")
          .select("*")
          .eq("community_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setMember(m);
      }
    })();
  }, [handle, user?.id, version]);
  if (error)
    return (
      <Empty title="Community unavailable">
        {error}
        {user && (
          <Action
            run={async () => {
              const { data, error } = await browserDb().rpc(
                "cx_find_community",
                { handle },
              );
              if (error) throw error;
              if (!data?.id) throw Error("Community unavailable.");
              await command("join", { id: data.id });
              notice("Membership request updated.");
            }}
          >
            Request to join by handle
          </Action>
        )}
      </Empty>
    );
  if (!community) return <Loading />;
  const canManage =
    member?.state === "active" &&
    ["owner", "administrator", "moderator"].includes(member.role);
  return (
    <>
      <div className="page-heading">
        <h1>Community</h1>
      </div>
      <div className="community-cover">
        {community.banner_path ? (
          <Media path={community.banner_path} alt="Community banner" />
        ) : (
          <Users size={46} />
        )}
        <span>{community.category}</span>
      </div>
      <section className="profile-info">
        <div className="community-title">
          <h2>
            {community.name}
            {community.verified && <BadgeCheck size={22} className="lime" />}
          </h2>
          <Action
            className="button small"
            run={async () => {
              await command("join", { id: community.id });
              setVersion((v) => v + 1);
            }}
          >
            {member
              ? member.state === "pending"
                ? "Request pending"
                : member.role === "owner"
                  ? "Owner"
                  : "Leave community"
              : community.privacy === "public"
                ? "Join community"
                : "Request to join"}
          </Action>
        </div>
        <p>{community.description}</p>
        <div className="profile-details">
          <span>
            {community.privacy} community · {memberCount} members
          </span>
          <span>
            Created {new Date(community.created_at).toLocaleDateString()}
          </span>
          <button className="text-link" onClick={() => setReport(true)}>
            Report
          </button>
        </div>
      </section>
      <div className="tabs">
        {["Feed", "About", ...(canManage ? ["Moderation"] : [])].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Feed" ? (
        <Feed communityId={community.id} />
      ) : tab === "About" ? (
        <section className="content-panel">
          <h2>Community rules</h2>
          <p className="preserve-lines">{community.rules}</p>
          <h3>Share an invitation</h3>
          <p>
            Share this community’s link. Private communities require an approved
            membership request.
          </p>
          <Action
            run={async () => {
              await navigator.clipboard.writeText(location.href);
              notice("Community link copied.");
            }}
          >
            Copy invitation link
          </Action>
        </section>
      ) : (
        <CommunityModeration
          community={community}
          member={member!}
          reload={() => setVersion((v) => v + 1)}
        />
      )}{" "}
      {report && (
        <Report
          id={community.id}
          type="community"
          onClose={() => setReport(false)}
        />
      )}
    </>
  );
}
function CommunityModeration({
  community,
  member,
  reload,
}: {
  community: Row;
  member: Row;
  reload: () => void;
}) {
  const { command, notice } = useApp();
  const [tab, setTab] = useState("Members"),
    [rows, setRows] = useState<Row[]>([]),
    [version, setVersion] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      const db = browserDb();
      let q;
      if (tab === "Log")
        q = db
          .from("cx_audit")
          .select("*")
          .eq("community_id", community.id)
          .order("created_at", { ascending: false });
      else if (tab === "Reports")
        q = db
          .from("cx_reports")
          .select("*")
          .eq("target_type", "post")
          .order("created_at", { ascending: false });
      else if (tab === "Posts")
        q = db
          .from("cx_posts")
          .select("*")
          .eq("community_id", community.id)
          .order("created_at", { ascending: false });
      else
        q = db
          .from("cx_members")
          .select("*,person:cx_profiles(*)")
          .eq("community_id", community.id);
      const { data, error } = await q.limit(100);
      if (error) setError(error.message);
      else {
        if (tab === "Reports") {
          const posts = await db
            .from("cx_posts")
            .select("id")
            .eq("community_id", community.id)
            .limit(1000);
          setRows(
            (data || []).filter((r: Row) =>
              (posts.data || []).some((p) => p.id === r.target_id),
            ),
          );
        } else setRows(data || []);
        setError("");
      }
    })();
  }, [tab, version, community.id]);
  return (
    <section className="content-panel">
      <h2>Community moderation</h2>
      <div className="chips">
        {[
          "Members",
          "Join requests",
          "Bans",
          "Mutes",
          "Posts",
          "Reports",
          "Log",
          "Settings",
        ].map((t) => (
          <button
            key={t}
            className={t === tab ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {tab === "Settings" ? (
        <>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await command("community_edit", {
                  id: community.id,
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
                notice("Community updated.");
                reload();
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            {["name", "description", "rules"].map((n) => (
              <Field key={n} label={n}>
                <textarea name={n} defaultValue={community[n]} required />
              </Field>
            ))}
            <Field label="Privacy">
              <select name="privacy" defaultValue={community.privacy}>
                <option>public</option>
                <option>request</option>
                <option>private</option>
              </select>
            </Field>
            <button className="button">Save community</button>
          </form>
          <EntityMedia id={community.id} kind="community" />
          {member.role === "owner" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await command("transfer", {
                    community_id: community.id,
                    id: new FormData(e.currentTarget).get("id"),
                  });
                  notice("Ownership transferred.");
                  reload();
                } catch (e) {
                  notice((e as Error).message);
                }
              }}
            >
              <h3>Transfer ownership</h3>
              <Field label="Active member ID">
                <input name="id" required />
              </Field>
              <label className="check">
                <input type="checkbox" required /> I understand this gives the
                selected member ownership.
              </label>
              <button className="button secondary">Transfer ownership</button>
            </form>
          )}
        </>
      ) : (
        rows
          .filter((r) =>
            tab === "Join requests"
              ? r.state === "pending"
              : tab === "Bans"
                ? r.state === "banned"
                : tab === "Mutes"
                  ? r.state === "muted"
                  : true,
          )
          .map((r, i) => (
            <div key={r.id || r.user_id || i} className="moderation-row">
              {tab === "Log" ? (
                <>
                  <b>{r.action}</b>
                  <p>{r.reason}</p>
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </>
              ) : tab === "Reports" ? (
                <>
                  <p>{r.reason}</p>
                  <Link className="text-link" href={"/post/" + r.target_id}>
                    Review reported post
                  </Link>
                  <ModerateForm
                    id={r.target_id}
                    communityId={community.id}
                    kind="post"
                    reload={() => setVersion((v) => v + 1)}
                  />
                </>
              ) : tab === "Posts" ? (
                <>
                  <p>{r.body}</p>
                  <ModerateForm
                    id={r.id}
                    communityId={community.id}
                    kind="post"
                    reload={() => setVersion((v) => v + 1)}
                  />
                </>
              ) : (
                <>
                  <Name profile={r.person} />
                  <small>
                    {r.user_id} · {r.role} · {r.state}
                  </small>
                  <ModerateForm
                    id={r.user_id}
                    communityId={community.id}
                    kind="member"
                    reload={() => setVersion((v) => v + 1)}
                  />
                </>
              )}
            </div>
          ))
      )}
      {!rows.length && tab !== "Settings" && (
        <Empty title="Nothing to review here" />
      )}
    </section>
  );
}
export function ModerateForm({
  id,
  communityId,
  kind,
  reload,
}: {
  id: string;
  communityId?: string;
  kind: string;
  reload: () => void;
}) {
  const { command, notice } = useApp();
  return (
    <form
      className="moderation-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        try {
          if (kind === "post") {
            const selected = String(d.operation);
            await command("moderate_post", {
              id,
              reason: d.reason,
              ...(selected === "remove"
                ? { removed: true }
                : selected === "restore"
                  ? { removed: false }
                  : selected === "lock"
                    ? { locked: true }
                    : selected === "unlock"
                      ? { locked: false }
                      : selected === "pin"
                        ? { pinned: true }
                        : { remove_media: true }),
            });
          } else
            await command("member", {
              id,
              community_id: communityId,
              state: d.state,
              role: d.role,
              reason: d.reason,
              permissions: String(d.permissions || "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            });
          notice("Moderation action recorded.");
          reload();
        } catch (e) {
          notice((e as Error).message);
        }
      }}
    >
      {kind === "post" ? (
        <Field label="Action">
          <select name="operation">
            {["remove", "restore", "lock", "unlock", "pin", "remove media"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Membership">
            <select name="state">
              {["active", "pending", "banned", "muted"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Role">
            <select name="role">
              {["member", "moderator", "administrator"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Moderator permissions, comma separated">
            <input
              name="permissions"
              placeholder="delete_posts, view_reports, view_logs"
            />
          </Field>
        </>
      )}
      <Field label="Reason">
        <input name="reason" minLength={3} required maxLength={2000} />
      </Field>
      <button className="button small secondary">Apply action</button>
    </form>
  );
}
export function ServerDetail({ id }: { id: string }) {
  const { notice, user } = useApp();
  const [server, setServer] = useState<Row | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!configured) {
      setError("Connect Supabase to view server profiles.");
      return;
    }
    void browserDb()
      .from("cx_servers")
      .select("*,owner:cx_profiles!owner_id(*),community:cx_communities(*)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError("Server unavailable");
        else setServer(data);
      });
  }, [id]);
  if (error) return <Empty title={error} />;
  if (!server) return <Loading />;
  return (
    <>
      <div className="page-heading">
        <h1>Minecraft server</h1>
      </div>
      <div className="community-cover">
        {server.banner_path ? (
          <Media path={server.banner_path} alt="Server banner" />
        ) : (
          <Blocks size={48} />
        )}
        <span>{server.category}</span>
      </div>
      <section className="content-panel">
        <h1>{server.name}</h1>
        {user?.id === server.owner_id && (
          <EntityMedia id={server.id} kind="server" />
        )}
        <p>{server.description}</p>
        <div className="button-row">
          {["java_address", "bedrock_address"]
            .filter((k) => server[k])
            .map((k) => (
              <Action
                key={k}
                run={async () => {
                  await navigator.clipboard.writeText(server[k]);
                  notice("Server address copied.");
                }}
              >
                Copy {k === "java_address" ? "Java" : "Bedrock"} address
              </Action>
            ))}
        </div>
        <dl>
          <dt>Version</dt>
          <dd>{server.version || "Not specified"}</dd>
          <dt>Player count</dt>
          <dd>Not monitored</dd>
          <dt>Server owner</dt>
          <dd>
            <Name profile={server.owner} />
          </dd>
        </dl>
        {server.website && (
          <a
            className="text-link"
            href={server.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit website ↗
          </a>
        )}
        {server.community && (
          <p>
            <Link href={"/community/" + server.community.handle}>
              Explore {server.community.name} →
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
