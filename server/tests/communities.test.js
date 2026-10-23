/**
 * DEVVERSE — Prompt 25: Communities & Membership API Integration Tests
 *
 * Tests:
 *   1. Public read access:
 *      - GET /api/communities returns all 6 canonical guilds.
 *      - GET /api/communities/:slug returns a community by canonical slug (e.g. 'c1').
 *      - GET /api/communities/:id returns a community by MongoDB ObjectId.
 *      - GET /api/communities/unknown-slug returns 404.
 *   2. Authorization enforcement:
 *      - POST /api/communities/:id/join (unauthenticated) → 401 UNAUTHORIZED.
 *      - POST /api/communities/:id/leave (unauthenticated) → 401 UNAUTHORIZED.
 *      - GET  /api/communities/user-memberships (unauthenticated) → 401 UNAUTHORIZED.
 *   3. Authenticated join / idempotent duplicate:
 *      - Joining a community returns { joined: true, membersCount } and adds 1 DB record.
 *      - Joining the same community again is idempotent (no E11000, count unchanged).
 *      - CommunityMembership unique index rejects direct duplicate insert (E11000).
 *   4. Authenticated leave / idempotent remove:
 *      - Leaving a community returns { joined: false, membersCount } and removes DB record.
 *      - Leaving a community not joined is idempotent (count 0, no error).
 *   5. Real count synchronization:
 *      - membersCount on the community document reflects actual CommunityMembership records.
 *   6. user-memberships:
 *      - Returns { joinedCommunityIds, joinedCommunitySlugs } for the authenticated user.
 *
 * Run: node server/tests/communities.test.js
 */

