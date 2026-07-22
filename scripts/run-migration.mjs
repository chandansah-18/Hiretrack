import pg from 'pg';

const { Pool } = pg;

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'rzhhjeiyjvmtjyjzahbs';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const MIGRATION_SQL = `
alter table public.candidates add column if not exists holding_offer_ctc numeric(12,2) not null default 0;
alter table public.candidates add column if not exists holding_offer_company text not null default '';
alter table public.candidates add column if not exists holding_offer_doj text not null default '';
`;

// Try different connection formats
const attempts = [
  // JWT auth via transaction pooler - various user formats
  `postgresql://postgres.${projectRef}:${encodeURIComponent(key)}@${projectRef}.supabase.co:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(key)}@${projectRef}.supabase.co:6543/postgres`,
  `postgresql://${projectRef}:${encodeURIComponent(key)}@${projectRef}.supabase.co:6543/postgres`,
  // Direct with service role as password
  `postgresql://postgres:${encodeURIComponent(key)}@db.${projectRef}.supabase.co:5432/postgres`,
  // Pooler with standard host
  `postgresql://postgres.${projectRef}:${encodeURIComponent(key)}@${projectRef}.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(key)}@${projectRef}.pooler.supabase.com:6543/postgres`,
  // Regions for aws pooler
  ...['us-east-1', 'ap-southeast-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-2'].flatMap(region => [
    `postgresql://postgres.${projectRef}:${encodeURIComponent(key)}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${encodeURIComponent(key)}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
  ]),
];

for (const url of attempts) {
  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000 });
  try {
    const client = await pool.connect();
    console.log(`Connected! Running migration...`);
    await client.query(MIGRATION_SQL);
    console.log('SUCCESS: Migration ran successfully!');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    const msg = err.message;
    if (!msg.includes('timeout') && !msg.includes('ENOTFOUND') && !msg.includes('ECONNREFUSED')) {
      console.log(`Interesting error (connection worked but query failed): ${url}`);
      console.log(`  ${msg}`);
    }
    await pool.end().catch(() => {});
  }
}

console.log('\nCould not connect via any method.');
console.log(`\nRun this SQL manually in Supabase SQL Editor:`);
console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log(`\n${MIGRATION_SQL}`);
process.exit(1);
