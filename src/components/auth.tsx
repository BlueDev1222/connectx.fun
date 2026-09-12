"use client";
import { useState } from "react";
import Link from "@/lib/link";
import { useRouter } from "@/lib/navigation";
import { browserDb, configured } from "@/lib/supabase";
import { Field,Modal } from "./ui";
import {signInWithSocial,socialProviders,type SocialProvider} from '@/lib/social-auth';
export default function Auth({ mode }: { mode: string }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(()=>{const error=sessionStorage.getItem('cx-auth-error');sessionStorage.removeItem('cx-auth-error');return error||''}),
    [socialConsent,setSocialConsent]=useState<SocialProvider|null>(null);
  const router = useRouter();
  const title =
    mode === "register"
      ? "Find your people."
      : mode === "forgot-password"
        ? "Let’s get you back in."
        : mode === "reset-password"
          ? "Choose a new password."
          : "Welcome back.";
  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        connect<span className="lime">x</span>
      </Link>
      <section className="auth-card">
        <span className="eyebrow">CONNECT. CREATE. PLAY.</span>
        <h1>{title}</h1>
        <p className="muted">
          {mode === "register"
            ? "Your next chapter in Minecraft starts here."
            : "Your corner of Minecraft is waiting."}
        </p>
        {['login','register'].includes(mode)&&<>
          <div className="social-buttons">{socialProviders.map(provider=><button key={provider.id} type="button" className={"button wide "+(provider.id==="discord"?"discord-button":"social-button")} disabled={busy} onClick={()=>{setMessage("");setSocialConsent(provider)}}>Continue with {provider.label}</button>)}</div>
          <div className="auth-separator"><span>or use your email</span></div>
        </>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            try {
              const data = Object.fromEntries(new FormData(e.currentTarget));
              const db = browserDb();
              let result;
              if (mode === "register") {
                result = await db.auth.signUp({
                  email: String(data.email),
                  password: String(data.password),
                  options: {
                    data: {
                      username: String(data.username).toLowerCase(),
                      display_name: data.display_name,
                      age_confirmed: true,
                      terms_accepted_at: new Date().toISOString(),
                    },
                    emailRedirectTo: window.location.origin + "/?flow=confirmation",
                  },
                });
                if (result.error) throw result.error;
                setMessage(
                  "Check your email to verify your account. Then sign in.",
                );
              } else if (mode === "forgot-password") {
                result = await db.auth.resetPasswordForEmail(
                  String(data.email),
                  {
                    redirectTo:
                      window.location.origin +
                      "/?flow=recovery",
                  },
                );
                if (result.error) throw result.error;
                setMessage(
                  "If an account exists, you’ll receive a password reset email.",
                );
              } else if (mode === "reset-password") {
                result = await db.auth.updateUser({
                  password: String(data.password),
                });
                if (result.error) throw result.error;
                router.push("/home");
              } else {
                result = await db.auth.signInWithPassword({
                  email: String(data.email),
                  password: String(data.password),
                });
                if (result.error) throw result.error;
                router.push("/home");
                router.refresh();
              }
            } catch (err) {
              setMessage(
                err instanceof Error
                  ? err.message
                  : "Unable to sign in. Please retry.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "register" && (
            <>
              <Field label="Display name">
                <input
                  name="display_name"
                  required
                  maxLength={60}
                  autoComplete="name"
                />
              </Field>
              <Field label="Username">
                <input
                  name="username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z0-9_]{3,24}"
                  autoComplete="username"
                  placeholder="Your Minecraft-world handle"
                />
              </Field>
            </>
          )}
          {mode !== "reset-password" && (
            <Field label="Email address">
              <input name="email" type="email" required autoComplete="email" />
            </Field>
          )}
          {mode !== "forgot-password" && (
            <Field label="Password">
              <input
                name="password"
                type="password"
                minLength={12}
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </Field>
          )}
          {mode === "register" && (
            <>
              <label className="check">
                <input type="checkbox" required /> I am at least 13 years old.
              </label>
              <label className="check">
                <input type="checkbox" required />{" "}
                <span>
                  I accept the{" "}
                  <Link href="/terms-of-service">Terms of Service</Link> and{" "}
                  <Link href="/privacy-policy">Privacy Policy</Link>.
                </span>
              </label>
            </>
          )}
          <button disabled={busy || !configured} className="button wide">
            {busy
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : mode === "forgot-password"
                  ? "Send reset email"
                  : mode === "reset-password"
                    ? "Update password"
                    : "Sign in"}
          </button>
          {message && (
            <p role="status" className="form-message">
              {message}
            </p>
          )}
          {!configured && (
            <p className="form-message">
              Account access will be available when the Supabase connection is
              configured.
            </p>
          )}
        </form>
        {mode === "login" && (
          <Link className="text-link" href="/forgot-password">
            Forgot password?
          </Link>
        )}
        <div className="auth-bottom">
          {mode === "register" ? (
            <>
              Already part of the world? <Link href="/login">Sign in</Link>
            </>
          ) : (
            <>
              New around here? <Link href="/register">Create account</Link>
            </>
          )}
        </div>
        <Link className="muted" href="/explore">
          Explore before joining →
        </Link>
      </section>
      {socialConsent&&<Modal title={"Continue with "+socialConsent.label} onClose={()=>setSocialConsent(null)}>
        <p>Use your {socialConsent.label} account to sign in or create a ConnectX profile. You can change your ConnectX username in Settings.</p>
        <form onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{await signInWithSocial(socialConsent)}catch(error){setMessage(error instanceof Error?error.message:'Sign-in failed. Please try again.');setSocialConsent(null)}finally{setBusy(false)}}}>
          <label className="check"><input type="checkbox" required/> I am at least 13 years old.</label>
          <label className="check"><input type="checkbox" required/><span>I agree to the <Link href="/terms-of-service" target="_blank">Terms of Service</Link> and <Link href="/privacy-policy" target="_blank">Privacy Policy</Link>.</span></label>
          <button className="button discord-button wide" disabled={busy}>{busy?'Connecting…':'Continue to '+socialConsent.label}</button>
        </form>
      </Modal>}
    </main>
  );
}
