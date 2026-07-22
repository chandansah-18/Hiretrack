# Soft invite checklist (Phase 4)

Complete this **after** [go-live-smoke-test.md](./go-live-smoke-test.md) Phase 1–2 are green and [go-live-smoke-results.md](./go-live-smoke-results.md) automated checks pass.

Engineering cannot send invites for you — an **admin** must create users in the app.

## Day 0 — Pick pilot users

Choose **2–3** recruiters:

| # | Name | Email (`@huntsmenbarons.com`) | Invited? | First login OK? |
|---|------|-------------------------------|----------|-----------------|
| 1 |  |  | [ ] | [ ] |
| 2 |  |  | [ ] | [ ] |
| 3 |  |  | [ ] | [ ] |

## Day 0 — Create accounts

For each pilot user:

1. Log in as admin → **Control Room → Users**
2. Create user with role `recruiter` and password ≥ 8 characters
3. Share login URL + temp password via a secure channel (not a public Slack channel)
4. Ask them to change password after first login (Admin can reset if needed)

### Message template

```
Hi — we're soft-launching the Recruitment Operations dashboard.

Login: <APP_URL>/login
Email: <their email>
Temporary password: <temp>

Please:
1) Sign in and open Submissions / Interviews
2) Add or update one real record
3) Confirm the topbar shows "Saved"
4) Hard-refresh and confirm your change is still there

If Saved does not appear, refresh once and retry, then ping me.
```

## Day 1 — Check-in

- [ ] All 2–3 pilots logged in successfully
- [ ] No lost-edit reports
- [ ] Admin exported a fresh JSON backup
- [ ] Storage & Archive still loads

## Day 2–3 — Expand

- [ ] Invite remaining recruiters using the same process
- [ ] Weekly backup reminder set (calendar)

## Stop / escalate

If any pilot loses data or cannot save:

1. Pause further invites
2. Export backup
3. Do **not** purge
4. Re-run Phase 2 smoke tests
