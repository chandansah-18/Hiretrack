const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function pass(name, ok, detail) {
  return { name, status: ok ? "PASS" : "FAIL", detail: detail ?? "" };
}

(async () => {
  const results = [];
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  for (const k of required) {
    results.push(pass("env." + k, Boolean(env[k]), env[k] ? "set" : "missing"));
  }

  for (const t of ["candidates", "interviews", "positions", "offers", "joinings"]) {
    const r = await client.from(t).select("id, archived_at").limit(1);
    results.push(pass(t + ".archived_at", !r.error, r.error?.message || "column readable"));
  }

  for (const name of [
    "get_dashboard_storage_stats",
    "archive_closed_candidates",
    "purge_archived_candidates",
    "current_user_recruiter_id",
    "is_admin",
  ]) {
    const args = name.includes("archive") || name.includes("purge") ? { before_date: "1970-01-01" } : undefined;
    const r = await client.rpc(name, args);
    const missing =
      r.error &&
      (String(r.error.message).includes("Could not find") || String(r.error.message).includes("does not exist"));
    results.push(pass("rpc." + name, !missing, r.error ? r.error.message : "callable"));
  }

  const cand = await client.from("candidates").select("id", { count: "exact", head: true }).is("archived_at", null);
  results.push(pass("candidates.active_count", !cand.error, "count=" + (cand.count ?? "?")));

  const profiles = await client.from("profiles").select("id, role, active");
  results.push(pass("profiles.list", !profiles.error, "rows=" + (profiles.data?.length ?? 0)));
  const admins = (profiles.data || []).filter((p) => p.role === "admin" && p.active !== false);
  results.push(pass("profiles.has_active_admin", admins.length > 0, "admins=" + admins.length));

  const users = await client.auth.admin.listUsers({ perPage: 100 });
  results.push(pass("auth.listUsers", !users.error, "users=" + (users.data?.users?.length ?? 0)));

  const tables = [
    "profiles",
    "recruiters",
    "clients",
    "spocs",
    "positions",
    "candidates",
    "interviews",
    "offers",
    "joinings",
    "cv_shared_entries",
    "leaves",
    "activity_log",
  ];
  let backupOk = true;
  const backupDetail = [];
  for (const table of tables) {
    const r = await client.from(table).select("*").limit(1);
    if (r.error) {
      backupOk = false;
      backupDetail.push(table + ": " + r.error.message);
    } else {
      backupDetail.push(table + ": ok");
    }
  }
  results.push(pass("backup.table_reads", backupOk, backupDetail.join("; ")));

  const archProbe = await client
    .from("candidates")
    .update({ archived_at: null })
    .eq("id", "__smoke_probe_nonexistent__")
    .select("id");
  results.push(
    pass(
      "soft_archive.update_column",
      !archProbe.error || !String(archProbe.error.message).includes("archived_at"),
      archProbe.error?.message || "update accepted"
    )
  );

  const failed = results.filter((r) => r.status === "FAIL");
  const summary = {
    ranAt: new Date().toISOString(),
    project: env.NEXT_PUBLIC_SUPABASE_URL,
    total: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: failed.length,
    results,
  };

  const md = [
    "# Go-live automated smoke results",
    "",
    "Generated: " + summary.ranAt,
    "",
    "Project: `" + summary.project + "`",
    "",
    "**Score: " + summary.passed + "/" + summary.total + " passed**" + (summary.failed ? " (" + summary.failed + " failed)" : ""),
    "",
    "| Check | Status | Detail |",
    "|-------|--------|--------|",
    ...results.map((r) => "| " + r.name + " | " + r.status + " | " + String(r.detail).replace(/\|/g, "/") + " |"),
    "",
    "## Manual UI steps still required",
    "",
    "Complete Phase 2 checkboxes in [go-live-smoke-test.md](./go-live-smoke-test.md) in a browser before inviting the full team.",
    "",
    "Then use [soft-invite-checklist.md](./soft-invite-checklist.md) to invite 2–3 recruiters.",
    "",
    "UI steps (create user, Saved badge, two-browser realtime, typed delete) cannot be fully automated here.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(__dirname, "..", "docs", "go-live-smoke-results.md"), md);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
