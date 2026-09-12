"use client";
import { useEffect, useState } from "react";
import { browserDb } from "@/lib/supabase";
import { useApp } from "./provider";
import { Empty, Field, Loading, Name } from "./ui";
import { ModerateForm } from "./communities";
import type { Row } from "@/lib/types";
export default function Admin() {
  const { command, notice } = useApp();
  const [tab, setTab] = useState("Overview"),
    [rows, setRows] = useState<Row[]>([]),
    [stats, setStats] = useState<Row>({}),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [version, setVersion] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const db = browserDb();
        if (tab === "Overview") {
          const tables = [
            "cx_profiles",
            "cx_posts",
            "cx_communities",
            "cx_reports",
            "cx_support_tickets",
          ];
          const results = await Promise.all(
            tables.map((t) =>
              db.from(t).select("*", { count: "exact", head: true }),
            ),
          );
          const failed = results.find((r) => r.error);
          if (failed?.error) throw failed.error;
          const extra = await Promise.all([
            db
              .from("cx_profiles")
              .select("*", { count: "exact", head: true })
              .eq("status", "active"),
            db
              .from("cx_profiles")
              .select("*", { count: "exact", head: true })
              .eq("status", "suspended"),
            db
              .from("cx_profiles")
              .select("*", { count: "exact", head: true })
              .eq("verified", true),
            db
              .from("cx_communities")
              .select("*", { count: "exact", head: true })
              .eq("verified", true),
          ]);
          setStats({
            ...Object.fromEntries(
              results.map((r, i) => [tables[i].replace("cx_", ""), r.count]),
            ),
            ...Object.fromEntries(
              extra.map((r, i) => [
                [
                  "active_accounts",
                  "suspensions",
                  "verified_users",
                  "verified_communities",
                ][i],
                r.count,
              ]),
            ),
          });
        } else {
          const table = (
            {
              Users: "cx_profiles",
              Communities: "cx_communities",
              Reports: "cx_reports",
              Posts: "cx_posts",
              "Audit log": "cx_audit",
              "Verification records": "cx_verification_records",
              Support: "cx_support_tickets",
              Configuration: "cx_config",
            } as Row
          )[tab];
          let q = db
            .from(table)
            .select("*")
            .range(page * 25, page * 25 + 24);
          if (["Users", "Communities"].includes(tab) && query)
            q = q.ilike(
              tab === "Users" ? "username" : "name",
              "%" + query.replace(/[%_]/g, "") + "%",
            );
          if (tab !== "Configuration")
            q = q.order("created_at", { ascending: false });
          const { data, error } = await q;
          if (error) throw error;
          setRows(data || []);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, query, page, version]);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>ConnectX administration</h1>
          <small>Staff actions are authorized and recorded server-side.</small>
        </div>
      </div>
      <div className="settings-tabs">
        {[
          "Overview",
          "Users",
          "Communities",
          "Reports",
          "Posts",
          "Audit log",
          "Verification records",
          "Support",
          "Configuration",
        ].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => {
              setTab(t);
              setPage(0);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="content-panel">
        {error && <p role="alert">{error}</p>}
        {["Users", "Communities"].includes(tab) && (
          <Field label={"Search " + tab.toLowerCase()}>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </Field>
        )}
        {loading ? (
          <Loading />
        ) : tab === "Overview" ? (
          <div className="stats-grid">
            {Object.entries(stats).map(([key, n]) => (
              <article key={key}>
                <b>{n}</b>
                <span>{key.replaceAll("_", " ")}</span>
              </article>
            ))}
          </div>
        ) : (
          rows.map((r) => (
            <article className="admin-record" key={r.id || r.key}>
              <h3>
                {r.display_name ||
                  r.name ||
                  r.action ||
                  r.key ||
                  r.reason ||
                  r.category ||
                  r.body?.slice(0, 50)}
              </h3>
              <small>
                {r.id || r.key} {r.username && "@" + r.username}
              </small>
              {["Users", "Communities"].includes(tab) ? (
                <>
                  <p>
                    Status: {r.status} ·{" "}
                    {r.verified ? "Verified" : "Not verified"}
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const d = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      try {
                        await command("verify", {
                          id: r.id,
                          target_type:
                            tab === "Users" ? "profile" : "community",
                          verified: d.verified === "true",
                          category: d.category,
                          notes: d.notes,
                        });
                        notice("Verification updated and logged.");
                        setVersion((v) => v + 1);
                      } catch (e) {
                        notice((e as Error).message);
                      }
                    }}
                  >
                    <Field label="Verification">
                      <select name="verified" defaultValue={String(r.verified)}>
                        <option value="false">Unverified</option>
                        <option value="true">Verified</option>
                      </select>
                    </Field>
                    <Field label="Category">
                      <select name="category">
                        {(tab === "Users"
                          ? [
                              "Creator",
                              "Developer",
                              "Server Owner",
                              "Builder",
                              "Organization",
                              "Staff",
                              "Notable Player",
                            ]
                          : [
                              "Minecraft Server",
                              "Creator Community",
                              "Development Project",
                              "Mod Project",
                              "Client Project",
                              "Building Community",
                              "PvP Community",
                              "Organization",
                            ]
                        ).map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Private staff notes">
                      <textarea name="notes" maxLength={2000} />
                    </Field>
                    <button className="button small">
                      Update verification
                    </button>
                  </form>
                  <StaffForm
                    id={r.id}
                    kind={tab}
                    reload={() => setVersion((v) => v + 1)}
                  />
                </>
              ) : tab === "Posts" ? (
                <>
                  <p>{r.body}</p>
                  <ModerateForm
                    id={r.id}
                    kind="post"
                    reload={() => setVersion((v) => v + 1)}
                  />
                </>
              ) : tab === "Reports" || tab === "Support" ? (
                <>
                  <p>{r.reason || r.body}</p>
                  <small>
                    {r.target_type} {r.target_id} · {r.state}
                  </small>
                  <StaffForm
                    id={r.id}
                    kind={tab}
                    reload={() => setVersion((v) => v + 1)}
                  />
                </>
              ) : tab === "Configuration" ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const value = JSON.parse(
                        String(new FormData(e.currentTarget).get("value")),
                      );
                      await command("config", { key: r.key, value });
                      notice("Configuration saved.");
                    } catch (e) {
                      notice((e as Error).message);
                    }
                  }}
                >
                  <Field label="Value · JSON">
                    <textarea
                      name="value"
                      defaultValue={JSON.stringify(r.value)}
                    />
                  </Field>
                  <button className="button small">Save</button>
                </form>
              ) : (
                <>
                  <p>{r.reason || r.notes}</p>
                  <small>
                    {r.actor_id} · {new Date(r.created_at).toLocaleString()}
                  </small>
                </>
              )}
            </article>
          ))
        )}
        {!loading && tab !== "Overview" && (
          <div className="pagination">
            {page > 0 && (
              <button
                className="button small secondary"
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
            )}
            {rows.length === 25 && (
              <button
                className="button small secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
function StaffForm({
  id,
  kind,
  reload,
}: {
  id: string;
  kind: string;
  reload: () => void;
}) {
  const { command, notice, role } = useApp();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const [operation, value] = String(data.action).split(":");
        try {
          await command("staff", { id, operation, value, reason: data.reason });
          notice("Staff action recorded.");
          reload();
        } catch (e) {
          notice((e as Error).message);
        }
      }}
    >
      <Field label="Moderation action">
        <select name="action">
          {(kind === "Users"
            ? [
                "status:active",
                "status:suspended",
                "status:banned",
                "warn:warning",
                ...(role === "owner"
                  ? ["role:user", "role:moderator", "role:admin"]
                  : []),
              ]
            : kind === "Communities"
              ? [
                  "community_status:active",
                  "community_status:suspended",
                  "community_status:deleted",
                ]
              : kind === "Reports"
                ? [
                    "report:assigned",
                    "report:resolved",
                    "report:dismissed",
                    "report:escalated",
                  ]
                : ["ticket:open", "ticket:resolved"]
          ).map((x) => (
            <option key={x} value={x}>
              {x.replace(":", " → ")}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Reason required">
        <input name="reason" minLength={3} maxLength={2000} required />
      </Field>
      <label className="check">
        <input type="checkbox" required /> I reviewed this action and its
        target.
      </label>
      <button className="button small secondary">Apply moderation</button>
    </form>
  );
}
