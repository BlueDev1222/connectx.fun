"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ImagePlus,
  ChartNoAxesColumn,
  Server,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MoreHorizontal,
  Plus,
  Send,
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
  relativeTime,
} from "./ui";
import { browserDb, configured } from "@/lib/supabase";
import type { Post, Row } from "@/lib/types";
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+|[@#][A-Za-z0-9_]+)/g).map((part, i) =>
        part.startsWith("http") ? (
          <a
            key={i}
            className="inline-link"
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
          >
            {part}
          </a>
        ) : part.startsWith("@") ? (
          <Link key={i} className="inline-link" href={"/" + part.slice(1)}>
            {part}
          </Link>
        ) : part.startsWith("#") ? (
          <Link
            key={i}
            className="inline-link"
            href={"/explore?q=" + encodeURIComponent(part)}
          >
            {part}
          </Link>
        ) : (
          part
        ),
      )}
    </>
  );
}
export function Report({
  id,
  type,
  onClose,
}: {
  id: string;
  type: string;
  onClose: () => void;
}) {
  const { command, notice } = useApp();
  return (
    <Modal title="Report to ConnectX" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await command("report", {
              id,
              target_type: type,
              reason: d.reason + ": " + d.details,
            });
            notice("Report sent to the moderation queue.");
            onClose();
          } catch (e) {
            notice((e as Error).message);
          }
        }}
      >
        <Field label="Reason">
          <select name="reason">
            {[
              "Spam",
              "Harassment",
              "Hate",
              "Impersonation",
              "Scam",
              "Doxxing",
              "Threats",
              "Illegal content",
              "NSFW content",
              "Malware",
              "Other",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Additional details">
          <textarea name="details" maxLength={1800} />
        </Field>
        <button className="button">Send report</button>
      </form>
    </Modal>
  );
}
export function Composer({
  communityId,
  parentId,
  quoteId,
  onPosted,
}: {
  communityId?: string;
  parentId?: string;
  quoteId?: string;
  onPosted: () => void;
}) {
  const { user, command, upload, notice } = useApp();
  const [body, setBody] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [poll, setPoll] = useState(false),
    [server, setServer] = useState(false),
    [busy, setBusy] = useState(false);
  if (!user)
    return (
      <div className="composer signed-out">
        <Avatar />
        <div>
          <b>Your next connection starts here.</b>
          <p>Join the conversation with Minecraft players like you.</p>
          <Link className="button small" href="/register">
            Create account
          </Link>{" "}
          <Link className="button small secondary" href="/login">
            Sign in
          </Link>
        </div>
      </div>
    );
  return (
    <form
      className="composer"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setBusy(true);
        try {
          const payload: Row = {
            body,
            community_id: communityId,
            parent_id: parentId,
            quote_id: quoteId,
            server_address: data.get("server_address") || "",
          };
          if (poll) {
            payload.poll_options = String(data.get("poll"))
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean);
            if (
              payload.poll_options.length < 2 ||
              payload.poll_options.length > 4
            )
              throw Error("Use 2 to 4 poll options, one per line.");
          }
          if (file) {
            payload.media_path = await upload(file);
            payload.media_type = file.type.startsWith("video/")
              ? "video"
              : "image";
          }
          await command("post", payload);
          setBody("");
          setFile(null);
          setPoll(false);
          setServer(false);
          notice("Post shared.");
          onPosted();
        } catch (err) {
          notice((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Avatar profile={user} />
      <div className="composer-body">
        <textarea
          aria-label={parentId ? "Write a reply" : "Write a post"}
          placeholder={
            parentId
              ? "Add to the conversation…"
              : "What’s happening in your world?"
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          required
        />
        <span className="composer-visibility">
          {communityId
            ? "Community conversation"
            : "A little block of your world"}
        </span>
        {file && (
          <div className="attachment">
            {file.name}
            <button type="button" onClick={() => setFile(null)}>
              Remove
            </button>
          </div>
        )}
        {poll && (
          <Field label="Poll options · one per line · closes in 24 hours">
            <textarea
              name="poll"
              required
              placeholder={"Survival\nCreative"}
              maxLength={400}
            />
          </Field>
        )}
        {server && (
          <Field label="Minecraft server address">
            <input
              name="server_address"
              maxLength={150}
              placeholder="play.yourserver.net"
            />
          </Field>
        )}
        <div className="composer-toolbar">
          <label className="icon-button" title="Attach image, GIF, or video">
            <ImagePlus size={20} />
            <span className="sr-only">Attach image, GIF, or video</span>
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            type="button"
            aria-label="Add poll"
            aria-pressed={poll}
            className="icon-button"
            onClick={() => setPoll(!poll)}
          >
            <ChartNoAxesColumn size={20} />
          </button>
          <button
            type="button"
            aria-label="Add server address"
            aria-pressed={server}
            className="icon-button"
            onClick={() => setServer(!server)}
          >
            <Server size={20} />
          </button>
          <span className="character-count">{body.length}/1000</span>
          <button className="button small" disabled={busy || !body.trim()}>
            {busy ? "Posting…" : parentId ? "Reply" : "Post"} <Plus size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
export function PostCard({
  post,
  stats = {},
  reactions = [],
  reload,
}: {
  post: Post;
  stats?: Row;
  reactions?: string[];
  reload: () => void;
}) {
  const { user, command, notice } = useApp();
  const [reply, setReply] = useState(false),
    [quote, setQuote] = useState(false),
    [report, setReport] = useState(false),
    [remove, setRemove] = useState(false),
    [edit, setEdit] = useState(false);
  const p = post;
  return (
    <article className={"post-card " + (p.removed ? "removed" : "")}>
      <Link href={"/" + p.author?.username}>
        <Avatar profile={p.author} />
      </Link>
      <div className="post-content">
        <div className="post-meta">
          <Name profile={p.author} />
          <span>@{p.author?.username}</span>
          <Link href={"/post/" + p.id}>
            <time dateTime={p.created_at}>{relativeTime(p.created_at)}</time>
          </Link>
          <details className="post-menu">
            <summary aria-label="Post options">
              <MoreHorizontal size={19} />
            </summary>
            <div>
              <button onClick={() => setQuote(true)}>Quote post</button>
              <button onClick={() => setReport(true)}>Report</button>
              {p.author_id === user?.id && (
                <>
                  <button onClick={() => setEdit(true)}>Edit post</button>
                  <button onClick={() => setRemove(true)}>Delete post</button>
                </>
              )}
            </div>
          </details>
        </div>
        {p.community && (
          <Link
            className="community-context"
            href={"/community/" + p.community.handle}
          >
            {p.community.name}
          </Link>
        )}
        {p.pinned && <small className="lime">Pinned by moderators</small>}
        {p.removed && (
          <small className="danger-text">Removed by moderation</small>
        )}
        <p className="post-text">
          <RichText text={p.body} />
        </p>
        {p.edited_at && <small>Edited</small>}
        {p.quote_id && (
          <Link className="quoted-post" href={"/post/" + p.quote_id}>
            View quoted post →
          </Link>
        )}
        {p.media_path && (
          <div className="post-media">
            <Media
              path={p.media_path}
              video={p.media_type === "video"}
              alt={"Media shared by " + p.author?.display_name}
            />
          </div>
        )}
        {p.server_address && (
          <button
            className="server-chip"
            onClick={() =>
              void navigator.clipboard
                .writeText(p.server_address)
                .then(() => notice("Server address copied."))
                .catch(() => notice(p.server_address))
            }
          >
            <Server size={16} />
            {p.server_address}
            <span>Copy IP</span>
          </button>
        )}
        {p.poll_options && (
          <div className="poll">
            {p.poll_options.map((option: string, index: number) => {
              const votes =
                (stats.votes || []).find((v: Row) => v.option === index)
                  ?.count || 0;
              return (
                <Action
                  key={index}
                  className="poll-option"
                  run={async () => {
                    await command("vote", { id: p.id, option: index });
                    reload();
                  }}
                >
                  {option}
                  <span>{votes} votes</span>
                </Action>
              );
            })}
            <small>Closes {new Date(p.poll_closes_at).toLocaleString()}</small>
          </div>
        )}
        <div className="post-actions">
          <button aria-label="Reply" onClick={() => setReply(!reply)}>
            <MessageCircle size={18} />
            {stats.replies || 0}
          </button>
          {(["repost", "like", "bookmark"] as const).map((kind) => {
            const Icon =
              kind === "like" ? Heart : kind === "repost" ? Repeat2 : Bookmark;
            return (
              <Action
                key={kind}
                className={
                  "post-action " + (reactions.includes(kind) ? "selected" : "")
                }
                run={async () => {
                  await command("reaction", { id: p.id, kind });
                  reload();
                }}
              >
                <Icon size={18} />
                <span>
                  {kind === "bookmark"
                    ? ""
                    : stats[kind === "like" ? "likes" : "reposts"] || 0}
                </span>
                <span className="sr-only">{kind}</span>
              </Action>
            );
          })}
          <Action
            className="post-action"
            run={async () => {
              await navigator.clipboard.writeText(
                window.location.origin + "/post/" + p.id,
              );
              notice("Post link copied.");
            }}
          >
            <Share2 size={17} />
            <span className="sr-only">Share post</span>
          </Action>
        </div>
        {reply && (
          <Composer
            parentId={p.id}
            onPosted={() => {
              setReply(false);
              reload();
            }}
          />
        )}
      </div>
      {quote && (
        <Modal title="Quote this post" onClose={() => setQuote(false)}>
          <Composer
            quoteId={p.id}
            onPosted={() => {
              setQuote(false);
              reload();
            }}
          />
        </Modal>
      )}
      {report && (
        <Report id={p.id} type="post" onClose={() => setReport(false)} />
      )}{" "}
      {remove && (
        <Modal title="Delete your post?" onClose={() => setRemove(false)}>
          <p>This permanently removes the post and its replies.</p>
          <Action
            className="button danger"
            run={async () => {
              await command("delete_post", { id: p.id });
              setRemove(false);
              reload();
            }}
          >
            Delete post
          </Action>
        </Modal>
      )}
      {edit && (
        <Modal title="Edit post" onClose={() => setEdit(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const body = new FormData(e.currentTarget).get("body");
              try {
                await command("edit_post", { id: p.id, body });
                setEdit(false);
                reload();
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            <Field label="Available for 15 minutes after posting">
              <textarea
                name="body"
                defaultValue={p.body}
                maxLength={1000}
                required
              />
            </Field>
            <button className="button">Save changes</button>
          </form>
        </Modal>
      )}
    </article>
  );
}
export function Feed({
  authorId,
  communityId,
  parentId,
  bookmarks = false,
  mediaOnly = false,
  likes = false,
}: {
  authorId?: string;
  communityId?: string;
  parentId?: string;
  bookmarks?: boolean;
  mediaOnly?: boolean;
  likes?: boolean;
}) {
  const { user, settings, ready } = useApp(),
    search = useSearchParams();
  const [tab, setTab] = useState("For you"),
    [posts, setPosts] = useState<Post[]>([]),
    [stats, setStats] = useState<Row>({}),
    [reactions, setReactions] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [refresh, setRefresh] = useState(0);
  const query = search.get("q") || "";
  const simple = authorId || communityId || parentId || bookmarks;
  const reload = () => setRefresh((x) => x + 1);
  useEffect(() => {
    setPage(0);
  }, [tab, query, authorId, communityId, bookmarks, mediaOnly, likes]);
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!configured) {
          setPosts([]);
          return;
        }
        if (tab !== "For you" && !user) {
          setPosts([]);
          return;
        }
        const db = browserDb();
        let q = db
          .from("cx_posts")
          .select(
            "*,author:cx_profiles!author_id(*),community:cx_communities!community_id(id,name,handle)",
          )
          .order("created_at", { ascending: false })
          .range(page * 20, page * 20 + 19);
        if (parentId) q = q.eq("parent_id", parentId);
        else q = q.is("parent_id", null);
        if (authorId && !likes) q = q.eq("author_id", authorId);
        if (communityId) q = q.eq("community_id", communityId);
        if (query) q = q.ilike("body", "%" + query.replace(/[%_]/g, "") + "%");
        if (mediaOnly) q = q.not("media_path", "is", null);
        if (tab === "Following" && user) {
          const f = await db
            .from("cx_follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("accepted", true)
            .limit(1000);
          q = q.in(
            "author_id",
            (f.data || []).map((x) => x.following_id),
          );
        }
        if (tab === "Communities" && user) {
          const m = await db
            .from("cx_members")
            .select("community_id")
            .eq("user_id", user.id)
            .eq("state", "active")
            .limit(1000);
          q = q.in(
            "community_id",
            (m.data || []).map((x) => x.community_id),
          );
        }
        if (bookmarks || likes) {
          if (!user) {
            setPosts([]);
            return;
          }
          const r = await db
            .from("cx_reactions")
            .select("post_id")
            .eq("user_id", likes ? authorId || user.id : user.id)
            .eq("kind", likes ? "like" : "bookmark")
            .order("created_at", { ascending: false })
            .range(page * 20, page * 20 + 19);
          q = q
            .in(
              "id",
              (r.data || []).map((x) => x.post_id),
            )
            .range(0, 19);
        }
        const { data, error } = await q;
        if (error) throw error;
        let rows = (data || []) as Post[];
        if (user) {
          const m = await db
            .from("cx_mutes")
            .select("target_id")
            .eq("user_id", user.id)
            .limit(1000);
          const muted = (m.data || []).map((x) => x.target_id);
          rows = rows.filter(
            (p) =>
              !muted.includes(p.author_id) &&
              !(settings.muted_words || []).some(
                (w: string) =>
                  w.trim() && p.body.toLowerCase().includes(w.toLowerCase()),
              ),
          );
        }
        const ids = rows.map((p) => p.id);
        const [s, r] = await Promise.all([
          db.rpc("cx_post_stats", { ids }),
          user
            ? db
                .from("cx_reactions")
                .select("post_id,kind")
                .eq("user_id", user.id)
                .in("post_id", ids)
            : Promise.resolve({ data: [] }),
        ]);
        if (alive) {
          setPosts(rows);
          setStats(s.data || {});
          setReactions(r.data || []);
          setMore((data || []).length === 20);
        }
      } catch (err) {
        if (alive) setError((err as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [
    ready,
    user?.id,
    tab,
    query,
    authorId,
    communityId,
    parentId,
    bookmarks,
    mediaOnly,
    likes,
    page,
    refresh,
    settings.muted_words,
  ]);
  return (
    <>
      {!simple && (
        <>
          <div className="page-heading">
            <div>
              <h1>{query ? "Search results" : "Home"}</h1>
              <small>
                {query
                  ? `Conversations about ${query}`
                  : "A little closer to your people."}
              </small>
            </div>
            <span className="heading-mark">✳</span>
          </div>
          <div className="tabs" role="tablist" aria-label="Feed">
            {["For you", "Following", "Communities"].map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
      {!authorId && !parentId && !bookmarks && (
        <Composer communityId={communityId} onPosted={reload} />
      )}
      <div className="feed-label">
        <span>{parentId ? "REPLIES" : "THE LATEST FROM YOUR WORLD"}</span>
        <span>Latest first</span>
      </div>
      {error ? (
        <Empty title="Couldn’t load the conversation">
          {error}
          <br />
          <button className="button small secondary" onClick={reload}>
            Try again
          </button>
        </Empty>
      ) : loading ? (
        <Loading />
      ) : posts.length ? (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            stats={stats[p.id]}
            reactions={reactions
              .filter((r) => r.post_id === p.id)
              .map((r) => r.kind)}
            reload={reload}
          />
        ))
      ) : (
        <Empty
          title={
            bookmarks
              ? "Keep the good stuff close."
              : tab === "Following"
                ? "Your people will appear here."
                : "A fresh chunk. A new conversation."
          }
        >
          {bookmarks
            ? "Bookmark a post to save it privately."
            : tab === "Following"
              ? "Follow players and creators to build your own timeline."
              : "Share a build, ask a question, or tell us what you’re playing."}
        </Empty>
      )}
      <div className="pagination">
        {page > 0 && (
          <button
            className="button small secondary"
            onClick={() => setPage((x) => x - 1)}
          >
            Previous
          </button>
        )}
        {more && (
          <button
            className="button small secondary"
            onClick={() => setPage((x) => x + 1)}
          >
            Next posts
          </button>
        )}
      </div>
    </>
  );
}
export function PostDetail({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null),
    [error, setError] = useState(""),
    [stats, setStats] = useState<Row>({});
  useEffect(() => {
    if (!configured) {
      setError("Connect Supabase to view posts.");
      return;
    }
    const db = browserDb();
    void db
      .from("cx_posts")
      .select("*,author:cx_profiles!author_id(*)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError("This post is unavailable or private.");
        else setPost(data as Post);
      });
    void db
      .rpc("cx_post_stats", { ids: [id] })
      .then(({ data }) => setStats(data?.[id] || {}));
  }, [id]);
  return (
    <>
      <div className="page-heading">
        <h1>Conversation</h1>
      </div>
      {error ? (
        <Empty title="Post unavailable">{error}</Empty>
      ) : post ? (
        <>
          <PostCard
            post={post}
            stats={stats}
            reload={() => location.reload()}
          />
          <Composer parentId={id} onPosted={() => location.reload()} />
          <Feed parentId={id} />
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
