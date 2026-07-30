import { createClient } from '@supabase/supabase-js';
const client = createClient(
  'https://rzhhjeiyjvmtjyjzahbs.supabase.co',
  'sb_publishable_2b6SRXaAVA7-EiuThXIoxA_GEVrzd14',
  { auth: { persistSession: false } }
);

async function main() {
  const { data: offers } = await client.from('offers').select('*').eq('selection_status', 'Joining Pending');
  console.log('Pending offers:', offers?.length || 0);
  for (const o of offers || []) {
    const { data: c } = await client.from('candidates').select('name').eq('id', o.candidate_id).single();
    // Check if joining already exists
    const { data: existing } = await client.from('joinings').select('id').eq('candidate_id', o.candidate_id);
    if (existing?.length) {
      console.log(c?.name + ': joining already exists (' + existing[0].id.slice(0,20) + '...)');
      continue;
    }
    const { error } = await client.from('joinings').insert({
      id: 'join-' + crypto.randomUUID(),
      candidate_id: o.candidate_id,
      position_id: o.position_id,
      client_id: o.client_id,
      recruiter_id: o.recruiter_id,
      joining_date: '2026-08-15',
      status: 'Not Joined',
    });
    console.log(c?.name || '?', error ? 'ERROR: ' + error.message : 'OK');
  }
}
main();
