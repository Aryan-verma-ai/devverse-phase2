/**
 * DEVVERSE — Prompt 19: Project CRUD API Integration Tests
 *
 * Runs full HTTP integration tests against Express app and MongoDB:
 *   - List / search / filter / bounded pagination
 *   - Detail by ID, 404 on unknown, 400 on malformed ID
 *   - Create with validation & devAuthGuard
 *   - Update with validation & server-enforced ownership checks
 *   - Delete with ownership checks and removal verification
 *   - Production write protection guard
 *
 * Run: node server/tests/projects.test.js
 */

import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { User, Project } from '../models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

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
console.log('  PROMPT 19 — Project CRUD API Integration Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup database connection & test server ──────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_projects';
await connectDatabase(TEST_DB_URI);

// Clean test collections
await Project.deleteMany({});
await User.deleteMany({ username: { $in: ['test_owner', 'other_user', 'dev_author'] } });

// Create test owner and test stranger
const ownerUser = await User.create({
  username: 'test_owner',
  email: 'owner@devverse.test',
  passwordHash: '$2b$10$xyzPasswordHash1234567890',
  displayName: 'Test Project Owner',
});

const strangerUser = await User.create({
  username: 'other_user',
  email: 'stranger@devverse.test',
  passwordHash: '$2b$10$xyzPasswordHash1234567890',
  displayName: 'Other Developer',
});

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
  return { status: res.status, body: json };
}

let createdProjectId = null;

// ── 1. Create Project Flow (POST /api/projects) ──────────────────────────────

await testAsync('POST /api/projects creates project and returns 201 with populated owner', async () => {
  const payload = {
    title: 'Nebula UI Library',
    description: 'A component system for building developer tools and reactive dashboards.',
    category: 'Frontend',
    difficulty: 'Intermediate',
    technologies: ['React', 'CSS', 'Vite'],
    features: ['Dark mode tokens', 'Accessible dialogs'],
    githubUrl: 'https://github.com/test-owner/nebula',
    demoUrl: 'https://nebula.example.com',
  };

  const res = await api('POST', '/api/projects', payload, {
    'x-dev-user-id': ownerUser._id.toString(),
  });

  assertEqual(res.status, 201);
  assertEqual(res.body.status, 'ok');
  assert(res.body.data._id, 'Created project should have an _id');
  assertEqual(res.body.data.title, payload.title);
  assertEqual(res.body.data.category, 'Frontend');
  assertEqual(res.body.data.owner.username, 'test_owner');
  assertEqual(res.body.data.owner.displayName, 'Test Project Owner');
  assertEqual(res.body.data.owner.passwordHash, undefined, 'passwordHash must not leak');

  createdProjectId = res.body.data._id;
});

await testAsync('POST /api/projects rejects missing title with 422 VALIDATION_ERROR', async () => {
  const res = await api('POST', '/api/projects', {
    description: 'Valid description that has sufficient length of more than twenty characters.',
    category: 'Backend',
  });

  assertEqual(res.status, 422);
  assertEqual(res.body.code, 'VALIDATION_ERROR');
  assert(res.body.details.some((d) => d.field === 'title'), 'Must flag title error');
});

await testAsync('POST /api/projects rejects description < 20 chars with 422', async () => {
  const res = await api('POST', '/api/projects', {
    title: 'Short Description App',
    description: 'Too short',
    category: 'Backend',
  });

  assertEqual(res.status, 422);
  assertEqual(res.body.code, 'VALIDATION_ERROR');
  assert(res.body.details.some((d) => d.field === 'description'), 'Must flag description error');
});

await testAsync('POST /api/projects rejects invalid category enum with 422', async () => {
  const res = await api('POST', '/api/projects', {
    title: 'Valid Project Title',
    description: 'Valid description that has sufficient length of more than twenty characters.',
    category: 'InvalidCategoryName',
  });

  assertEqual(res.status, 422);
  assertEqual(res.body.code, 'VALIDATION_ERROR');
  assert(res.body.details.some((d) => d.field === 'category'), 'Must flag category error');
});

await testAsync('POST /api/projects rejects invalid URL protocol with 422', async () => {
  const res = await api('POST', '/api/projects', {
    title: 'Unsafe URL Project',
    description: 'Valid description that has sufficient length of more than twenty characters.',
    category: 'Systems',
    githubUrl: 'ftp://ftp.example.com/repo',
  });

  assertEqual(res.status, 422);
  assertEqual(res.body.code, 'VALIDATION_ERROR');
  assert(res.body.details.some((d) => d.field === 'githubUrl'), 'Must flag githubUrl error');
});

// ── 2. List Projects Flow (GET /api/projects) ────────────────────────────────

await testAsync('GET /api/projects returns paginated projects list with metadata', async () => {
  const res = await api('GET', '/api/projects');

  assertEqual(res.status, 200);
  assertEqual(res.body.status, 'ok');
  assert(Array.isArray(res.body.data), 'data must be an array');
  assert(res.body.data.length >= 1, 'Should include created project');
  assert(res.body.pagination, 'Should have pagination metadata');
  assertEqual(res.body.pagination.page, 1);
  assert(res.body.pagination.total >= 1, 'Total count should be >= 1');
});

