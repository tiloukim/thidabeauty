"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

declare global {
  interface Window {
    TelegramLoginCallback: (user: TelegramUser) => void;
    Telegram?: { Login: { auth: (options: { bot_id: string; request_access?: string }, callback: (user: TelegramUser | false) => void) => void } };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    setCaptchaToken("");
    turnstileRef.current?.reset();

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

  const handleTelegramCallback = useCallback(async (user: TelegramUser | false) => {
    if (!user) return;
    setTelegramLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Telegram login failed");
        setTelegramLoading(false);
        return;
      }
      // Use the token to verify OTP and create session
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: data.type,
      });
      if (verifyError) {
        setError(verifyError.message);
        setTelegramLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Telegram login failed");
      setTelegramLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Load Telegram widget script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    document.body.appendChild(script);
    window.TelegramLoginCallback = (user: TelegramUser) => {
      handleTelegramCallback(user);
    };
    return () => {
      document.body.removeChild(script);
    };
  }, [handleTelegramCallback]);

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
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken("")}
            options={{ theme: "light", size: "flexible" }}
          />
          <button type="submit" className="auth-btn" disabled={loading || !captchaToken}>
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
        <button
          className="auth-btn-telegram"
          disabled={telegramLoading}
          onClick={() => {
            if (window.Telegram?.Login) {
              window.Telegram.Login.auth(
                { bot_id: process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "", request_access: "write" },
                handleTelegramCallback
              );
            } else {
              setError("Telegram widget not loaded. Please try again.");
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          {telegramLoading ? "Connecting..." : "Continue with Telegram"}
        </button>

        <div className="auth-link">
          Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
