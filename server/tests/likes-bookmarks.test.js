/**
 * DEVVERSE — Prompt 24: Likes & Bookmarks API Integration Tests
 *
 * Tests:
 *   1. Authorization enforcement:
 *      - Unauthenticated like/unlike/bookmark/unbookmark/user-interactions rejected with 401.
 *   2. Idempotent Likes:
 *      - Add like -> 200 OK, liked: true, likesCount: 1.
 *      - Repeat like (duplicate) -> 200 OK, liked: true, likesCount: 1 (no duplicate document).
 *      - Direct duplicate document insertion in Like collection rejected by unique index (E11000).
 *      - Remove like -> 200 OK, liked: false, likesCount: 0.
 *      - Repeat unlike (idempotent remove) -> 200 OK, liked: false, likesCount: 0.
 *   3. Idempotent Bookmarks:
 *      - Add bookmark -> 200 OK, bookmarked: true.
 *      - Repeat bookmark -> 200 OK, bookmarked: true.
 *      - Direct duplicate document insertion in Bookmark collection rejected by unique index (E11000).
 *      - Remove bookmark -> 200 OK, bookmarked: false.
 *      - Repeat unbookmark -> 200 OK, bookmarked: false.
 *   4. Multi-user count accuracy:
 *      - Two users liking the same project increments likesCount to 2.
 *      - One user unliking decrements likesCount to 1 (strictly reflecting stored records).
 *   5. Interaction state querying:
 *      - GET /api/projects/user-interactions returns user's active liked and bookmarked project IDs.
 *      - GET /api/projects/:id attaches accurate liked and bookmarked flags when authenticated.
 *   6. Validation & error paths:
 *      - Invalid project ID format returns 400 INVALID_ID.
 *      - Unknown project ID returns 404 NOT_FOUND.
 *
 * Run: node server/tests/likes-bookmarks.test.js
 */

