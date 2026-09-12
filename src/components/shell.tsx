"use client";
import Link from "@/lib/link";
import { usePathname, useRouter } from "@/lib/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home,
  Compass,
  Bell,
  Mail,
  Users,
  Blocks,
  Bookmark,
  User,
  Settings,
  Shield,
  Plus,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { Provider, useApp } from "./provider";
import { Avatar } from "./ui";
import { browserDb, configured } from "@/lib/supabase";
import type { Row } from "@/lib/types";
const links = [
  ["Home", "/home", Home],
  ["Explore", "/explore", Compass],
  ["Notifications", "/notifications", Bell],
  ["Messages", "/messages", Mail],
  ["Communities", "/communities", Users],
  ["Minecraft", "/servers", Blocks],
  ["Bookmarks", "/bookmarks", Bookmark],
  ["Profile", "/profile", User],
  ["Settings", "/settings", Settings],
] as const;
function Frame({ children }: { children: ReactNode }) {
  const path = usePathname(),
    router = useRouter(),
    { user, role } = useApp();
  const [query, setQuery] = useState(""),
    [trends, setTrends] = useState<Row[]>([]),
    [people, setPeople] = useState<Row[]>([]),
    [communities, setCommunities] = useState<Row[]>([]);
  useEffect(() => {
    if (!configured) return;
    const db = browserDb();
    void db.rpc("cx_trending").then(({ data }) => setTrends(data || []));
    void db
      .from("cx_profiles")
      .select("id,username,display_name,playstyle")
      .limit(3)
      .then(({ data }) => setPeople(data || []));
    void db
      .from("cx_communities")
      .select("id,handle,name,category")
      .limit(2)
      .then(({ data }) => setCommunities(data || []));
  }, [user?.id]);
  return (
    <div className="app-shell">
      <aside className="left-sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            c<span>×</span>
          </span>
          connect<span className="lime">x</span>
        </Link>
        <div className="nav-caption">YOUR CORNER OF MINECRAFT</div>
        <nav>
          {links.map(([name, href, Icon]) => (
            <Link
              className={"nav-item " + (path === href ? "active" : "")}
              key={href}
              href={href}
            >
              <Icon size={22} />
              <span>{name}</span>
              {name === "Minecraft" && <span className="nav-tag">PLAY</span>}
            </Link>
          ))}
          {["admin", "owner"].includes(role) && (
            <Link className="nav-item" href="/admin">
              <Shield size={22} />
              <span>Admin</span>
            </Link>
          )}
        </nav>
        <Link
          href={user ? "/home?compose=1" : "/login"}
          className="button post-button"
        >
          <Plus size={20} />
          <span>Create post</span>
        </Link>
        <div className="sidebar-bottom">
          {user ? (
            <Link href={"/" + user.username} className="account">
              <Avatar profile={user} />
              <span>
                <b>{user.display_name}</b>
                <small>@{user.username}</small>
              </span>
            </Link>
          ) : (
            <Link href="/login" className="button secondary">
              Join the conversation
            </Link>
          )}
          <small>Connect. Create. Play.</small>
        </div>
      </aside>
      <main className="app-main">
        {!configured && (
          <div className="setup-banner">
            Preview mode · Connect Supabase to start posting and joining
            communities.
          </div>
        )}
        {children}
      </main>
      <aside className="right-sidebar">
        <form className="search-box" onSubmit={e=>{e.preventDefault();router.push('/explore?q='+encodeURIComponent(query))}}>
          <Search size={18} />
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search ConnectX"
            placeholder="Search ConnectX"
          />
        </form>
        <div className="welcome-card">
          <span className="eyebrow">FIND YOUR PEOPLE</span>
          <h3>
            Good things start
            <br />
            with a connection.
          </h3>
          <p>
            From your first build to your next big idea. There’s a community for
            it.
          </p>
          <Link href="/communities">
            Explore communities <ArrowUpRight size={17} />
          </Link>
        </div>
        <section className="rail-section">
          <h3>
            Trending in your world <span>↗</span>
          </h3>
          {trends.length ? (
            trends.map((t) => (
              <Link
                className="trend"
                key={t.topic}
                href={"/explore?q=" + encodeURIComponent("#" + t.topic)}
              >
                <small>Minecraft · Trending</small>
                <b>#{t.topic}</b>
                <small>{t.creators} creators this week</small>
              </Link>
            ))
          ) : (
            <p className="muted rail-empty">
              The next conversation starts with you. Hashtags appear here as
              people post.
            </p>
          )}
        </section>
        <section className="rail-section">
          <h3>People to discover</h3>
          {people.length ? (
            people.map((p) => (
              <Link className="rail-person" href={"/" + p.username} key={p.id}>
                <Avatar profile={p} />
                <span>
                  <b>{p.display_name}</b>
                  <small>@{p.username}</small>
                </span>
                <Plus size={16} />
              </Link>
            ))
          ) : (
            <p className="muted rail-empty">
              Make room for your next teammate.
            </p>
          )}
          <Link className="rail-link" href="/explore?type=people">
            Discover people <ArrowUpRight size={15} />
          </Link>
        </section>
        {communities.length > 0 && (
          <section className="rail-section">
            <h3>Find your community</h3>
            {communities.map((c) => (
              <Link
                className="trend"
                key={c.id}
                href={"/community/" + c.handle}
              >
                <b>{c.name}</b>
                <small>{c.category}</small>
              </Link>
            ))}
          </section>
        )}
        <div className="rail-footer">
          {[
            "About",
            "Safety",
            "Privacy Policy",
            "Terms of Service",
            "Help Center",
          ].map((x) => (
            <Link key={x} href={"/" + x.toLowerCase().replaceAll(" ", "-")}>
              {x}
            </Link>
          ))}
          <span>© {new Date().getFullYear()} ConnectX</span>
          <span>Not affiliated with Mojang or Microsoft.</span>
        </div>
      </aside>
      <nav className="mobile-nav">
        {links.slice(0, 5).map(([name, href, Icon]) => (
          <Link
            key={href}
            href={href}
            aria-label={name}
            className={path === href ? "active" : ""}
          >
            <Icon size={22} />
            <span>{name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <Frame>{children}</Frame>
    </Provider>
  );
}
