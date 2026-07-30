import pg from "pg";
import net from "net";

// Monkey-patch net.connect to intercept DNS resolution for our specific hostname
const origCreateConnection = net.createConnection;
net.createConnection = function (opts, cb) {
  if (typeof opts === "object" && opts.host === "db.rzhhjeiyjvmtjyjzahbs.supabase.co") {
    opts.host = "2406:da1a:314:7101:97e1:a2e4:b545:6ff4";
    opts.family = 6;
  }
  return origCreateConnection.call(this, opts, cb);
};
// Also handle the case where pg passes (port, host)
const origConnect = net.connect;
net.connect = function (a, b, c) {
  const args = [a, b, c];
  if (typeof b === "string" && b === "db.rzhhjeiyjvmtjyjzahbs.supabase.co") {
    args[1] = "2406:da1a:314:7101:97e1:a2e4:b545:6ff4";
  }
  return origConnect.apply(this, args);
};

const { Client } = pg;

const SQL = `
alter table public.offers add column if not exists bill_value numeric(12,2) not null default 0;
alter table public.offers add column if not exists selection_status text not null default 'Joining Pending';
`;

async function main() {
  const client = new Client({
    host: "db.rzhhjeiyjvmtjyjzahbs.supabase.co",
    port: 5432,
    user: "postgres",
    password: "og.chandan@12",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("Connected. Running migration...");
    await client.query(SQL);
    console.log("Migration completed.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
