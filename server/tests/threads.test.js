/**
 * DEVVERSE — Prompt 26: Threads & Replies API Integration Tests
 *
 * Tests:
 *   1. Public reads:
 *      - GET /threads returns [] for fresh community
 *      - GET /threads/:id returns 404 for unknown thread
 *   2. Authorization:
 *      - POST /threads (unauth) → 401
 *      - POST /threads/:id/replies (unauth) → 401
 *   3. Validation:
 *      - POST /threads missing title → 422 VALIDATION_ERROR with field details
 *      - POST /threads title too short (< 5 chars) → 422
 *      - POST /threads body too short (< 10 chars) → 422
 *      - POST /threads/:id/replies empty body → 422
 *      - POST /threads/:id/replies body > 2000 chars → 422
 *   4. Thread creation:
 *      - POST /threads with valid payload → 201 with populated author (safe projection)
 *      - Author response must NOT contain email or passwordHash
 *   5. Thread reads:
 *      - GET /threads returns created thread
 *      - GET /threads/:id returns thread detail
 *   6. Reply creation and count sync:
 *      - POST /:id/replies valid → 201, author safe projection
 *      - Thread.repliesCount increments to 1
 *      - GET /:id/replies returns reply list
 *      - Second reply increments count to 2
 *   7. Error cases:
 *      - Reply on unknown thread → 404
 *      - Reply on thread from wrong community → 400 THREAD_COMMUNITY_MISMATCH
 *   8. XSS payload stored as literal text:
 *      - POST thread with '<script>alert(1)</script>' in body → 201, stored verbatim
 *
 * Run: node server/tests/threads.test.js
 */

import http from 'http';
import app from '../app.js';
import { Community, CommunityMembership, Thread, Reply, User } from '../models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { seedCommunities } from '../config/seedCommunities.js';
import { COOKIE_NAME } from '../utils/session.js';

