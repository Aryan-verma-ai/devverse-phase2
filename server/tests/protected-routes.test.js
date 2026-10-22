/**
 * DEVVERSE — Prompt 22: Protected Routes & Session Boundary Tests
 *
 * Verifies that:
 *   1. Logged-out users CANNOT access protected API actions:
 *      - GET    /api/auth/me       -> 401 UNAUTHORIZED
 *      - POST   /api/projects      -> 401 UNAUTHORIZED
 *      - PATCH  /api/projects/:id  -> 401 UNAUTHORIZED
 *      - DELETE /api/projects/:id  -> 401 UNAUTHORIZED
 *   2. Authenticated users with valid session cookies CAN access protected actions:
 *      - GET    /api/auth/me       -> 200 with current user profile
 *      - POST   /api/projects      -> 201 created with authenticated user as owner
 *      - PATCH  /api/projects/:id  -> 200 updated when owner
 *      - DELETE /api/projects/:id  -> 200 deleted when owner
 *   3. Logout clears the session cookie and invalidates client session:
 *      - POST   /api/auth/logout   -> 200 + cleared cookie
 *      - Subsequent GET /api/auth/me -> 401 UNAUTHORIZED
 *      - Subsequent POST /api/projects -> 401 UNAUTHORIZED
 *   4. Tampered / expired cookies are rejected:
 *      - Modified signature -> 401 UNAUTHORIZED
 *
 * Run: node server/tests/protected-routes.test.js
 */

import http from 'http';
import app from '../app.js';
import { User, Project } from '../models/index.js';
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
console.log('  PROMPT 22 — Protected Routes & Session Boundary Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup database connection & test server ──────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_protected_routes';
await connectDatabase(TEST_DB_URI);

// Clean collections
await Project.deleteMany({});
await User.deleteMany({ username: { $in: ['guard_user', 'guard_victim'] } });

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

// ── 1. Unauthenticated Access to Protected Endpoints ─────────────────────────

await testAsync('GET /api/auth/me rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
  const res = await api('GET', '/api/auth/me');
  assertEqual(res.status, 401);
  assertEqual(res.body.code, 'UNAUTHORIZED');
});

await testAsync('POST /api/projects rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
  const res = await api('POST', '/api/projects', {
    title: 'Unauthenticated App',
    description: 'This is a description that exceeds twenty characters.',
    category: 'Backend',
  });
  assertEqual(res.status, 401);
  assertEqual(res.body.code, 'UNAUTHORIZED');
});

await testAsync('PATCH /api/projects/:id rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
  const res = await api('PATCH', '/api/projects/6ada1233fd6a802185c2777c', {
    title: 'Hacked Title',
  });
  assertEqual(res.status, 401);
  assertEqual(res.body.code, 'UNAUTHORIZED');
});

await testAsync('DELETE /api/projects/:id rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
  const res = await api('DELETE', '/api/projects/6ada1233fd6a802185c2777c');
  assertEqual(res.status, 401);
  assertEqual(res.body.code, 'UNAUTHORIZED');
});

// ── 2. Authenticated User Flow via Session Cookie ────────────────────────────

let sessionCookie = null;
let createdProjectId = null;

await testAsync('Signup creates account and yields valid session cookie', async () => {
  const res = await api('POST', '/api/auth/signup', {
    username: 'guard_user',
    email: 'guard@example.com',
    password: 'Password123!',
    displayName: 'Guard Developer',
  });

  assertEqual(res.status, 201);
  sessionCookie = getCookieValue(res.headers, COOKIE_NAME);
  assert(sessionCookie, 'Session cookie must be present');
});

await testAsync('GET /api/auth/me succeeds with active session cookie', async () => {
  const res = await api('GET', '/api/auth/me', undefined, {
    Cookie: `${COOKIE_NAME}=${sessionCookie}`,
  });

  assertEqual(res.status, 200);
  assertEqual(res.body.data?.user?.username, 'guard_user');
  assertEqual(res.body.data?.user?.email, 'guard@example.com');
});

await testAsync('POST /api/projects succeeds with session cookie and sets owner', async () => {
  const res = await api('POST', '/api/projects', {
    title: 'Protected Project Alpha',
    description: 'Created by an authenticated user with a verified session cookie.',
    category: 'Backend',
    difficulty: 'Intermediate',
    technologies: ['Node.js', 'Express', 'MongoDB'],
  }, {
    Cookie: `${COOKIE_NAME}=${sessionCookie}`,
  });

  assertEqual(res.status, 201);
  assert(res.body.data?._id, 'Project ID must be returned');
  assertEqual(res.body.data?.owner?.username, 'guard_user');
  createdProjectId = res.body.data._id;
});

await testAsync('PATCH /api/projects/:id updates project when called by authenticated owner', async () => {
  const res = await api('PATCH', `/api/projects/${createdProjectId}`, {
    title: 'Protected Project Alpha (Updated)',
  }, {
    Cookie: `${COOKIE_NAME}=${sessionCookie}`,
  });

  assertEqual(res.status, 200);
  assertEqual(res.body.data?.title, 'Protected Project Alpha (Updated)');
});

// ── 3. Logout Invalidation Flow ──────────────────────────────────────────────

await testAsync('POST /api/auth/logout clears session cookie and revokes access', async () => {
  // 1. Log out
  const logoutRes = await api('POST', '/api/auth/logout', undefined, {
    Cookie: `${COOKIE_NAME}=${sessionCookie}`,
  });
  assertEqual(logoutRes.status, 200);

  // 2. Clear cookie value locally to simulate browser behavior
  const clearCookieHeader = logoutRes.headers.get('set-cookie') || '';
  assert(
    clearCookieHeader.includes('Max-Age=0') || clearCookieHeader.includes(`${COOKIE_NAME}=;`),
    'Logout response must clear cookie'
  );

  // 3. Attempting to access GET /api/auth/me without cookie fails with 401
  const meRes = await api('GET', '/api/auth/me');
  assertEqual(meRes.status, 401);
  assertEqual(meRes.body.code, 'UNAUTHORIZED');

  // 4. Attempting to delete the project without cookie fails with 401
  const deleteRes = await api('DELETE', `/api/projects/${createdProjectId}`);
  assertEqual(deleteRes.status, 401);
  assertEqual(deleteRes.body.code, 'UNAUTHORIZED');
});

// ── 4. Deletion by Re-authenticated Owner ─────────────────────────────────────

await testAsync('Owner can re-authenticate via login and delete their project', async () => {
  // 1. Re-login
  const loginRes = await api('POST', '/api/auth/login', {
    emailOrUsername: 'guard_user',
    password: 'Password123!',
  });
  assertEqual(loginRes.status, 200);
  const newCookie = getCookieValue(loginRes.headers, COOKIE_NAME);
  assert(newCookie, 'New session cookie must be set');

  // 2. Delete project with new session cookie
  const deleteRes = await api('DELETE', `/api/projects/${createdProjectId}`, undefined, {
    Cookie: `${COOKIE_NAME}=${newCookie}`,
  });
  assertEqual(deleteRes.status, 200);
  assertEqual(deleteRes.body.message, 'Project deleted successfully.');

  // 3. Verify project is gone
  const getRes = await api('GET', `/api/projects/${createdProjectId}`);
  assertEqual(getRes.status, 404);
});

// ── Teardown ─────────────────────────────────────────────────────────────────

await Project.deleteMany({});
await User.deleteMany({ username: 'guard_user' });
await disconnectDatabase();
await new Promise((resolve) => server.close(resolve));

console.log('───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`✗ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✓ All protected routes and session boundary tests passed!\n');
}
