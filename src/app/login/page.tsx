"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import styles from "./login.module.css";

export default function LoginPage() {
  const { login, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [shake, setShake] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) {
      const from = searchParams.get("from") ?? "/dashboard";
      window.location.href = from;
    }
  }, [session, router, searchParams]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        const from = searchParams.get("from") ?? "/dashboard";
        window.location.href = from;
      } else {
        setError(result.error ?? "Login failed.");
        setSubmitting(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError("An unexpected error occurred. Check the console for details.");
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setResetSent(false);
    const normalizedEmail = email.trim();
    if (!normalizedEmail.toLowerCase().endsWith("@huntsmenbarons.com")) {
      setError("Enter your @huntsmenbarons.com email first.");
      return;
    }
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError("Password recovery is unavailable. Contact your administrator.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the reset email. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>

      <div className={styles.stars} aria-hidden="true" />
      <div className={styles.shootingStar} aria-hidden="true" />

      <main className={styles.main}>
        <div className={styles.brandPanel}>
          <div className={styles.brandInner}>
            <div className={styles.brandTop}>
              <div className={styles.logoIcon}>
                <LayoutDashboard className="h-5 w-5 text-white/80" />
              </div>
              <span className={styles.badge}>Recruitment OS</span>
            </div>

            <h1 className={styles.brandTitle}>
              <span className={styles.brandTitleGradient}>
                HireTrack
              </span>
              <span className={styles.brandTitleGlow} aria-hidden="true">
                HireTrack
              </span>
            </h1>

            <p className={styles.tagline}>Track. Recruit. Succeed.</p>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureDot} />
                Real-time pipeline tracking
              </div>
              <div className={styles.feature}>
                <span className={styles.featureDot} />
                Client &amp; position management
              </div>
              <div className={styles.feature}>
                <span className={styles.featureDot} />
                Smart analytics &amp; insights
              </div>
            </div>

            <hr className={styles.accentLine} />
            <p className={styles.madeWith}>Made with <span className={styles.heart}>&#10084;</span> by Huntsmen &amp; Barons</p>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={`${styles.card}${shake ? ` ${styles.shake}` : ""}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Welcome back</h2>
              <p className={styles.cardSubtitle}>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Work Email</label>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@huntsmenbarons.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={`${styles.input}${error ? ` ${styles.inputError}` : ""}`}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.passwordWrap}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className={`${styles.input} ${styles.inputPw}${error ? ` ${styles.inputError}` : ""}`}
                  />
                  <button
                    type="button"
                    className={styles.pwToggle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={handlePasswordReset} disabled={submitting} style={{ alignSelf: "flex-end", border: 0, background: "none", padding: "0.2rem 0", color: "#2563eb", cursor: submitting ? "wait" : "pointer", fontSize: "0.78rem" }}>
                  Forgot password?
                </button>
              </div>

              {resetSent && <div className={styles.errorBox} role="status" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>If an account exists for that email, a password reset link has been sent.</div>}
              {error && (
                <div className={styles.errorBox} role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className={styles.submit}
                id="login-submit-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
