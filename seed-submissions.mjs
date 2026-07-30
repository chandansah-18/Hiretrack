import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const client = createClient(
  'https://rzhhjeiyjvmtjyjzahbs.supabase.co',
  'sb_publishable_2b6SRXaAVA7-EiuThXIoxA_GEVrzd14',
  { auth: { persistSession: false } }
);

const raw = readFileSync('C:\\Users\\csah0\\Downloads\\Untitled_spreadsheet5.json', 'utf8');
const seed = JSON.parse(raw);
const rows = seed.data;

const [posRes, spoRes] = await Promise.all([
  client.from('positions').select('id, name, client_id, spoc_id'),
  client.from('spocs').select('id, name, client_id'),
]);
const allPositions = posRes.data ?? [];
const allSpocs = spoRes.data ?? [];

const recruiterMap = {
  'Vaishnavi': 'rec-ca6c321112bc', 'Neha': 'rec-862f1cbbabff',
  'Akanksha': 'rec-cdcf91aaf35e', 'Chandan': 'rec-c084e2a50a47',
  'Shivani': 'rec-f1d79adf6a68', 'Harsh': 'rec-f4ff40f6c549',
  'Praveen': 'rec-4f69b3a8b7d1', 'Avneesh': 'rec-ba28a9710de4',
  'Shivakant': 'rec-1840d8763fbc',
};

const clientMap = {
  'EXL': 'client-aaf2d9d1-a384-43c3-b107-06797e85bf62',
  'Tech Mahindra': 'client-8b21be91-672a-4f6d-9808-5e12c40ca4e7',
  'Wipro': 'client-595c4a66-24b7-4269-a278-e311a167824c',
  'Bristlecone': 'client-1f83a7b5-5afb-408f-8e1e-1ba252a4deb5',
  'H&B': 'client-03eb73e4-aeb0-4d2b-bc7d-751cf7f6113a',
  'UST Global': 'client-21698cf2-e9d6-435a-81ce-893261739900',
};

function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim(); }

function findPosition(posName, clientId) {
  const n = norm(posName);
  const candidates = allPositions.filter(p => p.client_id === clientId);
  for (const p of candidates) { if (norm(p.name) === n) return p; }
  for (const p of candidates) { if (norm(p.name).includes(n) || n.includes(norm(p.name))) return p; }
  for (const p of allPositions) { if (norm(p.name) === n) return p; }
  return null;
}

function findSpoc(spocName, clientId) {
  if (!spocName || spocName === '-') return null;
  const n = spocName.trim().toLowerCase();
  const candidates = allSpocs.filter(s => s.client_id === clientId);
  for (const s of candidates) { if (s.name.toLowerCase() === n) return s.id; }
  for (const s of candidates) { if (s.name.toLowerCase().includes(n) || n.includes(s.name.toLowerCase())) return s.id; }
  return null;
}

function parseCTC(val) {
  if (!val) return 0;
  const str = String(val).replace(/[₹,LPA\s]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseExp(val) {
  if (!val) return 0;
  return parseFloat(String(val).toLowerCase().replace(/years?|yrs?|\+/g, '').trim()) || 0;
}

function parseContact(val) {
  if (!val || val === '#VALUE!' || val === '#VALUE') return '';
  const cleaned = String(val).replace(/[^0-9]/g, '');
  return cleaned || '';
}

// Create missing positions
const createdPositions = new Map();

async function ensurePosition(posName, clientId, spocId, recruiterId) {
  let pos = findPosition(posName, clientId);
  if (pos) return pos;
  const key = posName + '|' + clientId;
  if (createdPositions.has(key)) return createdPositions.get(key);
  
  const newPos = {
    id: 'pos-' + crypto.randomUUID(),
    name: posName,
    client_id: clientId,
    recruiter_id: recruiterId || 'rec-862f1cbbabff',
    spoc_id: spocId || 'spoc-c862cf4d-084f-4cd7-94f8-777f065f1a2e',
    technology: 'General',
    vertical: 'General',
    status: 'Open',
    open_date: new Date().toISOString().slice(0, 10),
    openings: 1,
    ctc: 0,
    location: [],
    remarks: '',
    archived_at: null,
  };
  const { error } = await client.from('positions').insert(newPos);
  if (error) { console.log('  FAILED creating position', posName, error.message); return null; }
  createdPositions.set(key, newPos);
  console.log('  Created position: ' + posName);
  return newPos;
}

let created = 0, skipped = 0;

for (const row of rows) {
  const name = String(row['Candidate Name'] ?? '').trim();
  if (!name) { skipped++; continue; }
  
  const recruiterName = String(row['Recruiter'] ?? '').trim();
  const clientName = String(row['Client'] ?? '').trim();
  const posName = String(row['Position Name'] ?? '').trim();
  const pocName = String(row['POC Name'] ?? '').trim();
  
  const recruiterId = recruiterMap[recruiterName];
  const clientId = clientMap[clientName];
  
  if (!recruiterId || !clientId) {
    console.log(`SKIP ${name}: unknown recruiter=${recruiterName} or client=${clientName}`);
    skipped++; continue;
  }
  
  let position = findPosition(posName, clientId);
  if (!position) {
    console.log(`Creating position for ${name}: "${posName}" (${clientName})`);
    position = await ensurePosition(posName, clientId, findSpoc(pocName, clientId), recruiterId);
    if (!position) { skipped++; continue; }
  }
  
  const spocId = findSpoc(pocName, clientId) || position.spoc_id || null;
  const dateRaw = row['Date'];
  const submittedAt = dateRaw ? dateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
  
  const candidate = {
    id: 'cand-' + crypto.randomUUID(),
    name,
    contact_no: parseContact(row['Contact No']),
    email_id: String(row['Email ID'] ?? '').trim(),
    position_id: position.id,
    client_id: clientId,
    recruiter_id: recruiterId,
    spoc_id: spocId,
    technology: 'General',
    stage: 'CV Submitted',
    submitted_at: submittedAt,
    source: 'Naukri',
    remarks: '',
    current_ctc: parseCTC(row['Current CTC (LPA)']),
    expected_ctc: parseCTC(row['Expected CTC (LPA)']),
    notice_period: String(row['Notice Period/LWD'] ?? '').trim(),
    current_company: String(row['Current Company'] ?? '').trim(),
    experience: parseExp(row['Experience (Yrs)']),
    location: String(row['Location'] ?? '').trim(),
    requisition_id: row['Requisition ID'] ? String(row['Requisition ID']).trim() : '',
    final_select_date: null,
    final_select_status: 'Document Pending',
    holding_offer_ctc: 0,
    holding_offer_company: '',
    holding_offer_doj: '',
    archived_at: null,
  };
  
  const { error } = await client.from('candidates').insert(candidate);
  if (error) {
    console.log(`ERROR ${name}: ${error.message}`);
    skipped++;
  } else {
    created++;
    if (created % 10 === 0) console.log(`Progress: ${created} created...`);
  }
}

console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
