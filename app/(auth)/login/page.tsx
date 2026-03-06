"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">ThidaBeauty</div>
          <div className="auth-logo-sub">ថីតាប្យូទី</div>
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="auth-btn-google" onClick={() => handleOAuth("google")}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.99-.15-1.17z" fill="#4285F4"/><path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/><path d="M4.51 10.53a4.8 4.8 0 0 1 0-3.06V5.4H1.83a8 8 0 0 0 0 7.2l2.68-2.07z" fill="#FBBC05"/><path d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4l2.68 2.07c.63-1.89 2.39-3.29 4.47-3.29z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <button className="auth-btn-facebook" onClick={() => handleOAuth("facebook")}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M18 9a9 9 0 1 0-10.41 8.9v-6.3H5.3V9h2.29V7.01c0-2.26 1.34-3.51 3.4-3.51.99 0 2.02.18 2.02.18v2.22h-1.14c-1.12 0-1.47.7-1.47 1.41V9h2.5l-.4 2.6h-2.1v6.3A9 9 0 0 0 18 9z"/></svg>
          Continue with Facebook
        </button>

        <div className="auth-link">
          Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
