import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const client = createClient(
  'https://rzhhjeiyjvmtjyjzahbs.supabase.co',
  'sb_publishable_2b6SRXaAVA7-EiuThXIoxA_GEVrzd14',
  { auth: { persistSession: false } }
);

const raw = readFileSync('C:\\Users\\csah0\\Downloads\\interviews.json', 'utf8');
const rows = JSON.parse(raw).data;

const recruiterMap = {
  Vaishnavi: 'rec-ca6c321112bc', Neha: 'rec-862f1cbbabff',
  Akanksha: 'rec-cdcf91aaf35e', Chandan: 'rec-c084e2a50a47',
  Shivani: 'rec-f1d79adf6a68', Harsh: 'rec-f4ff40f6c549',
  Praveen: 'rec-4f69b3a8b7d1', Avneesh: 'rec-ba28a9710de4',
  Shivakant: 'rec-1840d8763fbc',
};

const clientMap = {
  EXL: 'client-aaf2d9d1-a384-43c3-b107-06797e85bf62',
  'Tech Mahindra': 'client-8b21be91-672a-4f6d-9808-5e12c40ca4e7',
  Wipro: 'client-595c4a66-24b7-4269-a278-e311a167824c',
  Bristlecone: 'client-1f83a7b5-5afb-408f-8e1e-1ba252a4deb5',
};

const roundMap = { L1: 'L1', L2: 'L2', 'Client Round': 'CI' };
const stageUpMap = {
  'L1 Scheduled': 'Interview Scheduled',
  'L2 Scheduled': 'Interview',
  'CI Round Scheduled': 'Interview',
  'L1 Done': 'Interview',
  'L1 Reject': 'Interview',
};
const stageOrder = ['CV Submitted', 'Interview Scheduled', 'Interview', 'Final Selection'];

function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim(); }

async function main() {
  // Load all positions once (should be under 1000)
  const { data: allPositions } = await client.from('positions')
    .select('id, name, client_id').is('archived_at', null);
  const posList = allPositions || [];

  const createdPositions = new Map();

  async function findOrCreatePosition(posName, clientId, recruiterId) {
    const n = norm(posName);
    const byClient = posList.filter(p => p.client_id === clientId);
    for (const p of byClient) { if (norm(p.name) === n) return p; }
    for (const p of byClient) { if (norm(p.name).includes(n) || n.includes(norm(p.name))) return p; }
    const key = posName + '|' + clientId;
    if (createdPositions.has(key)) return createdPositions.get(key);
    const newPos = {
      id: 'pos-' + crypto.randomUUID(),
      name: posName, client_id: clientId,
      recruiter_id: recruiterId || 'rec-862f1cbbabff',
      spoc_id: 'spoc-c862cf4d-084f-4cd7-94f8-777f065f1a2e',
      technology: 'General', vertical: 'General', status: 'Open',
      open_date: new Date().toISOString().slice(0, 10),
      openings: 1, ctc: 0, location: [], remarks: '', archived_at: null,
    };
    const { error } = await client.from('positions').insert(newPos);
    if (error) { console.log(`  FAILED pos ${posName}: ${error.message}`); return null; }
    console.log(`  Created pos: ${posName}`);
    createdPositions.set(key, newPos);
    return newPos;
  }

  let created = 0, skipped = 0;

  for (const row of rows) {
    const name = String(row['Candidate Name'] ?? '').trim();
    if (!name) { skipped++; continue; }

    const recruiterName = String(row['Recruiter'] ?? '').trim();
    const clientName = String(row['Client'] ?? '').trim();
    const posName = String(row['Position Name'] ?? '').trim();
    const roundStr = String(row['Round'] ?? '').trim();
    const status = String(row['Interview Status'] ?? '').trim();
    const phone = row['Contact No'] ? String(row['Contact No']).replace(/\D/g, '') : '';

    const recruiterId = recruiterMap[recruiterName];
    const clientId = clientMap[clientName];
    if (!recruiterId || !clientId) {
      console.log(`SKIP ${name}: unknown recruiter/client`); skipped++; continue;
    }

    const position = await findOrCreatePosition(posName, clientId, recruiterId);
    if (!position) { skipped++; continue; }

    // Find candidate (direct query to avoid 1000-row limit)
    const { data: cands } = await client.from('candidates')
      .select('id, name, contact_no, stage')
      .ilike('name', name);
    let candidate = null;
    if (cands?.length === 1) candidate = cands[0];
    else if (cands?.length > 1 && phone) {
      candidate = cands.find(c => c.contact_no?.replace(/\D/g, '') === phone) || cands[0];
    }
    if (!candidate) {
      console.log(`SKIP ${name}: no candidate match (${cands?.length || 0} found)`);
      skipped++; continue;
    }

    const { data: existing } = await client.from('interviews')
      .select('id').eq('candidate_id', candidate.id)
      .eq('position_id', position.id)
      .eq('round', roundMap[roundStr] || roundStr);
    if (existing?.length) {
      console.log(`SKIP ${name}: interview exists (${existing[0].id.slice(0,20)}...)`);
      skipped++; continue;
    }

    const interviewDate = (row['Date'] || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const interview = {
      id: 'int-' + crypto.randomUUID(),
      candidate_id: candidate.id,
      position_id: position.id,
      client_id: clientId,
      recruiter_id: recruiterId,
      interview_date: interviewDate,
      time: (row['Time'] || '').slice(0, 5),
      round: roundMap[roundStr] || roundStr,
      status,
      feedback_due: interviewDate,
      remarks: '',
    };

    const { error } = await client.from('interviews').insert(interview);
    if (error) {
      console.log(`ERROR ${name}: ${error.message}`); skipped++; continue;
    }

    const newStage = stageUpMap[status];
    if (newStage) {
      const ci = stageOrder.indexOf(candidate.stage);
      const ni = stageOrder.indexOf(newStage);
      if (ci >= 0 && ni >= 0 && ni > ci) {
        await client.from('candidates').update({ stage: newStage }).eq('id', candidate.id);
      }
    }

    created++;
    console.log(`  ${created}. ${name} → ${status} (${roundMap[roundStr] || roundStr})`);
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

main();
