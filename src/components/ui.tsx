"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@/lib/link";
import { BadgeCheck, X, LoaderCircle } from "lucide-react";
import { useApp } from "./provider";
import type { Profile } from "@/lib/types";
export function Avatar({
  profile,
  large = false,
}: {
  profile?: Partial<Profile> | null;
  large?: boolean;
}) {
  return (
    <span className={"avatar " + (large ? "large" : "")}>
      {profile?.avatar_path ? (
        <Media
          path={profile.avatar_path}
          alt={profile.display_name || "Profile picture"}
        />
      ) : (
        profile?.display_name?.slice(0, 1) || "C"
      )}
    </span>
  );
}
export function Name({ profile }: { profile?: Partial<Profile> | null }) {
  return (
    <Link href={"/" + profile?.username} className="person-name">
      {profile?.display_name || "Minecraft player"}
      {profile?.verified && (
        <BadgeCheck
          size={16}
          className="lime"
          aria-label="Verified by ConnectX"
        />
      )}
    </Link>
  );
}
export function Media({
  path,
  alt,
  video = false,
}: {
  path: string;
  alt: string;
  video?: boolean;
}) {
  const { media } = useApp();
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    void media(path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [path]);
  return url ? (
    video ? (
      <video src={url} controls preload="metadata" aria-label={alt} />
    ) : (
      <img src={url} alt={alt} loading="lazy" />
    )
  ) : (
    <span className="muted">Media unavailable</span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-mark">×</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Loading() {
  return (
    <div aria-label="Loading" role="status">
      <div className="loading" />
      <div className="loading" />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose}>
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Action({
  children,
  run,
  className = "button small secondary",
}: {
  children: ReactNode;
  run: () => Promise<unknown>;
  className?: string;
}) {
  const { notice } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await run();
        } catch (e) {
          notice(
            e instanceof Error ? e.message : "Something went wrong. Try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <LoaderCircle size={16} className="spin" /> : children}
    </button>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function relativeTime(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return minutes < 1
    ? "just now"
    : minutes < 60
      ? `${minutes}m`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h`
        : new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
}
