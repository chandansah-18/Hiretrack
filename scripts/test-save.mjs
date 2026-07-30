import { createClient } from "@supabase/supabase-js";

const URL = "https://rzhhjeiyjvmtjyjzahbs.supabase.co";
const ANON_KEY = "sb_publishable_2b6SRXaAVA7-EiuThXIoxA_GEVrzd14";

const client = createClient(URL, ANON_KEY);

async function syncRows(table, rows) {
  const { data: existing, error: selectError } = await client.from(table).select("id");
  if (selectError) { throw selectError; }

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const nextIds = new Set(rows.map((row) => row.id));
  const removedIds = [...existingIds].filter((id) => !nextIds.has(id));

  if (removedIds.length > 0) {
    const { error: deleteError } = await client.from(table).delete().in("id", removedIds);
    if (deleteError) { throw deleteError; }
  }

  if (rows.length > 0) {
    const { error: upsertError } = await client.from(table).upsert(rows, { onConflict: "id" });
    if (upsertError) { throw upsertError; }
  }
}

async function main() {
  console.log("Testing syncRows for each table...");

  const tables = ["clients", "spocs", "recruiters", "positions", "candidates", "interviews", "offers", "joinings", "cv_shared_entries", "activity_log"];

  for (const table of tables) {
    try {
      const { data, error } = await client.from(table).select("*").limit(1);
      if (error) {
        console.log(`${table}: SELECT failed - ${JSON.stringify(error)}`);
        continue;
      }
      if (!data || data.length === 0) {
        console.log(`${table}: no rows, skipping`);
        continue;
      }
      await syncRows(table, data);
      console.log(`${table}: OK`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.log(`${table}: FAILED - ${msg}`);
    }
  }
}

main();