let passed = 0;
let failed = 0;
const results = [];

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
    results.push({ status: 'PASS', name });
  } catch (err) {
    failed++;
    console.log(`  ✗ [FAIL] ${name}\n    Error: ${err.message}`);
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
console.log('  PROMPT 26 — Threads & Replies API Integration Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup ──────────────────────────────────────────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_threads';
await connectDatabase(TEST_DB_URI);

// Sync indexes
await Thread.syncIndexes();
await Reply.syncIndexes();
await Community.syncIndexes();

// Clean state
await Thread.deleteMany({});
await Reply.deleteMany({});
await CommunityMembership.deleteMany({});
await User.deleteMany({ username: { $in: ['thread_user_one', 'thread_user_two'] } });

// Seed communities
await seedCommunities();

// Start ephemeral HTTP server
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

async function api(method, path, body, headers = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  const opts = { method, headers: reqHeaders };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, headers: res.headers, body: json };
}

function getCookieValue(headers, cookieName) {
  const raw = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie().join('; ')
    : headers.get('set-cookie') || '';
  const match = raw.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

let userCookie = null;
let userTwoCookie = null;
let testThreadId = null;

// Community c1 slug used for all main tests
const COMM = 'c1';
// Community c2 slug used for mismatch test
const COMM2 = 'c2';
const BASE_THREADS = `/api/communities/${COMM}/threads`;
const BASE_THREADS_C2 = `/api/communities/${COMM2}/threads`;

try {
  // ── 0. Setup: register test users ────────────────────────────────────────────
  await testAsync('Setup: register thread_user_one', async () => {
    const reg = await api('POST', '/api/auth/signup', {
      username: 'thread_user_one',
      email: 'thread_user_one@example.com',
      password: 'Password123!',
      displayName: 'Thread User One',
    });
    assertEqual(reg.status, 201, 'Signup must succeed');
    userCookie = getCookieValue(reg.headers, COOKIE_NAME);
    assert(userCookie, 'Must receive session cookie');
  });

  await testAsync('Setup: register thread_user_two', async () => {
    const reg = await api('POST', '/api/auth/signup', {
      username: 'thread_user_two',
      email: 'thread_user_two@example.com',
      password: 'Password123!',
      displayName: 'Thread User Two',
    });
    assertEqual(reg.status, 201, 'Signup must succeed');
    userTwoCookie = getCookieValue(reg.headers, COOKIE_NAME);
    assert(userTwoCookie, 'Must receive session cookie for user two');
  });

  // ── 1. Public reads on empty community ──────────────────────────────────────
  await testAsync('GET /threads returns empty array for fresh community', async () => {
    const res = await api('GET', BASE_THREADS);
    assertEqual(res.status, 200);
    assert(Array.isArray(res.body?.data), 'data must be an array');
    assertEqual(res.body.data.length, 0, 'Must be empty initially');
  });

  await testAsync('GET /threads/:threadId with unknown ID returns 404', async () => {
    const res = await api('GET', `${BASE_THREADS}/6adc000000000000000000ff`);
    assertEqual(res.status, 404);
    assertEqual(res.body?.code, 'NOT_FOUND');
  });

  // ── 2. Authorization enforcement ────────────────────────────────────────────
  await testAsync('POST /threads (unauthenticated) → 401 UNAUTHORIZED', async () => {
    const res = await api('POST', BASE_THREADS, { title: 'Test', body: 'Test body here' });
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  await testAsync('POST /threads/:id/replies (unauthenticated) → 401 UNAUTHORIZED', async () => {
    const res = await api('POST', `${BASE_THREADS}/6adc000000000000000000ff/replies`, { body: 'Reply' });
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  // ── 3. Validation errors ─────────────────────────────────────────────────────
  await testAsync('POST /threads missing title → 422 VALIDATION_ERROR with field details', async () => {
    const res = await api('POST', BASE_THREADS, { body: 'This is a valid body text' }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 422);
    assertEqual(res.body?.code, 'VALIDATION_ERROR');
    const details = res.body?.details || [];
    assert(details.some((d) => d.field === 'title'), 'Error details must include title field');
  });

  await testAsync('POST /threads title too short (< 5 chars) → 422', async () => {
    const res = await api('POST', BASE_THREADS, { title: 'Hi', body: 'Valid body here min ten chars' }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 422);
    assertEqual(res.body?.code, 'VALIDATION_ERROR');
    const details = res.body?.details || [];
    assert(details.some((d) => d.field === 'title'), 'Error must be on title field');
  });

  await testAsync('POST /threads body too short (< 10 chars) → 422', async () => {
    const res = await api('POST', BASE_THREADS, { title: 'Valid Title', body: 'Short' }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 422);
    assertEqual(res.body?.code, 'VALIDATION_ERROR');
    const details = res.body?.details || [];
    assert(details.some((d) => d.field === 'body'), 'Error must be on body field');
  });

  await testAsync('POST /threads/:id/replies with empty body → 422', async () => {
    // Create a temporary thread ID (we use a placeholder — will get proper 401/422 before DB hit)
    const res = await api('POST', `${BASE_THREADS}/6adc000000000000000000aa/replies`, { body: '' }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 422);
    assertEqual(res.body?.code, 'VALIDATION_ERROR');
  });

  await testAsync('POST /threads/:id/replies with body > 2000 chars → 422', async () => {
    const longBody = 'A'.repeat(2001);
    const res = await api('POST', `${BASE_THREADS}/6adc000000000000000000aa/replies`, { body: longBody }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 422);
    assertEqual(res.body?.code, 'VALIDATION_ERROR');
  });

  // ── 4. Thread creation with safe author projection ───────────────────────────
  await testAsync('POST /threads with valid payload → 201 with populated safe author', async () => {
    const res = await api('POST', BASE_THREADS, {
      title: 'Why Rust ownership model beats GC in production',
      body: 'We have been running Rust services for a year now. The memory safety guarantees are real and the tooling keeps improving.',
    }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 201, 'Thread creation must return 201');
    const thread = res.body?.data;
    assert(thread, 'data must be present');
    assert(thread._id, 'Thread must have _id');
    assertEqual(thread.title, 'Why Rust ownership model beats GC in production');
    assert(thread.author?.username === 'thread_user_one', 'author.username must be populated');
    assert(thread.author?.displayName === 'Thread User One', 'author.displayName must be populated');
    assert(!thread.author?.email, 'email must NOT be in author projection');
    assert(!thread.author?.passwordHash, 'passwordHash must NOT be in author projection');
    testThreadId = thread._id;
  });

  // ── 5. Thread reads ──────────────────────────────────────────────────────────
  await testAsync('GET /threads returns the created thread', async () => {
    const res = await api('GET', BASE_THREADS);
    assertEqual(res.status, 200);
    const threads = res.body?.data;
    assert(Array.isArray(threads), 'data must be array');
    assertEqual(threads.length, 1, 'Must return 1 thread');
    assertEqual(threads[0]._id, testThreadId, 'Thread ID must match');
    assert(!threads[0].author?.email, 'Author email must not appear in list');
  });

  await testAsync('GET /threads/:threadId returns thread detail with safe author', async () => {
    const res = await api('GET', `${BASE_THREADS}/${testThreadId}`);
    assertEqual(res.status, 200);
    const thread = res.body?.data;
    assert(thread, 'data must be present');
    assertEqual(thread._id, testThreadId);
    assert(thread.author?.username, 'author.username must be populated');
    assert(!thread.author?.email, 'email must not appear in thread detail');
  });

  // ── 6. Reply creation and count synchronization ──────────────────────────────
  await testAsync('POST /threads/:id/replies valid → 201 with safe author', async () => {
    const res = await api('POST', `${BASE_THREADS}/${testThreadId}/replies`, {
      body: 'Totally agree — the borrow checker caught so many subtle concurrency bugs before they hit production.',
    }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 201);
    const reply = res.body?.data;
    assert(reply, 'data must be present');
    assert(reply._id, 'Reply must have _id');
    assert(reply.author?.username === 'thread_user_one', 'author.username must be populated');
    assert(!reply.author?.email, 'email must NOT be in author projection');
    assert(!reply.author?.passwordHash, 'passwordHash must NOT be in author projection');
  });

  await testAsync('Thread.repliesCount increments to 1 after first reply', async () => {
    const threadDoc = await Thread.findById(testThreadId).lean();
    assertEqual(threadDoc.repliesCount, 1, 'repliesCount must be 1');
  });

  await testAsync('GET /threads/:id/replies returns reply list with safe author', async () => {
    const res = await api('GET', `${BASE_THREADS}/${testThreadId}/replies`);
    assertEqual(res.status, 200);
    const replies = res.body?.data;
    assert(Array.isArray(replies), 'data must be an array');
    assertEqual(replies.length, 1, 'Must return 1 reply');
    assert(replies[0].author?.username, 'author.username must be populated');
    assert(!replies[0].author?.email, 'email must not appear in replies list');
  });

  await testAsync('Second reply by user_two increments repliesCount to 2', async () => {
    const res = await api('POST', `${BASE_THREADS}/${testThreadId}/replies`, {
      body: 'Great point — we also switched one service and the memory profile is completely flat now.',
    }, {
      Cookie: `${COOKIE_NAME}=${userTwoCookie}`,
    });
    assertEqual(res.status, 201);
    const threadDoc = await Thread.findById(testThreadId).lean();
    assertEqual(threadDoc.repliesCount, 2, 'repliesCount must be 2 after second reply');
  });

  // ── 7. Error cases ───────────────────────────────────────────────────────────
  await testAsync('Reply on unknown thread → 404 NOT_FOUND', async () => {
    const res = await api('POST', `${BASE_THREADS}/6adc000000000000000000ff/replies`, {
      body: 'This reply should fail because thread does not exist.',
    }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 404);
    assertEqual(res.body?.code, 'NOT_FOUND');
  });

  await testAsync('Reply on thread from wrong community → 400 THREAD_COMMUNITY_MISMATCH', async () => {
    // testThreadId belongs to c1. Post to c2 with that threadId → mismatch
    const res = await api('POST', `${BASE_THREADS_C2}/${testThreadId}/replies`, {
      body: 'This should fail because the thread belongs to a different community.',
    }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 400);
    assertEqual(res.body?.code, 'THREAD_COMMUNITY_MISMATCH');
  });

  // ── 8. XSS payload stored as literal text ────────────────────────────────────
  await testAsync('XSS payload stored as literal text, not executed', async () => {
    const xssTitle = 'XSS Test: <script>alert(1)</script>';
    const xssBody = 'Body with injection: <img src=x onerror=alert(1)> and &lt;script&gt; tags.';
    const res = await api('POST', BASE_THREADS, { title: xssTitle, body: xssBody }, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 201, 'Thread with XSS payload must be stored');
    const thread = res.body?.data;
    // Verify the raw payload is stored verbatim (React renders as text, not HTML)
    assertEqual(thread.title, xssTitle, 'Title must be stored verbatim as-is');
    assertEqual(thread.body, xssBody, 'Body must be stored verbatim as-is');
    // Verify the thread is retrievable and content unchanged
    const getRes = await api('GET', `${BASE_THREADS}/${thread._id}`);
    assertEqual(getRes.status, 200);
    assertEqual(getRes.body?.data?.title, xssTitle, 'Stored title must match verbatim on retrieval');
  });

} finally {
  server.close();
  await disconnectDatabase();
}

console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`  ✗ ${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  console.log('✓ All threads & replies integration tests passed!\n');
}