import http from 'http';
import app from '../app.js';
import { Community, CommunityMembership, User } from '../models/index.js';
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
console.log('  PROMPT 25 — Communities & Membership Integration Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup ──────────────────────────────────────────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_communities';
await connectDatabase(TEST_DB_URI);

// Ensure unique indexes are live before running duplicate tests
await CommunityMembership.syncIndexes();
await Community.syncIndexes();

// Clean state
await CommunityMembership.deleteMany({});
await User.deleteMany({ username: { $in: ['community_user_one', 'community_user_two'] } });
// Keep communities seeded — do not wipe Community collection between runs

// Seed the 6 canonical guilds (idempotent upsert)
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
let userId = null;
let communityOneSlug = 'c1'; // Rustaceans Guild
let communityOneId = null;

try {
  // ── 0. Setup: register a test user ──────────────────────────────────────────
  await testAsync('Setup: register community_user_one', async () => {
    const reg = await api('POST', '/api/auth/signup', {
      username: 'community_user_one',
      email: 'community_user_one@example.com',
      password: 'Password123!',
      displayName: 'Community User One',
    });
    assertEqual(reg.status, 201, 'community_user_one signup must succeed');
    userCookie = getCookieValue(reg.headers, COOKIE_NAME);
    assert(userCookie, 'Must receive session cookie');
    userId = reg.body?.data?.user?._id || reg.body?.data?.user?.id;
    assert(userId, 'userId must be present');
  });

  // ── 1. Public read access ────────────────────────────────────────────────────
  await testAsync('GET /api/communities returns all 6 canonical guilds', async () => {
    const res = await api('GET', '/api/communities');
    assertEqual(res.status, 200, 'status must be 200');
    const communities = res.body?.data;
    assert(Array.isArray(communities), 'data must be an array');
    assertEqual(communities.length, 6, 'must return exactly 6 communities');
    communityOneId = communities.find((c) => c.slug === communityOneSlug)?._id
      || communities.find((c) => c.slug === communityOneSlug)?.id;
    assert(communityOneId, 'c1 community must be present and have an id');
  });

  await testAsync('GET /api/communities/c1 returns Rustaceans Guild by canonical slug', async () => {
    const res = await api('GET', '/api/communities/c1');
    assertEqual(res.status, 200, 'status must be 200');
    const c = res.body?.data;
    assert(c, 'data must exist');
    assertEqual(c.slug, 'c1', 'slug must be c1');
    assert(typeof c.name === 'string' && c.name.length > 0, 'name must be non-empty');
    assert(typeof c.membersCount === 'number', 'membersCount must be numeric');
    assert(typeof c.isMember === 'boolean', 'isMember must be boolean');
  });

  await testAsync('GET /api/communities/:objectId returns community by MongoDB ObjectId', async () => {
    const res = await api('GET', `/api/communities/${communityOneId}`);
    assertEqual(res.status, 200, 'status must be 200');
    const c = res.body?.data;
    assert(c, 'data must exist');
    assertEqual(c.slug, 'c1', 'slug must be c1 when queried by objectId');
  });

  await testAsync('GET /api/communities/unknown-guild returns 404', async () => {
    const res = await api('GET', '/api/communities/unknown-guild-slug-xyz');
    assertEqual(res.status, 404, 'status must be 404');
    assertEqual(res.body?.code, 'NOT_FOUND', 'code must be NOT_FOUND');
  });

  // ── 2. Authorization enforcement ─────────────────────────────────────────────
  await testAsync('POST /api/communities/:id/join rejects unauthenticated → 401', async () => {
    const res = await api('POST', `/api/communities/${communityOneSlug}/join`);
    assertEqual(res.status, 401, 'must return 401');
    assertEqual(res.body?.code, 'UNAUTHORIZED', 'code must be UNAUTHORIZED');
  });

  await testAsync('POST /api/communities/:id/leave rejects unauthenticated → 401', async () => {
    const res = await api('DELETE', `/api/communities/${communityOneSlug}/leave`);
    assertEqual(res.status, 401, 'must return 401');
    assertEqual(res.body?.code, 'UNAUTHORIZED', 'code must be UNAUTHORIZED');
  });

  await testAsync('GET /api/communities/user-memberships rejects unauthenticated → 401', async () => {
    const res = await api('GET', '/api/communities/user-memberships');
    assertEqual(res.status, 401, 'must return 401');
    assertEqual(res.body?.code, 'UNAUTHORIZED', 'code must be UNAUTHORIZED');
  });

  // ── 3. Authenticated join ─────────────────────────────────────────────────────
  await testAsync('POST /api/communities/c1/join adds membership and returns joined + count', async () => {
    const res = await api('POST', '/api/communities/c1/join', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 200, 'status must be 200');
    assert(res.body?.data?.joined === true, 'joined must be true');
    assert(typeof res.body?.data?.membersCount === 'number', 'membersCount must be a number');
    assertEqual(res.body?.data?.membersCount, 1, 'membersCount must be 1 after first join');

    const dbCount = await CommunityMembership.countDocuments({ community: communityOneId });
    assertEqual(dbCount, 1, 'Exactly 1 CommunityMembership record in DB');
  });

  await testAsync('POST /api/communities/c1/join is idempotent: duplicate join does not change count', async () => {
    const res = await api('POST', '/api/communities/c1/join', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 200, 'status must be 200 (idempotent)');
    assert(res.body?.data?.joined === true, 'joined must still be true');
    assertEqual(res.body?.data?.membersCount, 1, 'membersCount must remain 1 — no duplicate');

    const dbCount = await CommunityMembership.countDocuments({ community: communityOneId });
    assertEqual(dbCount, 1, 'Still exactly 1 CommunityMembership record — no duplicate');
  });

  await testAsync('CommunityMembership unique index rejects direct duplicate (user, community) insert with E11000', async () => {
    let duplicateRejected = false;
    try {
      await CommunityMembership.create({ user: userId, community: communityOneId });
    } catch (err) {
      if (err.code === 11000) duplicateRejected = true;
    }
    assert(duplicateRejected, 'MongoDB E11000 must be thrown for duplicate (user, community) insert');
  });

  // ── 4. Authenticated leave ────────────────────────────────────────────────────
  await testAsync('DELETE /api/communities/c1/leave removes membership and returns joined: false', async () => {
    const res = await api('DELETE', '/api/communities/c1/leave', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 200, 'status must be 200');
    assert(res.body?.data?.joined === false, 'joined must be false');
    assertEqual(res.body?.data?.membersCount, 0, 'membersCount must be 0 after leaving');

    const dbCount = await CommunityMembership.countDocuments({ community: communityOneId });
    assertEqual(dbCount, 0, 'Zero CommunityMembership records in DB after leave');
  });

  await testAsync('DELETE /api/communities/c1/leave is idempotent: leaving a non-joined community returns 200', async () => {
    const res = await api('DELETE', '/api/communities/c1/leave', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 200, 'status must be 200 (idempotent leave)');
    assert(res.body?.data?.joined === false, 'joined must remain false');
    assertEqual(res.body?.data?.membersCount, 0, 'membersCount must remain 0');
  });

  // ── 5. Real count synchronization ────────────────────────────────────────────
  await testAsync('membersCount on community document reflects actual CommunityMembership records', async () => {
    // Re-join to set count to 1
    await api('POST', '/api/communities/c1/join', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });

    // Verify Community document in DB is synchronized
    const communityDoc = await Community.findById(communityOneId).lean();
    const realCount = await CommunityMembership.countDocuments({ community: communityOneId });
    assertEqual(communityDoc.membersCount, realCount, 'Community.membersCount must equal CommunityMembership count');
    assertEqual(realCount, 1, 'Real membership count must be 1');

    // Leave, verify back to 0
    await api('DELETE', '/api/communities/c1/leave', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    const communityDocAfter = await Community.findById(communityOneId).lean();
    assertEqual(communityDocAfter.membersCount, 0, 'membersCount must be 0 after leave');
  });

  // ── 6. user-memberships ───────────────────────────────────────────────────────
  await testAsync('GET /api/communities/user-memberships returns joined IDs and slugs for user', async () => {
    // Join c1 and c2
    await api('POST', '/api/communities/c1/join', undefined, { Cookie: `${COOKIE_NAME}=${userCookie}` });
    await api('POST', '/api/communities/c2/join', undefined, { Cookie: `${COOKIE_NAME}=${userCookie}` });

    const res = await api('GET', '/api/communities/user-memberships', undefined, {
      Cookie: `${COOKIE_NAME}=${userCookie}`,
    });
    assertEqual(res.status, 200, 'status must be 200');
    const { joinedCommunityIds, joinedCommunitySlugs } = res.body?.data || {};
    assert(Array.isArray(joinedCommunityIds), 'joinedCommunityIds must be an array');
    assert(Array.isArray(joinedCommunitySlugs), 'joinedCommunitySlugs must be an array');
    assertEqual(joinedCommunitySlugs.length, 2, 'Must have 2 joined slugs');
    assert(joinedCommunitySlugs.includes('c1'), 'joinedCommunitySlugs must include c1');
    assert(joinedCommunitySlugs.includes('c2'), 'joinedCommunitySlugs must include c2');
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
  console.log('✓ All communities integration tests passed!\n');
}
