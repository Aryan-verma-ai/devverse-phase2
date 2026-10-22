/**
 * Live HTTP probe for Prompt 15 acceptance criteria.
 * Run: node scripts/probe-server.js
 * (server must be running on port 5000)
 */

const BASE = 'http://localhost:5000';

const cases = [
  { label: 'GET /api/health           → 200 + status:ok', url: `${BASE}/api/health`, expectStatus: 200, expectBodyKey: 'status', expectBodyVal: 'ok' },
  { label: 'GET /api/not-a-route      → 404 + JSON error', url: `${BASE}/api/not-a-route`, expectStatus: 404, expectBodyKey: 'code', expectBodyVal: 'NOT_FOUND' },
  { label: 'GET /api/projects/missing → 404 + JSON error', url: `${BASE}/api/projects/missing`, expectStatus: 404, expectBodyKey: 'code', expectBodyVal: 'NOT_FOUND' },
];

let passed = 0;
let failed = 0;

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 15 — Live HTTP Probe');
console.log('═══════════════════════════════════════════════════════\n');

for (const c of cases) {
  let res, body;
  try {
    res = await fetch(c.url);
    body = await res.json();
  } catch (err) {
    console.log(`  ✗ [FAIL] ${c.label}`);
    console.log(`         → ${err.message}`);
    failed++;
    continue;
  }

  const statusOk = res.status === c.expectStatus;
  const bodyOk = body[c.expectBodyKey] === c.expectBodyVal;

  if (statusOk && bodyOk) {
    console.log(`  ✓ [PASS] ${c.label}`);
    console.log(`         → HTTP ${res.status} | body: ${JSON.stringify(body)}`);
    passed++;
  } else {
    console.log(`  ✗ [FAIL] ${c.label}`);
    console.log(`         → HTTP ${res.status} (expected ${c.expectStatus}) | body: ${JSON.stringify(body)}`);
    failed++;
  }
}

console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

process.exit(failed > 0 ? 1 : 0);
