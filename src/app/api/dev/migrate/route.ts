import { NextResponse } from "next/server";

const MIGRATION_SQL = `
-- holding_offer fields
alter table public.candidates add column if not exists holding_offer_ctc numeric(12,2) not null default 0;
alter table public.candidates add column if not exists holding_offer_company text not null default '';
alter table public.candidates add column if not exists holding_offer_doj text not null default '';

-- leaves table + recruiter fields
create table if not exists public.leaves (
  id text primary key,
  recruiter_id text not null references public.recruiters (id) on delete cascade,
  date text not null,
  type text not null,
  marked_by text not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'touch_leaves_updated_at'
      and tgrelid = 'public.leaves'::regclass
  ) then
    create trigger touch_leaves_updated_at
      before update on public.leaves
      for each row
      execute function public.touch_updated_at();
  end if;
end;
$$;

alter table public.leaves enable row level security;

drop policy if exists "leaves_read_write_active" on public.leaves;
create policy "leaves_read_write_active"
  on public.leaves
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

alter table public.recruiters add column if not exists designation text;
alter table public.recruiters add column if not exists contact_no text;
alter table public.recruiters add column if not exists birthday text;
`;

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/rzhhjeiyjvmtjyjzahbs/sql/new";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Migrations are disabled in production." }, { status: 403 });
  }

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Database Migration</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #64748b; margin-bottom: 1.5rem; }
    .btn { display: inline-block; padding: 10px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.875rem; }
    .btn:hover { background: #2563eb; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.5; margin: 1rem 0; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 0.875rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Database Migration Required</h1>
  <p>The database is missing the <code>public.leaves</code> table and recruiter fields.</p>
  <div class="note">
    <strong>Auto-connection failed.</strong> The Supabase pooler could not be reached — the database password may differ from the service role key.
  </div>
  <a class="btn" href="${SQL_EDITOR_URL}" target="_blank">Open Supabase SQL Editor</a>
  <p style="margin-top: 1rem; font-size: 0.875rem;">Copy and paste the SQL below into the editor, then click <strong>Run</strong>:</p>
  <pre>${MIGRATION_SQL.trim()}</pre>
</body>
</html>`,
    { headers: { "content-type": "text/html" } }
  );
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Migrations are disabled in production." }, { status: 403 });
  }

  return new Response(null, {
    status: 303,
    headers: { location: "/api/dev/migrate" },
  });
}
