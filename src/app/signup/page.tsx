"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import styles from "./signup.module.css";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const result = await signup(email.trim(), password, name.trim());
      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        setError(result.error ?? "Signup failed.");
        setSubmitting(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError("An unexpected error occurred.");
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

      <div className={styles.grid} aria-hidden="true" />

      <main className={styles.main}>
        <div className={styles.brandPanel}>
          <div className={styles.logo}>
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <p className={styles.eyebrow}>HireTrack</p>
          <h1 className={styles.brandTitle}>Join the team</h1>
          <p className={styles.brandDesc}>
            Create your account to start tracking candidates, interviews, and placements.
          </p>
          <div className={styles.features}>
            <span className={styles.featurePill}>Candidate pipeline tracking</span>
            <span className={styles.featurePill}>Interview scheduling</span>
            <span className={styles.featurePill}>Offer &amp; joining management</span>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={`${styles.card}${shake ? ` ${styles.shake}` : ""}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Create account</h2>
              <p className={styles.cardSub}>Use your company email to register.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>Full Name</label>
                <input
                  id="name"
                  ref={nameRef}
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  className={`${styles.input}${error ? ` ${styles.inputError}` : ""}`}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Work Email</label>
                <input
                  id="email"
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
                    autoComplete="new-password"
                    required
                    minLength={5}
                    placeholder="At least 5 characters"
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
              </div>

              {error && (
                <div className={styles.errorBox} role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !name || !email || !password}
                className={styles.submit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className={styles.footerLink}>
              Already have an account?{" "}
              <a href="/login">Sign in</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
