# Go-live automated smoke results

Generated: 2026-07-20T19:04:29.114Z

Project: `https://rzhhjeiyjvmtjyjzahbs.supabase.co`

**Score: 19/19 passed**

| Check | Status | Detail |
|-------|--------|--------|
| env.NEXT_PUBLIC_SUPABASE_URL | PASS | set |
| env.NEXT_PUBLIC_SUPABASE_ANON_KEY | PASS | set |
| env.SUPABASE_SERVICE_ROLE_KEY | PASS | set |
| candidates.archived_at | PASS | column readable |
| interviews.archived_at | PASS | column readable |
| positions.archived_at | PASS | column readable |
| offers.archived_at | PASS | column readable |
| joinings.archived_at | PASS | column readable |
| rpc.get_dashboard_storage_stats | PASS | not authorized |
| rpc.archive_closed_candidates | PASS | not authorized |
| rpc.purge_archived_candidates | PASS | not authorized |
| rpc.current_user_recruiter_id | PASS | callable |
| rpc.is_admin | PASS | callable |
| candidates.active_count | PASS | count=19 |
| profiles.list | PASS | rows=7 |
| profiles.has_active_admin | PASS | admins=1 |
| auth.listUsers | PASS | users=8 |
| backup.table_reads | PASS | profiles: ok; recruiters: ok; clients: ok; spocs: ok; positions: ok; candidates: ok; interviews: ok; offers: ok; joinings: ok; cv_shared_entries: ok; leaves: ok; activity_log: ok |
| soft_archive.update_column | PASS | update accepted |

## Manual UI steps still required

Complete Phase 2 checkboxes in [go-live-smoke-test.md](./go-live-smoke-test.md) in a browser before inviting the full team.

Then use [soft-invite-checklist.md](./soft-invite-checklist.md) to invite 2–3 recruiters.

UI steps (create user, Saved badge, two-browser realtime, typed delete) cannot be fully automated here.
