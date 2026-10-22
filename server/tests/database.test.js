/**
 * DEVVERSE — Prompt 17: Database Configuration & Readiness Tests
 *
 * Exercises:
 *   - Credential masking in MongoDB connection strings
 *   - Readiness status and state mapping
 *   - Startup behavior when MONGODB_URI is absent (development vs production)
 *   - Graceful connection error reporting
 *   - /api/health database readiness reporting
 *
 * Run: node server/tests/database.test.js
 */

import http from 'http';
import app from '../app.js';
import {
  sanitizeMongoUri,
  getDatabaseStatus,
  isDatabaseConnected,
  connectDatabase,
} from '../config/database.js';

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ status: 'PASS', name });
  } catch (err) {
    failed++;
    results.push({ status: 'FAIL', name, error: err.message });
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ status: 'PASS', name });
  } catch (err) {
    failed++;
    results.push({ status: 'FAIL', name, error: err.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 17 — Database Connection & Readiness Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. URI Credential Sanitization ──────────────────────────────────────────

test('sanitizeMongoUri masks credentials in standard mongodb:// URI', () => {
  const input = 'mongodb://app_user:SuperSecretPassword123@127.0.0.1:27017/devverse';
  const sanitized = sanitizeMongoUri(input);
  assert(!sanitized.includes('SuperSecretPassword123'), 'Sanitized URI must not contain password');
  assert(sanitized.includes('app_user:****@'), 'Should replace password with ****');
});

test('sanitizeMongoUri masks credentials in mongodb+srv:// Atlas URI', () => {
  const input = 'mongodb+srv://clusterUser:MySecretPass@cluster0.abcde.mongodb.net/devverse?retryWrites=true';
  const sanitized = sanitizeMongoUri(input);
  assert(!sanitized.includes('MySecretPass'), 'Sanitized URI must not contain password');
  assert(sanitized.includes('clusterUser:****@'), 'Should replace password with ****');
});

test('sanitizeMongoUri leaves passwordless local URI unchanged', () => {
  const input = 'mongodb://127.0.0.1:27017/devverse';
  assertEqual(sanitizeMongoUri(input), input);
});

test('sanitizeMongoUri handles empty/null gracefully', () => {
  assertEqual(sanitizeMongoUri(''), '');
  assertEqual(sanitizeMongoUri(null), '');
});

// ── 2. Database Status & Readiness ──────────────────────────────────────────

test('getDatabaseStatus reports disconnected when no connection exists', () => {
  const status = getDatabaseStatus();
  assertEqual(status, 'disconnected');
});

test('isDatabaseConnected returns false when disconnected', () => {
  assertEqual(isDatabaseConnected(), false);
});

// ── 3. Startup Connection Behavior ──────────────────────────────────────────

await testAsync('connectDatabase returns null when MONGODB_URI is empty in development', async () => {
  const result = await connectDatabase('');
  assertEqual(result, null);
});

await testAsync('connectDatabase throws in production when MONGODB_URI is empty', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let threw = false;
  try {
    await connectDatabase('');
  } catch (err) {
    threw = true;
    assert(err.message.includes('required in production'), 'Error must note production requirement');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
  assert(threw, 'connectDatabase should have thrown an error in production without MONGODB_URI');
});

await testAsync('connectDatabase safely reports error on unreachable URI', async () => {
  // Use invalid port and non-existent host with short timeout
  const badUri = 'mongodb://secretUser:p4ssw0rd@127.0.0.1:59999/devverse?serverSelectionTimeoutMS=500';
  let threw = false;
  try {
    await connectDatabase(badUri);
  } catch (err) {
    threw = true;
    // Error message must not leak password
    assert(!err.message.includes('p4ssw0rd'), 'Connection error message must not leak password');
  }
  assert(threw, 'Connecting to unreachable host should throw');
});

// ── 4. Health endpoint readiness ────────────────────────────────────────────

await testAsync('GET /api/health exposes database status', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assertEqual(res.status, 200);
    const body = await res.json();
    assertEqual(body.status, 'ok');
    assertEqual(body.database, 'disconnected');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ── Print Results ───────────────────────────────────────────────────────────

for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} [${r.status}] ${r.name}`);
  if (r.error) console.log(`         → ${r.error}`);
}

console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  process.exit(1);
}