await testAsync('GET /api/projects filters by matching category', async () => {
  const matchRes = await api('GET', '/api/projects?category=Frontend');
  assertEqual(matchRes.status, 200);
  assert(matchRes.body.data.some((p) => p.title === 'Nebula UI Library'));

  const mismatchRes = await api('GET', '/api/projects?category=Web3');
  assertEqual(mismatchRes.status, 200);
  assert(!mismatchRes.body.data.some((p) => p.title === 'Nebula UI Library'));
});

await testAsync('GET /api/projects searches by text keyword', async () => {
  const res = await api('GET', '/api/projects?search=Nebula');
  assertEqual(res.status, 200);
  assert(res.body.data.some((p) => p.title === 'Nebula UI Library'));

  const noMatch = await api('GET', '/api/projects?search=NonExistentTermXYZ');
  assertEqual(noMatch.status, 200);
  assertEqual(noMatch.body.data.length, 0);
});

// ── 3. Project Detail Flow (GET /api/projects/:id) ───────────────────────────

await testAsync('GET /api/projects/:id returns single project with populated owner', async () => {
  const res = await api('GET', `/api/projects/${createdProjectId}`);

  assertEqual(res.status, 200);
  assertEqual(res.body.status, 'ok');
  assertEqual(res.body.data._id, createdProjectId);
  assertEqual(res.body.data.owner.username, 'test_owner');
});

await testAsync('GET /api/projects/:id returns 404 for unknown valid ObjectId', async () => {
  const unknownId = new mongoose.Types.ObjectId().toString();
  const res = await api('GET', `/api/projects/${unknownId}`);

  assertEqual(res.status, 404);
  assertEqual(res.body.code, 'NOT_FOUND');
});

await testAsync('GET /api/projects/:id returns 400 for malformed ID string', async () => {
  const res = await api('GET', '/api/projects/not-an-objectid-123');

  assertEqual(res.status, 400);
  assertEqual(res.body.code, 'INVALID_ID');
});

// ── 4. Update Project Flow (PATCH /api/projects/:id) ─────────────────────────

await testAsync('PATCH /api/projects/:id updates project when called by owner', async () => {
  const updates = {
    title: 'Nebula UI Library v2',
    difficulty: 'Advanced',
  };

  const res = await api('PATCH', `/api/projects/${createdProjectId}`, updates, {
    'x-dev-user-id': ownerUser._id.toString(),
  });

  assertEqual(res.status, 200);
  assertEqual(res.body.status, 'ok');
  assertEqual(res.body.data.title, 'Nebula UI Library v2');
  assertEqual(res.body.data.difficulty, 'Advanced');
});

await testAsync('PATCH /api/projects/:id rejects update when called by stranger (403 FORBIDDEN)', async () => {
  const updates = { title: 'Hijacked Title by Stranger' };

  const res = await api('PATCH', `/api/projects/${createdProjectId}`, updates, {
    'x-dev-user-id': strangerUser._id.toString(),
  });

  assertEqual(res.status, 403);
  assertEqual(res.body.code, 'FORBIDDEN');
});

await testAsync('PATCH /api/projects/:id rejects empty payload with 400 BAD_REQUEST', async () => {
  const res = await api('PATCH', `/api/projects/${createdProjectId}`, {}, {
    'x-dev-user-id': ownerUser._id.toString(),
  });

  assertEqual(res.status, 400);
  assertEqual(res.body.code, 'BAD_REQUEST');
});

// ── 5. Delete Project Flow (DELETE /api/projects/:id) ────────────────────────

await testAsync('DELETE /api/projects/:id rejects deletion by stranger (403 FORBIDDEN)', async () => {
  const res = await api('DELETE', `/api/projects/${createdProjectId}`, undefined, {
    'x-dev-user-id': strangerUser._id.toString(),
  });

  assertEqual(res.status, 403);
  assertEqual(res.body.code, 'FORBIDDEN');
});

await testAsync('DELETE /api/projects/:id deletes project when called by owner (200 OK)', async () => {
  const res = await api('DELETE', `/api/projects/${createdProjectId}`, undefined, {
    'x-dev-user-id': ownerUser._id.toString(),
  });

  assertEqual(res.status, 200);
  assertEqual(res.body.status, 'ok');
  assertEqual(res.body.data.id, createdProjectId);

  // Verify project is no longer in database
  const getRes = await api('GET', `/api/projects/${createdProjectId}`);
  assertEqual(getRes.status, 404);
  assertEqual(getRes.body.code, 'NOT_FOUND');
});

// ── 6. Production Write Protection Guard ────────────────────────────────────

await testAsync('POST /api/projects rejects unauthenticated writes in production mode (401 UNAUTHORIZED)', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const res = await api('POST', '/api/projects', {
      title: 'Attempted Production Write',
      description: 'Valid description that has sufficient length of more than twenty characters.',
      category: 'Backend',
    });

    assertEqual(res.status, 401);
    assertEqual(res.body.code, 'UNAUTHORIZED');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

// ── Teardown ────────────────────────────────────────────────────────────────

await new Promise((resolve) => server.close(resolve));
await Project.deleteMany({});
await User.deleteMany({ username: { $in: ['test_owner', 'other_user', 'dev_author'] } });
await disconnectDatabase();

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
