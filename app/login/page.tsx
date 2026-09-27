"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [identifier, setIdentifier] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { if (!supabase) setError("Supabase is not configured. Copy .env.local.example to .env.local and add your project URL and key."); }, []);
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setNotice(""); setLoading(true); try {
    if (!supabase) throw new Error("Supabase is not configured.");
    if (mode === "signup") {
      if (!/^[a-z0-9_]{3,20}$/.test(username.trim().toLowerCase())) throw new Error("Username must be 3–20 characters using letters, numbers or _.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { username: username.trim().toLowerCase() } } });
      if (error) throw error;
      if (data.session) router.push("/"); else setNotice("Account created. Check your email to confirm the account, then log in.");
    } else {
      const loginEmail = identifier.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      router.push("/"); router.refresh();
    }
  } catch (err: any) { setError(err.message || "Something went wrong."); } finally { setLoading(false); } }

  async function googleLogin() {
    setError(""); setNotice("");
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google login could not start.");
      setLoading(false);
    }
  }
  return <main className="auth-page"><div className="auth-card"><Link href="/" className="auth-brand">🦎 Tiktiki</Link><h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1><p className="auth-sub">{mode === "login" ? "Sign in to your Tiktiki account." : "Join Tiktiki and start sharing real videos."}</p><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");setNotice("")}}>Login</button><button className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setError("");setNotice("")}}>Sign up</button></div><form onSubmit={submit} className="auth-form">{mode === "signup" ? <><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="shohan123" required /></label><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required /></label></> : <label>Email<input value={identifier} onChange={e=>setIdentifier(e.target.value)} type="email" placeholder="you@example.com" required /></label>}<label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="At least 8 characters" required /></label>{error && <div className="auth-error">{error}</div>}{notice && <div className="auth-notice">{notice}</div>}<button className="auth-submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</button></form><div className="oauth-divider"><span>or</span></div><button type="button" className="google-login" onClick={googleLogin} disabled={loading}>Continue with Google</button><Link href="/" className="back-home">← Back to Tiktiki</Link></div></main>;
}
