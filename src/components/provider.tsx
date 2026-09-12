"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { browserDb, configured } from "@/lib/supabase";
import {edgeJson} from '@/lib/edge-api';
import type { Profile, Row } from "@/lib/types";
type Context = {
  user: Profile | null;
  settings: Row;
  role: string;
  ready: boolean;
  notice: (s: string) => void;
  refresh: () => Promise<void>;
  command: (a: string, p?: Row) => Promise<Row>;
  upload: (f: File) => Promise<string>;
  media: (path?: string | null) => Promise<string>;
};
const AppContext = createContext<Context>(null!);
export function useApp() {
  return useContext(AppContext);
}
export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null),
    [settings, setSettings] = useState<Row>({}),
    [role, setRole] = useState("user"),
    [ready, setReady] = useState(false),
    [toast, setToast] = useState("");
  const notice = useCallback((s: string) => setToast(s), []);
  const refresh = useCallback(async () => {
    if (!configured) {
      setReady(true);
      return;
    }
    try {
      const db = browserDb();
      const {
        data: { user: u },
      } = await db.auth.getUser();
      if (u) {
        const [p, s, r] = await Promise.all([
          db.from("cx_profiles").select("*").eq("id", u.id).single(),
          db.from("cx_settings").select("*").eq("user_id", u.id).single(),
          db.from("cx_roles").select("role").eq("user_id", u.id).single(),
        ]);
        if (p.error) throw p.error;
        setUser(p.data as Profile);
        setSettings(s.data || {});
        setRole(r.data?.role || "user");
        if (s.data?.theme)
          document.documentElement.dataset.theme = s.data.theme;
      } else {
        setUser(null);
        setSettings({});
        setRole("user");
      }
    } catch (e) {
      notice(
        e instanceof Error
          ? e.message
          : "Unable to load account. Please retry.",
      );
    } finally {
      setReady(true);
    }
  }, [notice]);
  useEffect(() => {
    const theme = localStorage.getItem("cx-theme");
    if (theme) document.documentElement.dataset.theme = theme;
    void refresh();
    if (!configured) return;
    const {
      data: { subscription },
    } = browserDb().auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0);
    });
    return () => subscription.unsubscribe();
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function command(action: string, payload: Row = {}) {
    if (!user) throw Error("Sign in to continue.");
    const { data, error } = await browserDb().rpc(
      action === "support" ? "cx_support" : "cx_command",
      action === "support" ? { payload } : { action, payload },
    );
    if (error) throw Error(error.message);
    return data || {};
  }
  async function upload(file: File) {
    if (!user) throw Error("Sign in to upload.");
    const form = new FormData();
    form.set("file", file);
    const data = await edgeJson('media',{method:'POST',body:form});
    return data.path as string;
  }
  async function media(path?: string | null) {
    if (!path || !configured) return "";
    const { data, error } = await browserDb()
      .storage.from("connectx-media")
      .createSignedUrl(path, 300);
    if (error) return "";
    return data.signedUrl;
  }
  return (
    <AppContext.Provider
      value={{
        user,
        settings,
        role,
        ready,
        notice,
        refresh,
        command,
        upload,
        media,
      }}
    >
      {children}
      {toast && (
        <div role="status" className="toast">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
