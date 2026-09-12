"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { pages } from "@/lib/pages";
import { useApp } from "./provider";
import { Action, Empty, Field } from "./ui";
import type { Row } from "@/lib/types";
export function Information({ slug }: { slug: string }) {
  const [q, setQ] = useState("");
  const page = pages[slug];
  return (
    <>
      <div className="page-heading">
        <Link href="/home">← Back to your world</Link>
      </div>
      <article className="information">
        <span className="eyebrow">
          CONNECTX {page.legal ? "LEGAL TEMPLATE" : "COMMUNITY"}
        </span>
        <h1>{page.title}</h1>
        <p className="intro">{page.intro}</p>
        {page.legal && (
          <div className="legal-notice">
            Template only · Not approved for production use.
          </div>
        )}
        {slug === "help-center" && (
          <Field label="Search the help center">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Accounts, communities, privacy…"
            />
          </Field>
        )}
        {page.sections
          .filter((s) => s.join(" ").toLowerCase().includes(q.toLowerCase()))
          .map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
        <Link className="text-link" href="/contact">
          Need a hand? Contact ConnectX →
        </Link>
      </article>
    </>
  );
}
export function Contact() {
  const { user, command, notice } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <section className="information">
      <span className="eyebrow">LET’S TALK</span>
      <h1>How can we help?</h1>
      <p>
        Send a support ticket to the ConnectX team. Include the information
        needed to understand the issue, and leave out passwords and private
        tokens.
      </p>
      {user ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              await command("support", Object.fromEntries(new FormData(form)));
              notice("Your support ticket has been created.");
              form.reset();
            } catch (e) {
              notice((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Category">
            <select name="category">
              {[
                "General Support",
                "Account Support",
                "Safety",
                "Abuse",
                "Privacy",
                "Copyright",
                "Verification",
                "Business",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Tell us what happened">
            <textarea name="body" required minLength={10} maxLength={4000} />
          </Field>
          <button disabled={busy} className="button">
            {busy ? "Sending…" : "Create support ticket"}
          </button>
        </form>
      ) : (
        <Empty title="Sign in to open a ticket">
          <Link className="button" href="/login">
            Sign in
          </Link>
          <p>
            For inaccessible accounts, the operator must provide a reviewed
            recovery contact before public launch.
          </p>
        </Empty>
      )}
    </section>
  );
}
export function Status() {
  const [status, setStatus] = useState<Row | null>(null);
  useEffect(() => {
    void fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ website: "unreachable" }));
  }, []);
  return (
    <section className="information">
      <span className="eyebrow">SERVICE STATUS</span>
      <h1>A check on our world.</h1>
      <p>
        This is a current connectivity check, not an uptime history. Unmonitored
        services are labeled explicitly.
      </p>
      {["website", "authentication", "database", "media", "messaging"].map(
        (k) => (
          <div className="status-row" key={k}>
            <b>{k}</b>
            <span>{status?.[k] || "Checking…"}</span>
          </div>
        ),
      )}
      {status?.checked_at && (
        <small>Checked {new Date(status.checked_at).toLocaleString()}</small>
      )}
    </section>
  );
}
