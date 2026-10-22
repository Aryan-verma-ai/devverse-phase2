/**
 * DEVVERSE — Prompt 23: User Profile & Portfolio API Integration Tests
 *
 * Tests:
 *   1. Public profile retrieval (GET /api/users/:username):
 *      - Returns public profile and user-authored projects.
 *      - Strictly excludes private fields: email and passwordHash.
 *      - Returns 404 NOT_FOUND for unknown user.
 *   2. Authenticated profile update (PATCH /api/users/me):
 *      - Successfully updates allowlisted fields (displayName, bio, skills, links).
 *      - Updates persist in MongoDB.
 *      - Rejects unauthorized / unauthenticated access with 401 UNAUTHORIZED.
 *      - Rejects forbidden field alteration attempts (email, role, points, passwordHash) with 422 VALIDATION_ERROR.
 *   3. Cross-user protection (PATCH /api/users/:id):
 *      - User CANNOT edit another user's profile (403 FORBIDDEN).
 *      - User CAN edit their own profile by ID (200 OK).
 *
 * Run: node server/tests/users.test.js
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
console.log('  PROMPT 23 — User Profile & Portfolio API Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup database connection & test server ──────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_users';
await connectDatabase(TEST_DB_URI);

// Clean collections
await Project.deleteMany({});
await User.deleteMany({ username: { $in: ['dev_alpha', 'dev_beta'] } });

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

let alphaCookie = null;
let betaCookie = null;
let alphaUserId = null;
let betaUserId = null;

// ── 1. Create Test Users & Projects ──────────────────────────────────────────

await testAsync('Setup: registers dev_alpha and dev_beta', async () => {
  const alphaRes = await api('POST', '/api/auth/signup', {
    username: 'dev_alpha',
    email: 'alpha.private@example.com',
    password: 'Password123!',
    displayName: 'Alpha Developer',
    bio: 'Systems builder and Rust enthusiast.',
  });
  assertEqual(alphaRes.status, 201);
  alphaCookie = getCookieValue(alphaRes.headers, COOKIE_NAME);
  alphaUserId = alphaRes.body.data.user._id;

  const betaRes = await api('POST', '/api/auth/signup', {
    username: 'dev_beta',
    email: 'beta.private@example.com',
    password: 'Password123!',
    displayName: 'Beta Developer',
    bio: 'Frontend designer and React hacker.',
  });
  assertEqual(betaRes.status, 201);
  betaCookie = getCookieValue(betaRes.headers, COOKIE_NAME);
  betaUserId = betaRes.body.data.user._id;

  // Create a project owned by dev_alpha
  const projRes = await api('POST', '/api/projects', {
    title: 'Alpha Core Engine',
    description: 'High-performance distributed execution engine built in Rust.',
    category: 'Systems',
    difficulty: 'Advanced',
    technologies: ['Rust', 'Tokio', 'Wasm'],
  }, {
    Cookie: `${COOKIE_NAME}=${alphaCookie}`,
  });
  assertEqual(projRes.status, 201);
});

// ── 2. Public Profile Retrieval (GET /api/users/:username) ────────────────────

await testAsync('GET /api/users/:username returns public profile with authored projects', async () => {
  const res = await api('GET', '/api/users/dev_alpha');
  assertEqual(res.status, 200);
  assertEqual(res.body.status, 'ok');
  assert(res.body.data?.user, 'User object must be present');
  assertEqual(res.body.data.user.username, 'dev_alpha');
  assertEqual(res.body.data.user.displayName, 'Alpha Developer');
  assertEqual(res.body.data.user.bio, 'Systems builder and Rust enthusiast.');

  // Projects array
  assert(Array.isArray(res.body.data.projects), 'Projects must be an array');
  assertEqual(res.body.data.projects.length, 1);
  assertEqual(res.body.data.projects[0].title, 'Alpha Core Engine');
});

await testAsync('GET /api/users/:username strictly excludes private email and passwordHash', async () => {
  const res = await api('GET', '/api/users/dev_alpha');
  assertEqual(res.status, 200);
  assertEqual(res.body.data?.user?.email, undefined, 'email must NEVER be returned in public profile');
  assertEqual(res.body.data?.user?.passwordHash, undefined, 'passwordHash must NEVER be returned');
});

await testAsync('GET /api/users/:username returns 404 for unknown user', async () => {
  const res = await api('GET', '/api/users/non_existent_user_999');
  assertEqual(res.status, 404);
  assertEqual(res.body.code, 'NOT_FOUND');
});

// ── 3. Authenticated Profile Update (PATCH /api/users/me) ─────────────────────

await testAsync('PATCH /api/users/me rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
  const res = await api('PATCH', '/api/users/me', {
    displayName: 'Hacked Name',
  });
  assertEqual(res.status, 401);
  assertEqual(res.body.code, 'UNAUTHORIZED');
});

await testAsync('PATCH /api/users/me updates allowlisted fields and persists to MongoDB', async () => {
  const updates = {
    displayName: 'Alpha Prime',
    bio: 'Updated bio: Senior distributed systems architect.',
    skills: ['Rust', 'Distributed Systems', 'Raft'],
    links: {
      github: 'https://github.com/dev-alpha',
      website: 'https://alpha.dev',
    },
  };

  const res = await api('PATCH', '/api/users/me', updates, {
    Cookie: `${COOKIE_NAME}=${alphaCookie}`,
  });

  assertEqual(res.status, 200);
  assertEqual(res.body.status, 'ok');
  assertEqual(res.body.data?.user?.displayName, 'Alpha Prime');
  assertEqual(res.body.data?.user?.bio, 'Updated bio: Senior distributed systems architect.');
  assertEqual(res.body.data?.user?.skills?.length, 3);
  assertEqual(res.body.data?.user?.links?.github, 'https://github.com/dev-alpha');

  // Verify persistence in MongoDB
  const dbUser = await User.findById(alphaUserId);
  assertEqual(dbUser.displayName, 'Alpha Prime');
  assertEqual(dbUser.bio, 'Updated bio: Senior distributed systems architect.');
  assertEqual(dbUser.skills.length, 3);
});

await testAsync('PATCH /api/users/me rejects attempts to modify forbidden fields with 422 VALIDATION_ERROR', async () => {
  const maliciousPayload = {
    role: 'admin',
    points: 99999,
    email: 'newemail@example.com',
    passwordHash: '$2b$10$forgedhash1234567890',
  };

  const res = await api('PATCH', '/api/users/me', maliciousPayload, {
    Cookie: `${COOKIE_NAME}=${alphaCookie}`,
  });

  assertEqual(res.status, 422);
  assertEqual(res.body.code, 'VALIDATION_ERROR');
  assert(Array.isArray(res.body.details), 'Details should be returned');
  assert(res.body.details.some((d) => d.field === 'role'), 'Must reject role modification');
  assert(res.body.details.some((d) => d.field === 'email'), 'Must reject email modification');
});

// ── 4. Cross-User Edit Protection (PATCH /api/users/:id) ──────────────────────

await testAsync('PATCH /api/users/:id rejects editing another user profile with 403 FORBIDDEN', async () => {
  // dev_alpha attempts to edit dev_beta's profile
  const res = await api('PATCH', `/api/users/${betaUserId}`, {
    displayName: 'Vandalized Name',
  }, {
    Cookie: `${COOKIE_NAME}=${alphaCookie}`,
  });

  assertEqual(res.status, 403);
  assertEqual(res.body.code, 'FORBIDDEN');
  assert(res.body.message.includes('only edit your own profile'), 'Must return ownership error message');

  // Verify dev_beta was NOT modified in MongoDB
  const unchangedBeta = await User.findById(betaUserId);
  assertEqual(unchangedBeta.displayName, 'Beta Developer');
});

await testAsync('PATCH /api/users/:id allows user to update their own profile by matching ID', async () => {
  // dev_beta updates their own profile using their ID
  const res = await api('PATCH', `/api/users/${betaUserId}`, {
    displayName: 'Beta Designer (Pro)',
    skills: ['Figma', 'React', 'CSS'],
  }, {
    Cookie: `${COOKIE_NAME}=${betaCookie}`,
  });

  assertEqual(res.status, 200);
  assertEqual(res.body.data?.user?.displayName, 'Beta Designer (Pro)');
  assertEqual(res.body.data?.user?.skills?.length, 3);
});

// ── Teardown ─────────────────────────────────────────────────────────────────

await Project.deleteMany({});
await User.deleteMany({ username: { $in: ['dev_alpha', 'dev_beta'] } });
await disconnectDatabase();
await new Promise((resolve) => server.close(resolve));

console.log('───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`✗ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✓ All user profile and portfolio API tests passed!\n');
}