import http from 'http';
import app from '../app.js';
import { User, Project, Like, Bookmark } from '../models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { COOKIE_NAME } from '../utils/session.js';

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
    results.push({ status: 'PASS', name });
  } catch (err) {
    failed++;
    console.log(`  ✗ [FAIL] ${name}\n    Error: ${err.message}`);
    results.push({ status: 'FAIL', name, error: err.message });
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
    results.push({ status: 'PASS', name });
  } catch (err) {
    failed++;
    console.log(`  ✗ [FAIL] ${name}\n    Error: ${err.message}\n    Stack: ${err.stack}`);
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
console.log('  PROMPT 24 — Likes & Bookmarks API Integration Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup database connection & test server ──────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_interactions';
await connectDatabase(TEST_DB_URI);

// Ensure all schema unique indexes are synced to the test database
await Like.syncIndexes();
await Bookmark.syncIndexes();

// Clean relevant collections
await Like.deleteMany({});
await Bookmark.deleteMany({});
await Project.deleteMany({});
await User.deleteMany({ username: { $in: ['interactor_one', 'interactor_two'] } });

// Start HTTP server on ephemeral port
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
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return {
    status: res.status,
    headers: res.headers,
    body: json,
  };
}

function getCookieValue(headers, cookieName) {
  const raw = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie().join('; ')
    : headers.get('set-cookie') || '';
  const match = raw.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

let userOneCookie = null;
let userTwoCookie = null;
let testProjectId = null;
let userOneId = null;
let userTwoId = null;

try {
  // ── 0. Setup: register two test users and create a test project ──────────────
  await testAsync('Setup: register test users and sample project', async () => {
    // User One
    const reg1 = await api('POST', '/api/auth/signup', {
      username: 'interactor_one',
      email: 'interactor_one@example.com',
      password: 'Password123!',
      displayName: 'Interactor One',
    });
    assertEqual(reg1.status, 201, 'User 1 signup must succeed');
    userOneCookie = getCookieValue(reg1.headers, COOKIE_NAME);
    assert(userOneCookie, 'Must receive cookie for User 1');
    userOneId = reg1.body?.data?.user?._id || reg1.body?.data?.user?.id;
    assert(userOneId, 'userOneId must be present');

    // User Two
    const reg2 = await api('POST', '/api/auth/signup', {
      username: 'interactor_two',
      email: 'interactor_two@example.com',
      password: 'Password123!',
      displayName: 'Interactor Two',
    });
    assertEqual(reg2.status, 201, 'User 2 signup must succeed');
    userTwoCookie = getCookieValue(reg2.headers, COOKIE_NAME);
    assert(userTwoCookie, 'Must receive cookie for User 2');
    userTwoId = reg2.body?.data?.user?._id || reg2.body?.data?.user?.id;
    assert(userTwoId, 'userTwoId must be present');

    // Create a project under User 1
    const projRes = await api(
      'POST',
      '/api/projects',
      {
        title: 'Interaction Test Suite Project',
        description: 'A comprehensive project used to test likes and bookmarks idempotency.',
        category: 'Backend',
        difficulty: 'Intermediate',
        technologies: ['Node.js', 'MongoDB', 'Express'],
      },
      { Cookie: `${COOKIE_NAME}=${userOneCookie}` }
    );
    assertEqual(projRes.status, 201, 'Project creation must succeed');
    testProjectId = projRes.body?.data?.id || projRes.body?.data?._id;
    assert(testProjectId, 'Must receive created project ID');
  });

  // ── 1. Authorization checks ────────────────────────────────────────────────
  await testAsync('POST /api/projects/:id/like rejects unauthenticated request with 401', async () => {
    const res = await api('POST', `/api/projects/${testProjectId}/like`);
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  await testAsync('DELETE /api/projects/:id/like rejects unauthenticated request with 401', async () => {
    const res = await api('DELETE', `/api/projects/${testProjectId}/like`);
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  await testAsync('POST /api/projects/:id/bookmark rejects unauthenticated request with 401', async () => {
    const res = await api('POST', `/api/projects/${testProjectId}/bookmark`);
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  await testAsync('DELETE /api/projects/:id/bookmark rejects unauthenticated request with 401', async () => {
    const res = await api('DELETE', `/api/projects/${testProjectId}/bookmark`);
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  await testAsync('GET /api/projects/user-interactions rejects unauthenticated request with 401', async () => {
    const res = await api('GET', '/api/projects/user-interactions');
    assertEqual(res.status, 401);
    assertEqual(res.body?.code, 'UNAUTHORIZED');
  });

  // ── 2. Idempotent Likes and Database Uniqueness ─────────────────────────────
  await testAsync('POST /api/projects/:id/like adds like and recalculates likesCount', async () => {
    const res = await api('POST', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.liked === true, 'liked must be true');
    assertEqual(res.body?.data?.likesCount, 1, 'likesCount must be 1');

    const countInDb = await Like.countDocuments({ project: testProjectId });
    assertEqual(countInDb, 1, 'Exactly 1 like record in DB');

    const projectDoc = await Project.findById(testProjectId);
    assertEqual(projectDoc.likesCount, 1, 'Project document likesCount synchronized');
  });

  await testAsync('POST /api/projects/:id/like is idempotent: repeating like does not duplicate', async () => {
    const res = await api('POST', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.liked === true, 'liked must remain true');
    assertEqual(res.body?.data?.likesCount, 1, 'likesCount must still be 1');

    const countInDb = await Like.countDocuments({ project: testProjectId });
    assertEqual(countInDb, 1, 'Still exactly 1 like record in DB — no duplicate created');
  });

  await testAsync('Like collection compound unique index rejects duplicate (user, project) inserts', async () => {
    let duplicateRejected = false;
    try {
      await Like.create({ user: userOneId, project: testProjectId });
    } catch (err) {
      if (err.code === 11000) {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, 'MongoDB unique compound index must reject duplicate with E11000');
  });

  await testAsync('DELETE /api/projects/:id/like removes like and updates likesCount', async () => {
    const res = await api('DELETE', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.liked === false, 'liked must be false');
    assertEqual(res.body?.data?.likesCount, 0, 'likesCount must be 0');

    const countInDb = await Like.countDocuments({ project: testProjectId });
    assertEqual(countInDb, 0, 'Zero like records in DB');

    const projectDoc = await Project.findById(testProjectId);
    assertEqual(projectDoc.likesCount, 0, 'Project document likesCount synchronized to 0');
  });

  await testAsync('DELETE /api/projects/:id/like is idempotent: removing unliked project succeeds safely', async () => {
    const res = await api('DELETE', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.liked === false, 'liked must remain false');
    assertEqual(res.body?.data?.likesCount, 0, 'likesCount must remain 0');
  });

  // ── 3. Idempotent Bookmarks and Database Uniqueness ─────────────────────────
  await testAsync('POST /api/projects/:id/bookmark adds bookmark', async () => {
    const res = await api('POST', `/api/projects/${testProjectId}/bookmark`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.bookmarked === true, 'bookmarked must be true');

    const countInDb = await Bookmark.countDocuments({ project: testProjectId, user: userOneId });
    assertEqual(countInDb, 1, 'Exactly 1 bookmark record in DB');
  });

  await testAsync('POST /api/projects/:id/bookmark is idempotent: repeating bookmark does not duplicate', async () => {
    const res = await api('POST', `/api/projects/${testProjectId}/bookmark`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.bookmarked === true, 'bookmarked must remain true');

    const countInDb = await Bookmark.countDocuments({ project: testProjectId, user: userOneId });
    assertEqual(countInDb, 1, 'Still exactly 1 bookmark record in DB — no duplicate');
  });

  await testAsync('Bookmark collection compound unique index rejects duplicate (user, project) inserts', async () => {
    let duplicateRejected = false;
    try {
      await Bookmark.create({ user: userOneId, project: testProjectId });
    } catch (err) {
      if (err.code === 11000) {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, 'MongoDB unique compound index must reject duplicate with E11000');
  });

  await testAsync('DELETE /api/projects/:id/bookmark removes bookmark', async () => {
    const res = await api('DELETE', `/api/projects/${testProjectId}/bookmark`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.bookmarked === false, 'bookmarked must be false');

    const countInDb = await Bookmark.countDocuments({ project: testProjectId, user: userOneId });
    assertEqual(countInDb, 0, 'Zero bookmark records in DB');
  });

  await testAsync('DELETE /api/projects/:id/bookmark is idempotent: removing unbookmarked project succeeds', async () => {
    const res = await api('DELETE', `/api/projects/${testProjectId}/bookmark`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 200);
    assert(res.body?.data?.bookmarked === false, 'bookmarked must remain false');
  });

  // ── 4. Multi-user real record count accuracy ────────────────────────────────
  await testAsync('Two distinct users liking the same project increments likesCount to 2', async () => {
    // User 1 likes
    await api('POST', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    // User 2 likes
    const res2 = await api('POST', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userTwoCookie}`,
    });
    assertEqual(res2.status, 200);
    assertEqual(res2.body?.data?.likesCount, 2, 'likesCount must be 2');

    const countInDb = await Like.countDocuments({ project: testProjectId });
    assertEqual(countInDb, 2, 'Real records in DB must be 2');

    // User 1 unlikes
    const unres1 = await api('DELETE', `/api/projects/${testProjectId}/like`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(unres1.status, 200);
    assertEqual(unres1.body?.data?.likesCount, 1, 'likesCount must decrement to 1');
  });

  // ── 5. User interactions and project details querying ───────────────────────
  await testAsync('GET /api/projects/user-interactions returns user active likes and bookmarks', async () => {
    // User 2 currently likes the project. Let User 2 also bookmark it.
    await api('POST', `/api/projects/${testProjectId}/bookmark`, undefined, {
      Cookie: `${COOKIE_NAME}=${userTwoCookie}`,
    });

    const res = await api('GET', '/api/projects/user-interactions', undefined, {
      Cookie: `${COOKIE_NAME}=${userTwoCookie}`,
    });
    assertEqual(res.status, 200);
    const { likedProjectIds, bookmarkedProjectIds } = res.body?.data || {};
    assert(Array.isArray(likedProjectIds), 'likedProjectIds must be an array');
    assert(Array.isArray(bookmarkedProjectIds), 'bookmarkedProjectIds must be an array');
    assert(likedProjectIds.includes(testProjectId), 'likedProjectIds must include testProjectId');
    assert(bookmarkedProjectIds.includes(testProjectId), 'bookmarkedProjectIds must include testProjectId');
  });

  await testAsync('GET /api/projects/:id attaches accurate liked/bookmarked flags for session', async () => {
    // User 2 request -> liked: true, bookmarked: true
    const res2 = await api('GET', `/api/projects/${testProjectId}`, undefined, {
      Cookie: `${COOKIE_NAME}=${userTwoCookie}`,
    });
    assertEqual(res2.status, 200);
    assertEqual(res2.body?.data?.liked, true, 'User 2 liked must be true');
    assertEqual(res2.body?.data?.bookmarked, true, 'User 2 bookmarked must be true');

    // User 1 request -> liked: false, bookmarked: false
    const res1 = await api('GET', `/api/projects/${testProjectId}`, undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res1.status, 200);
    assertEqual(res1.body?.data?.liked, false, 'User 1 liked must be false');
    assertEqual(res1.body?.data?.bookmarked, false, 'User 1 bookmarked must be false');
  });

  // ── 6. Error and invalid ID handling ────────────────────────────────────────
  await testAsync('POST /api/projects/:id/like returns 400 on invalid ObjectId format', async () => {
    const res = await api('POST', '/api/projects/invalid-id-format/like', undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 400);
    assertEqual(res.body?.code, 'INVALID_ID');
  });

  await testAsync('POST /api/projects/:id/like returns 404 on non-existent project', async () => {
    const res = await api('POST', '/api/projects/6ada1233fd6a802185c2777c/like', undefined, {
      Cookie: `${COOKIE_NAME}=${userOneCookie}`,
    });
    assertEqual(res.status, 404);
    assertEqual(res.body?.code, 'NOT_FOUND');
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
  console.log('✓ All likes and bookmarks integration tests passed!\n');
}
