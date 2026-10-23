"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import styles from "@/app/login/login.module.css";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    if (password.length < 8) {
      setIsError(true);
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("The passwords do not match.");
      return;
    }
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setIsError(true);
      setMessage("Password recovery is unavailable. Contact your administrator.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }
    setMessage("Password updated. You can now sign in with your new password.");
    window.setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <main className={styles.root}>
      <div className={styles.formPanel}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Set a new password</h1>
            <p className={styles.cardSubtitle}>Choose a new password for your account.</p>
          </header>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="new-password" className={styles.label}>New password</label>
              <input id="new-password" className={styles.input} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirm-password" className={styles.label}>Confirm password</label>
              <input id="confirm-password" className={styles.input} type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            {message && <div className={styles.errorBox} role={isError ? "alert" : "status"} style={!isError ? { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" } : undefined}>{message}</div>}
            <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "Updating…" : "Update password"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
