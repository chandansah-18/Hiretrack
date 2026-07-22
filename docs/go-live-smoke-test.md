# Go-live smoke test & rollout runbook

Use this checklist before inviting the full Huntsmen & Barons team.  
**Fail any required step = do not expand the rollout.**

Live Supabase project: `rzhhjeiyjvmtjyjzahbs`

---

## Phase 1 — Pre-flight

Run against the **deployed** app URL (or `npm run build && npm start` with production `.env.local`).

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set on the host
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key) is set on the host
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set on the host (server only — never expose to the browser)
- [ ] Production login fails clearly if Supabase env vars are missing (no localStorage demo auth)
- [ ] **Supabase Dashboard → Authentication → Providers / Settings**: public/email **signups disabled** (admin creates users only)
- [ ] Admin can log in with `@huntsmenbarons.com` and lands on `/dashboard`
- [ ] Admin profile shows `role = admin` and `active = true`
- [ ] **Admin → Overview → Storage & Archive** loads stats (not “not authorized”)
- [ ] Note current DB size vs **2 GB** limit: ________
- [ ] **Export backup** downloaded and stored offline (OneDrive / secure share): ________

---

## Phase 2 — Smoke test (required)

Execute in order.

| # | Step | Pass criteria | Pass? |
|---|------|----------------|-------|
| 1 | Admin creates recruiter `@huntsmenbarons.com` with password ≥ 8 chars | User listed; recruiter can log in | [ ] |
| 2 | Recruiter adds a position + candidate | Row appears; topbar shows **Saved** | [ ] |
| 3 | Edit candidate or interview status | **Saved**; hard refresh keeps the change | [ ] |
| 4 | (Optional) Go offline briefly mid-edit, then back | Toast + reload; no ghost edit that “looks saved” but isn’t | [ ] |
| 5 | Two browsers: user A edits, user B watches | B updates without crashing | [ ] |
| 6 | Delete with typed-name confirm | Item leaves active UI (soft-archived); backup still exports | [ ] |
| 7 | Recruiter opens `/dashboard/admin` | No user CRUD access (permission message) | [ ] |
| 8 | Admin deactivates the test user | User cannot re-login / session blocked | [ ] |

**Smoke result:** Pass / Fail  
**Date:** ________  
**Tester:** ________  
**Notes:** ________

Automated API/schema checks (run by engineering) are recorded in [go-live-smoke-results.md](./go-live-smoke-results.md).

Re-run automated checks:

```bash
node scripts/go-live-smoke.cjs
```

---

## Phase 3 — Soft invite (first 1 day)

Invite **2–3 recruiters** only after Phase 1–2 are green.

Use the full checklist: [soft-invite-checklist.md](./soft-invite-checklist.md).

### Invite steps (admin)

1. Admin → Users → Create user  
   - Email: `name@huntsmenbarons.com`  
   - Role: `recruiter`  
   - Temporary password ≥ 8 characters (share via secure channel; ask them to change on first day)
2. Send them:
   - App login URL: ________
   - Their email + temp password
   - Rule: *If the topbar does not show “Saved” after an edit, refresh once and retry; then ping admin.*
3. Ask them to complete one real task: add or update a candidate, then hard-refresh.

### Day-1 check-in

- [ ] No reports of lost edits
- [ ] No “Could not save” loops
- [ ] Storage & Archive still loads
- [ ] Export a fresh backup at end of day 1

---

## Phase 4 — Expand rollout (day 2–3)

- [ ] Invite remaining recruiters the same way
- [ ] Share password-reset path: Admin updates password
- [ ] Remind team: hot dashboard shows roughly the **last 18 months** of pipeline; ask admin for older archive questions

### Ongoing ops

| Cadence | Action |
|---------|--------|
| Weekly | Admin exports Supabase JSON backup |
| Monthly | Review Storage & Archive (size, archived count) |
| Before purge | Always export backup first; never purge without a file on disk |

---

## Phase 5 — Rollback / incident

If launch breaks:

1. **Do not purge** archived data.
2. Keep the last JSON backup.
3. Redeploy the previous known-good build (if hosting supports rollback).
4. Stop team edits if data looks wrong; export another backup; investigate before archive/purge.
5. Contact: ________

---

## Out of scope (this launch)

- Full server-side pagination rewrite  
- Concurrent-edit merge / conflict UI  
- CI/CD pipeline  
- Public self-signup  

---

## Success criteria

- [ ] Smoke checklist all green (or only optional step 4 skipped)
- [ ] At least one offline backup stored
- [ ] 2–3 users complete a real workday without data loss
- [ ] Admin can open Storage stats and export backup without errors
