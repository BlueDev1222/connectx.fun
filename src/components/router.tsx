"use client";
import { Feed, PostDetail } from "./posts";
import { Directory, ProfilePage } from "./discovery";
import { Community, ServerDetail } from "./communities";
import { Messages, Notifications } from "./communication";
import { SettingsPage } from "./settings";
import { Information, Contact, Status } from "./information";
import { pages } from "@/lib/pages";
import { useApp } from "./provider";
import { Empty } from "./ui";
export default function Router({ route }: { route: string[] }) {
  const { user } = useApp();
  const [page, id] = route;
  if (
    user &&
    user.status !== "active" &&
    !["contact", "safety", "help-center", "settings"].includes(page)
  )
    return <Information slug="suspended" />;
  if (pages[page]) return <Information slug={page} />;
  switch (page) {
    case "home":
      return <Feed />;
    case "explore":
      return <Directory kind="explore" />;
    case "communities":
      return <Directory kind="communities" />;
    case "servers":
      return <Directory kind="servers" />;
    case "people":
      return <Directory kind="people" />;
    case "community":
      return id ? <Community handle={id} /> : <Directory kind="communities" />;
    case "server":
      return id ? <ServerDetail id={id} /> : <Directory kind="servers" />;
    case "post":
      return id ? <PostDetail id={id} /> : <Empty title="Post not found" />;
    case "bookmarks":
      return (
        <>
          <div className="page-heading">
            <h1>Bookmarks</h1>
            <small>Only you can see these.</small>
          </div>
          <Feed bookmarks />
        </>
      );
    case "notifications":
      return <Notifications />;
    case "messages":
      return <Messages />;
    case "settings":
      return <SettingsPage />;
    case "contact":
      return <Contact />;
    case "status":
      return <Status />;
    case "hashtag":
      return <Feed />;
    default:
      return <ProfilePage username={page} />;
  }
}
