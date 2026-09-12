import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Router from "@/components/router";
import { serverDb } from "@/lib/server";
import { pages } from "@/lib/pages";
const known = [
  "home",
  "explore",
  "communities",
  "servers",
  "people",
  "community",
  "server",
  "post",
  "bookmarks",
  "notifications",
  "messages",
  "settings",
  "contact",
  "status",
  "profile",
];
type Props = { params: Promise<{ route: string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { route } = await params;
  const [name, id] = route;
  const title = pages[name]?.title || name[0].toUpperCase() + name.slice(1);
  if (name === "post" && id) {
    const db = await serverDb();
    const { data } = db
      ? await db.from("cx_posts").select("body").eq("id", id).single()
      : { data: null };
    return {
      title: "Conversation",
      description: data?.body.slice(0, 150),
      robots: { index: false, follow: false },
    };
  }
  if (!known.includes(name) && !pages[name]) {
    const db = await serverDb();
    const { data } = db
      ? await db
          .from("cx_profiles")
          .select("id,display_name,bio")
          .eq("username", name.toLowerCase())
          .single()
      : { data: null };
    if (data) {
      const result = await db!.rpc("cx_indexable", { target: data.id });
      return {
        title: data.display_name,
        description: data.bio,
        alternates: { canonical: "/" + name },
        robots: { index: result.data === true, follow: result.data === true },
        openGraph: { title: data.display_name, description: data.bio },
      };
    }
  }
  return {
    title,
    alternates: { canonical: "/" + route.join("/") },
    robots: { index: Boolean(pages[name]), follow: true },
  };
}
export default async function Page({ params }: Props) {
  const { route } = await params;
  if (route[0] === "hashtag" && route[1])
    redirect("/explore?q=" + encodeURIComponent("#" + route[1]));
  if (
    route.length > 2 ||
    (route.length === 2 && !["community", "server", "post"].includes(route[0]))
  )
    notFound();
  if (
    !known.includes(route[0]) &&
    !pages[route[0]] &&
    !/^[a-z0-9_]{3,24}$/i.test(route[0])
  )
    notFound();
  if (!known.includes(route[0]) && !pages[route[0]]) {
    const db = await serverDb();
    if (db) {
      const profile = await db
        .from("cx_profiles")
        .select("id")
        .eq("username", route[0].toLowerCase())
        .maybeSingle();
      if (!profile.data) {
        const {
          data: { user },
        } = await db.auth.getUser();
        const hidden = user
          ? await db.rpc("cx_find_profile", { handle: route[0].toLowerCase() })
          : null;
        if (!hidden?.data?.id) notFound();
      }
    }
  }
  return (
    <Suspense fallback={<div className="loading" />}>
      <Router route={route} />
    </Suspense>
  );
}
