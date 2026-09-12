"use client";
import { useEffect, useState } from "react";
import Link from "@/lib/link";
import { useSearchParams } from "@/lib/navigation";
import {
  Search,
  Plus,
  Users,
  Blocks,
  BadgeCheck,
  ArrowUpRight,
  Globe,
  Copy,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useApp } from "./provider";
import {
  Action,
  Avatar,
  Empty,
  Field,
  Loading,
  Media,
  Modal,
  Name,
} from "./ui";
import { Feed, Report } from "./posts";
import { browserDb, configured } from "@/lib/supabase";
import { playstyles, type Row, type Profile } from "@/lib/types";
export function Directory({
  kind,
}: {
  kind: "communities" | "servers" | "people" | "explore";
}) {
  const params = useSearchParams(),
    { command, notice, user } = useApp();
  const [q, setQ] = useState(params.get("q") || ""),
    [category, setCategory] = useState("All"),
    [items, setItems] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [create, setCreate] = useState(false),
    [page, setPage] = useState(0),
    [version, setVersion] = useState(0),
    [tab, setTab] = useState(params.get("type") || "posts");
  const actual = kind === "explore" ? (tab === "posts" ? "posts" : tab) : kind;
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (!configured) {
          setItems([]);
          return;
        }
        if (actual === "posts") return;
        const table =
          actual === "people"
            ? "cx_profiles"
            : actual === "communities"
              ? "cx_communities"
              : "cx_servers";
        let query = browserDb()
          .from(table)
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * 18, page * 18 + 17);
        if (q)
          query = query.ilike(
            actual === "people" ? "username" : "name",
            "%" + q.replace(/[%_]/g, "") + "%",
          );
        if (category !== "All")
          query = query.eq(
            actual === "people" ? "playstyle" : "category",
            category,
          );
        const { data, error } = await query;
        if (error) throw error;
        if (alive) {
          setItems(data || []);
          setError("");
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, category, actual, page, version]);
  const title =
    kind === "communities"
      ? "Find your community."
      : kind === "servers"
        ? "Your next world awaits."
        : kind === "people"
          ? "Find your people."
          : "Explore";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <small>
            {kind === "servers"
              ? "Discover somewhere worth spawning in."
              : "Follow your curiosity. Find where you belong."}
          </small>
        </div>
        {user && ["servers", "communities"].includes(kind) && (
          <button
            className="icon-button"
            aria-label={"Create " + kind}
            onClick={() => setCreate(true)}
          >
            <Plus />
          </button>
        )}
      </div>
      {kind === "explore" && (
        <div className="tabs">
          {["posts", "people", "communities", "servers"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setCategory("All");
                setPage(0);
              }}
              className={tab === t ? "active" : ""}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {actual === "posts" ? (
        <Feed />
      ) : (
        <>
          <div className="directory-tools">
            <form className="search-box" onSubmit={(e) => e.preventDefault()}>
              <Search size={18} />
              <input
                aria-label="Search directory"
                placeholder={"Search " + actual}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
              />
            </form>
            <div className="chips">
              {[
                "All",
                ...(actual === "people"
                  ? playstyles.slice(0, 6)
                  : actual === "servers"
                    ? [
                        "SMP",
                        "Survival",
                        "PvP",
                        "Anarchy",
                        "Creative",
                        "Modded",
                      ]
                    : [
                        "Building Community",
                        "PvP Community",
                        "Creator Community",
                        "Development Project",
                      ]),
              ].map((c) => (
                <button
                  className={category === c ? "selected" : ""}
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setPage(0);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {error ? (
            <Empty title="Unable to load directory">{error}</Empty>
          ) : loading ? (
            <Loading />
          ) : items.length ? (
            <div className="directory-grid">
              {items.map((item) =>
                actual === "people" ? (
                  <div className="directory-card person-card" key={item.id}>
                    <Avatar profile={item} large />
                    <Name profile={item} />
                    <small>@{item.username}</small>
                    <p>{item.bio || item.playstyle}</p>
                    <Link
                      className="button small secondary"
                      href={"/" + item.username}
                    >
                      View profile
                    </Link>
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    className="directory-card"
                    href={
                      actual === "communities"
                        ? "/community/" + item.handle
                        : "/server/" + item.id
                    }
                  >
                    <div
                      className={
                        "community-art category-" + (items.indexOf(item) % 3)
                      }
                    >
                      {actual === "communities" ? (
                        <Users size={36} />
                      ) : (
                        <Blocks size={36} />
                      )}
                      <span>{item.category}</span>
                    </div>
                    <div className="directory-card-content">
                      <h3>
                        {item.name}
                        {item.verified && (
                          <BadgeCheck size={17} className="lime" />
                        )}
                      </h3>
                      <p>
                        {item.description ||
                          "A new corner of the Minecraft community."}
                      </p>
                      <span className="card-link">
                        {actual === "communities"
                          ? "Explore community"
                          : "View server"}{" "}
                        <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <Empty title="A world of possibilities.">
              {q
                ? "No matches yet. Try another search."
                : `Be among the first to add to ConnectX’s ${actual}.`}
            </Empty>
          )}
          <div className="pagination">
            {page > 0 && (
              <button
                className="button small secondary"
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
            )}
            {items.length === 18 && (
              <button
                className="button small secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
      {create && (
        <Modal
          title={
            kind === "servers" ? "Add a Minecraft server" : "Create a community"
          }
          onClose={() => setCreate(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const data = Object.fromEntries(new FormData(e.currentTarget));
                await command(
                  kind === "servers" ? "server" : "community",
                  data,
                );
                setCreate(false);
                setVersion((x) => x + 1);
                notice("Created. Your corner of ConnectX is ready.");
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            <Field label="Name">
              <input name="name" maxLength={80} required />
            </Field>
            {kind === "communities" && (
              <Field label="Handle">
                <input name="handle" pattern="[a-z0-9_-]{3,40}" required />
              </Field>
            )}
            <Field label="Description">
              <textarea name="description" maxLength={2000} />
            </Field>
            {kind === "communities" ? (
              <>
                <Field label="Privacy">
                  <select name="privacy">
                    <option value="public">Public</option>
                    <option value="request">Request to join</option>
                    <option value="private">Private · invite by handle</option>
                  </select>
                </Field>
                <Field label="Rules">
                  <textarea
                    name="rules"
                    defaultValue="Be respectful. No spam, scams, or harassment."
                    required
                  />
                </Field>
              </>
            ) : (
              <>
                {["java_address", "bedrock_address", "version", "website"].map(
                  (n) => (
                    <Field key={n} label={n.replaceAll("_", " ")}>
                      <input
                        name={n}
                        type={n === "website" ? "url" : "text"}
                        maxLength={150}
                      />
                    </Field>
                  ),
                )}
              </>
            )}
            <Field label="Category">
              <select name="category">
                {(kind === "servers"
                  ? [
                      "Survival",
                      "SMP",
                      "Anarchy",
                      "PvP",
                      "Creative",
                      "Minigames",
                      "Hardcore",
                      "Modded",
                    ]
                  : [
                      "Building Community",
                      "PvP Community",
                      "Creator Community",
                      "Minecraft Server",
                      "Development Project",
                      "Mod Project",
                      "Client Project",
                      "Organization",
                    ]
                ).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <button className="button">
              Create {kind === "servers" ? "server" : "community"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function ProfilePage({ username }: { username: string }) {
  const { user, ready, command, notice } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Posts"),
    [following, setFollowing] = useState(false),
    [counts, setCounts] = useState([0, 0]),
    [report, setReport] = useState(false),
    [version, setVersion] = useState(0),
    [list, setList] = useState<Row[] | null>(null),
    [listDirection, setListDirection] = useState("followers");
  useEffect(() => {
    if (!ready) return;
    if (!configured) {
      setError("Connect Supabase to view player profiles.");
      return;
    }
    const name = username === "profile" ? user?.username : username;
    if (!name) {
      setError("Sign in to open your profile.");
      return;
    }
    void (async () => {
      const db = browserDb();
      const { data, error } = await db
        .from("cx_profiles")
        .select("*")
        .eq("username", name.toLowerCase())
        .single();
      if (error) {
        setError("This profile is private, unavailable, or does not exist.");
        return;
      }
      setProfile(data as Profile);
      setError("");
      const [a, b, c] = await Promise.all([
        db
          .from("cx_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", data.id)
          .eq("accepted", true),
        db
          .from("cx_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", data.id)
          .eq("accepted", true),
        user
          ? db
              .from("cx_follows")
              .select("*")
              .eq("follower_id", user.id)
              .eq("following_id", data.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setCounts([a.count || 0, b.count || 0]);
      setFollowing(Boolean(c.data));
    })();
  }, [username, user?.id, ready, version]);
  if (error)
    return (
      <Empty title="Profile unavailable">
        {error}
        <br />
        <Link href="/login" className="text-link">
          Sign in
        </Link>
        <form
          className="private-follow"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const result = await browserDb().rpc("cx_find_profile", {
                handle: username.toLowerCase(),
              });
              if (result.error) throw result.error;
              if (!result.data?.id) throw Error("Account unavailable.");
              await command("follow", { id: result.data.id });
              notice("Follow request sent.");
            } catch (e) {
              notice((e as Error).message);
            }
          }}
        >
          {user && (
            <button className="button small secondary">
              Request to follow @{username}
            </button>
          )}
        </form>
      </Empty>
    );
  if (!profile) return <Loading />;
  const own = profile.id === user?.id;
  async function showList(direction: "followers" | "following") {
    setListDirection(direction);
    const db = browserDb();
    const { data, error } = await db
      .from("cx_follows")
      .select(
        direction === "followers"
          ? "person:cx_profiles!follower_id(*)"
          : "person:cx_profiles!following_id(*)",
      )
      .eq(
        direction === "followers" ? "following_id" : "follower_id",
        profile!.id,
      )
      .eq("accepted", true)
      .limit(100);
    if (error) notice(error.message);
    else setList(data || []);
  }
  return (
    <>
      <div className="page-heading">
        <h1>{profile.display_name}</h1>
      </div>
      <div className="profile-banner">
        {profile.banner_path ? (
          <Media path={profile.banner_path} alt="Profile banner" />
        ) : (
          <span>BUILD YOUR OWN WORLD.</span>
        )}
      </div>
      <section className="profile-info">
        <div className="profile-top">
          <Avatar profile={profile} large />
          <div className="button-row">
            {own ? (
              <Link href="/settings" className="button small secondary">
                Edit profile
              </Link>
            ) : (
              <>
                <Action
                  className={"button small " + (following ? "secondary" : "")}
                  run={async () => {
                    await command("follow", { id: profile.id });
                    setVersion((v) => v + 1);
                  }}
                >
                  {following ? "Following / requested" : "Follow"}
                </Action>
                <Link
                  href={"/messages?to=" + profile.id}
                  className="button small secondary"
                >
                  Message
                </Link>
                <details className="profile-more">
                  <summary>•••</summary>
                  <Action
                    run={async () => {
                      await command("block", { id: profile.id });
                      notice("Block updated.");
                      setVersion((v) => v + 1);
                    }}
                  >
                    Block / unblock
                  </Action>
                  <Action
                    run={async () => {
                      await command("mute", { id: profile.id });
                      notice("Mute updated.");
                    }}
                  >
                    Mute / unmute
                  </Action>
                  <button onClick={() => setReport(true)}>Report</button>
                </details>
              </>
            )}
          </div>
        </div>
        <h2>
          <Name profile={profile} />
        </h2>
        <small>@{profile.username}</small>
        <p className="profile-bio">
          {profile.bio || "A new player in the ConnectX world."}
        </p>
        <div className="profile-details">
          {profile.location && (
            <span>
              <MapPin size={15} />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer">
              <Globe size={15} />
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span>
            <CalendarDays size={15} />
            Joined{" "}
            {new Date(profile.created_at).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="profile-counts">
          <button onClick={() => void showList("followers")}>
            <b>{counts[0]}</b> followers
          </button>
          <button onClick={() => void showList("following")}>
            <b>{counts[1]}</b> following
          </button>
        </div>
        <div className="minecraft-identity">
          <Blocks size={23} />
          <div>
            <b>{profile.minecraft_username || "Minecraft identity"}</b>
            <small>
              {profile.minecraft_username
                ? "Self-declared · ownership not verified"
                : "Add your Minecraft username in Settings"}
            </small>
          </div>
          <span>{profile.playstyle}</span>
        </div>
        {profile.minecraft_uuid && (
          <small>Minecraft UUID: {profile.minecraft_uuid}</small>
        )}
        {profile.skin_url && (
          <div className="minecraft-texture">
            <img
              src={profile.skin_url}
              alt={"Minecraft skin texture for " + profile.minecraft_username}
              width={96}
              height={96}
            />
            <small>Public skin texture · account ownership unverified</small>
          </div>
        )}
        {profile.favorite_server && (
          <p className="muted">
            Favorite server: {profile.favorite_server} · {profile.version}
          </p>
        )}
      </section>
      <div className="tabs">
        {["Posts", "Replies", "Media", "Likes", "Communities"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Communities" ? (
        <Memberships id={profile.id} />
      ) : tab === "Replies" ? (
        <ProfileReplies id={profile.id} />
      ) : (
        <Feed
          key={tab}
          authorId={profile.id}
          mediaOnly={tab === "Media"}
          likes={tab === "Likes"}
        />
      )}{" "}
      {report && (
        <Report
          id={profile.id}
          type="profile"
          onClose={() => setReport(false)}
        />
      )}{" "}
      {list && (
        <Modal title="Connections" onClose={() => setList(null)}>
          {list.length ? (
            list.map((r, i) => (
              <div className="connection-row" key={i}>
                <Avatar profile={r.person} />
                <Name profile={r.person} />
                {own && listDirection === "followers" && r.person && (
                  <Action
                    run={async () => {
                      await command("follow_request", {
                        id: r.person.id,
                        accept: false,
                      });
                      setList(null);
                      setVersion((v) => v + 1);
                    }}
                  >
                    Remove follower
                  </Action>
                )}
              </div>
            ))
          ) : (
            <Empty title="No visible connections yet" />
          )}
        </Modal>
      )}
    </>
  );
}
function Memberships({ id }: { id: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    void browserDb()
      .from("cx_members")
      .select("*,community:cx_communities(*)")
      .eq("user_id", id)
      .eq("state", "active")
      .limit(50)
      .then(({ data }) => setRows(data || []));
  }, [id]);
  return (
    <div className="panel-list">
      {rows.length ? (
        rows.map((r) => (
          <Link key={r.community_id} href={"/community/" + r.community?.handle}>
            {r.community?.name} <span className="muted">{r.role}</span>
          </Link>
        ))
      ) : (
        <Empty title="No visible communities" />
      )}
    </div>
  );
}
function ProfileReplies({ id }: { id: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    void browserDb()
      .from("cx_posts")
      .select("id,body,parent_id")
      .eq("author_id", id)
      .not("parent_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setRows(data || []));
  }, [id]);
  return (
    <div className="panel-list">
      {rows.length ? (
        rows.map((r) => (
          <Link key={r.id} href={"/post/" + r.parent_id}>
            {r.body}
          </Link>
        ))
      ) : (
        <Empty title="No replies yet" />
      )}
    </div>
  );
}
