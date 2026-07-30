import pg from "pg";
import net from "net";
import dns from "dns";

// 1. Monkey-patch dns.lookup so it bypasses OS resolver for the DB host
const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (hostname === "db.rzhhjeiyjvmtjyjzahbs.supabase.co") {
    console.log("dns.lookup: Intercepted.");
    const ipv6 = "2406:da1a:314:7101:97e1:a2e4:b545:6ff4";
    if (options && options.all) {
      return callback(null, [{ address: ipv6, family: 6 }]);
    }
    return callback(null, ipv6, 6);
  }
  return origLookup(hostname, options, callback);
};

// 2. Monkey-patch net.connect/createConnection to force IPv6 family
const origCreateConnection = net.createConnection;
net.createConnection = function (opts, cb) {
  if (typeof opts === "object" && (opts.host === "db.rzhhjeiyjvmtjyjzahbs.supabase.co" || opts.host === "2406:da1a:314:7101:97e1:a2e4:b545:6ff4")) {
    console.log("net.createConnection: Intercepted and forcing family 6.");
    opts.host = "2406:da1a:314:7101:97e1:a2e4:b545:6ff4";
    opts.family = 6;
  }
  return origCreateConnection.call(this, opts, cb);
};

const origConnect = net.connect;
net.connect = function (a, b, c) {
  const args = [a, b, c];
  if (typeof b === "string" && (b === "db.rzhhjeiyjvmtjyjzahbs.supabase.co" || b === "2406:da1a:314:7101:97e1:a2e4:b545:6ff4")) {
    console.log("net.connect: Intercepted and transforming host.");
    args[1] = "2406:da1a:314:7101:97e1:a2e4:b545:6ff4";
  }
  return origConnect.apply(this, args);
};

const { Client } = pg;

const SQL = `
-- Drop existing policies first
drop policy if exists "activity_log_insert_admin" on public.activity_log;
drop policy if exists "activity_log_insert_active" on public.activity_log;

-- Recreate current_user_recruiter_id function
create or replace function public.current_user_recruiter_id()
returns text
language plpgsql
stable
as $$
declare
  rec_id text;
  user_email text;
  uid_text text;
begin
  -- Resolve by current user's email if available in JWT
  user_email := auth.jwt() ->> 'email';
  if user_email is not null then
    select id into rec_id
    from public.recruiters
    where lower(email) = lower(user_email)
    limit 1;
  end if;

  -- Fallback to the standard derived ID format if no recruiter profile matches
  if rec_id is null then
    uid_text := auth.uid()::text;
    rec_id := 'rec-' || left(replace(uid_text, '-', ''), 12);
  end if;

  return rec_id;
end;
$$;

-- Create correct policy for activity_log to allow recruiters to write logged events
create policy "activity_log_insert_active"
  on public.activity_log
  for insert
  to authenticated
  with check (public.has_active_profile());

-- Output status
select 'RLS fix run successfully' as status;
`;

const dbPassword = "og.chandan@12";

async function main() {
  console.log("Attempting direct connection to Supabase DB via IPv6...");
  
  const client = new Client({
    host: "db.rzhhjeiyjvmtjyjzahbs.supabase.co",
    port: 5432,
    user: "postgres",
    password: dbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("Connected successfully! Running migration...");
    const res = await client.query(SQL);
    console.log("SQL execution result:", res.rows || res);
    console.log("Migration executed successfully!");
  } catch (err) {
    if (err.message.includes("ENETUNREACH")) {
      console.error("\nError: Network unreachable. The system does not support IPv6 outbound routing.");
    } else {
      console.error("\nError running SQL migration:", err.message);
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
