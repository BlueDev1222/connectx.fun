"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, Send, Mail } from "lucide-react";
import { useApp } from "./provider";
import {
  Action,
  Avatar,
  Empty,
  Field,
  Loading,
  Media,
  Name,
  relativeTime,
} from "./ui";
import { Report, RichText } from "./posts";
import { browserDb, configured } from "@/lib/supabase";
import type { Row } from "@/lib/types";
export function Notifications() {
  const { user, ready, command } = useApp();
  const [rows, setRows] = useState<Row[]>([]),
    [requests, setRequests] = useState<Row[]>([]),
    [version, setVersion] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    const db = browserDb();
    void db
      .from("cx_notifications")
      .select("*,actor:cx_profiles!actor_id(*)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setRows(data || []);
        if (error) setError(error.message);
      });
    void db
      .from("cx_follows")
      .select("*,person:cx_profiles!follower_id(*)")
      .eq("following_id", user.id)
      .eq("accepted", false)
      .limit(50)
      .then(({ data }) => setRequests(data || []));
    const channel = db
      .channel("notifications-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cx_notifications",
          filter: "user_id=eq." + user.id,
        },
        () => setVersion((v) => v + 1),
      )
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [user?.id, version]);
  if (!ready) return <Loading />;
  return (
    <>
      <div className="page-heading">
        <h1>Notifications</h1>
        {user && (
          <Action
            run={async () => {
              await command("read_notifications");
              setVersion((v) => v + 1);
            }}
          >
            Mark all read
          </Action>
        )}
      </div>
      {!user ? (
        <Empty title="Your updates live here">
          <Link href="/login">Sign in to see notifications.</Link>
        </Empty>
      ) : error ? (
        <Empty title="Unable to load notifications">{error}</Empty>
      ) : (
        <>
          {requests.map((r) => (
            <div className="notification" key={r.follower_id}>
              <Avatar profile={r.person} />
              <div>
                <Name profile={r.person} />
                <p>Requested to follow you</p>
                <Action
                  run={async () => {
                    await command("follow_request", {
                      id: r.follower_id,
                      accept: true,
                    });
                    setVersion((v) => v + 1);
                  }}
                >
                  Accept
                </Action>{" "}
                <Action
                  run={async () => {
                    await command("follow_request", {
                      id: r.follower_id,
                      accept: false,
                    });
                    setVersion((v) => v + 1);
                  }}
                >
                  Decline
                </Action>
              </div>
            </div>
          ))}
          {rows.length ? (
            rows.map((r) => (
              <article
                className={"notification " + (!r.read_at ? "unread" : "")}
                key={r.id}
              >
                <Avatar profile={r.actor} />
                <div>
                  <Name profile={r.actor} />
                  <p>{r.body}</p>
                  <small>{relativeTime(r.created_at)}</small>
                  <div className="button-row">
                    <Link
                      className="text-link"
                      href={
                        r.kind === "message"
                          ? "/messages"
                          : r.kind === "community"
                            ? "/communities"
                            : ["follow", "verification"].includes(r.kind)
                              ? "/profile"
                              : "/post/" + r.subject_id
                      }
                    >
                      View
                    </Link>
                    {!r.read_at && (
                      <Action
                        run={async () => {
                          await command("read_notifications", { id: r.id });
                          setVersion((v) => v + 1);
                        }}
                      >
                        Mark read
                      </Action>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <Empty title="You’re all caught up.">
              New followers, replies, and community updates will appear here.
            </Empty>
          )}
        </>
      )}
    </>
  );
}
export function Messages() {
  const { user, ready, command, notice, upload } = useApp(),
    params = useSearchParams();
  const [recipient, setRecipient] = useState(params.get("to") || ""),
    [username, setUsername] = useState(""),
    [conversations, setConversations] = useState<Row[]>([]),
    [messages, setMessages] = useState<Row[]>([]),
    [selected, setSelected] = useState(""),
    [body, setBody] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [reply, setReply] = useState(""),
    [report, setReport] = useState(""),
    [version, setVersion] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [limit, setLimit] = useState(40);
  useEffect(() => {
    if (!user) return;
    const db = browserDb();
    void db
      .from("cx_conversations")
      .select("*,a:cx_profiles!user_a(*),b:cx_profiles!user_b(*)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        setConversations(
          (data || []).filter((c) => !c.hidden_by.includes(user.id)),
        );
        if (error) setError(error.message);
      });
    if (selected)
      void db
        .from("cx_messages")
        .select("*")
        .eq("conversation_id", selected)
        .order("created_at", { ascending: false })
        .limit(limit)
        .then(({ data, error }) => {
          setMessages((data || []).reverse());
          if (error) setError(error.message);
        });
    const channel = db
      .channel("messages-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cx_messages" },
        () => setVersion((v) => v + 1),
      )
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [user?.id, selected, version, limit]);
  if (!ready) return <Loading />;
  return (
    <>
      <div className="page-heading">
        <h1>Messages</h1>
        <Mail size={23} className="lime" />
      </div>
      {!user ? (
        <Empty title="Keep the conversation going">
          <Link href="/login">Sign in to send private messages.</Link>
        </Empty>
      ) : (
        <section className="messages-panel">
          <form
            className="new-message"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { data, error } = await browserDb().rpc(
                  "cx_find_profile",
                  { handle: username.toLowerCase().replace(/^@/, "") },
                );
                if (error) throw error;
                if (!data?.id) throw Error("Player not found.");
                setRecipient(data.id);
                const existing = conversations.find((c) =>
                  [c.user_a, c.user_b].includes(data.id),
                );
                setSelected(existing?.id || "");
                setMessages([]);
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            <Field label="Start a conversation">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                required
              />
            </Field>
            <button className="button small secondary">Open</button>
          </form>
          <div className="conversation-list">
            {conversations.map((c) => {
              const other = c.user_a === user.id ? c.b : c.a;
              return (
                <button
                  key={c.id}
                  className={selected === c.id ? "selected" : ""}
                  onClick={() => {
                    setSelected(c.id);
                    setRecipient(c.user_a === user.id ? c.user_b : c.user_a);
                    setReply("");
                  }}
                >
                  <Avatar profile={other} />
                  <span>{other?.display_name || "Private account"}</span>
                </button>
              );
            })}
          </div>
          {error && <p role="alert">{error}</p>}
          {!recipient ? (
            <Empty title="A good conversation starts with hello.">
              Search for a player to send your first message.
            </Empty>
          ) : (
            <>
              {selected && (
                <div className="chat-toolbar">
                  <Action
                    run={async () => {
                      await command("hide_conversation", { id: selected });
                      setSelected("");
                      setRecipient("");
                      setVersion((v) => v + 1);
                    }}
                  >
                    Hide conversation
                  </Action>
                  <button
                    className="text-link"
                    onClick={() => setLimit((l) => l + 40)}
                  >
                    Load older messages
                  </button>
                </div>
              )}
              <div className="chat-messages">
                {messages.map((m) => (
                  <div
                    className={
                      "message-bubble " +
                      (m.sender_id === user.id ? "mine" : "")
                    }
                    key={m.id}
                  >
                    {m.reply_id && <small>Reply to an earlier message</small>}
                    <p>
                      <RichText text={m.body} />
                    </p>
                    {m.media_path && (
                      <Media path={m.media_path} alt="Message attachment" />
                    )}
                    <small>{relativeTime(m.created_at)}</small>
                    <div>
                      <button onClick={() => setReply(m.id)}>Reply</button>
                      <button onClick={() => setReport(m.id)}>Report</button>
                    </div>
                  </div>
                ))}
              </div>
              <form
                className="message-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    const media_path = file ? await upload(file) : undefined;
                    const result = await command("message", {
                      recipient,
                      body,
                      reply_id: reply || undefined,
                      media_path,
                    });
                    setSelected(result.id);
                    setBody("");
                    setFile(null);
                    setReply("");
                    setVersion((v) => v + 1);
                  } catch (e) {
                    notice((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {reply && (
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => setReply("")}
                  >
                    Reply selected · cancel
                  </button>
                )}
                <Field label="Message">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    maxLength={4000}
                    placeholder="Say hello…"
                  />
                </Field>
                <input
                  type="file"
                  aria-label="Attach message image"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  className="button small"
                  disabled={busy || !body.trim()}
                >
                  {busy ? "Sending…" : "Send message"}
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      )}
      {report && (
        <Report id={report} type="message" onClose={() => setReport("")} />
      )}
    </>
  );
}
