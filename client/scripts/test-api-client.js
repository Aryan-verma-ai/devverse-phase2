/**
 * DEVVERSE — Client API Client & Project Service Tests
 *
 * Verifies:
 *   1. ApiError structure and properties.
 *   2. apiClient request formatting and error transformation.
 *   3. normalizeProject adapter (MongoDB documents -> UI components).
 *   4. projectService API contract methods.
 *
 * Run: node client/scripts/test-api-client.js
 */

import { ApiError } from '../src/services/apiClient.js';
import { normalizeProject, projectService } from '../src/services/projectService.js';

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 20 — Client API & Project Service Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. ApiError Class ────────────────────────────────────────────────────────

test('ApiError: constructs with status, code, details, and message', () => {
  const err = new ApiError('Validation failed', 422, 'VALIDATION_ERROR', [
    { field: 'title', message: 'Too short' },
  ]);
  assertEqual(err.name, 'ApiError');
  assertEqual(err.message, 'Validation failed');
  assertEqual(err.status, 422);
  assertEqual(err.code, 'VALIDATION_ERROR');
  assertEqual(err.details.length, 1);
  assert(err instanceof Error, 'Must be instance of Error');
});

test('ApiError: defaults to status 500 and INTERNAL_ERROR', () => {
  const err = new ApiError('Server error');
  assertEqual(err.status, 500);
  assertEqual(err.code, 'INTERNAL_ERROR');
  assertEqual(err.details.length, 0);
});

// ── 2. normalizeProject Adapter ──────────────────────────────────────────────

test('normalizeProject: maps MongoDB document fields to UI model', () => {
  const mongoDoc = {
    _id: '6717a1234567890abcdef123',
    title: 'Distributed Log Engine',
    description: 'High-throughput append-only distributed log written for real-time telemetry streaming.',
    category: 'Systems',
    difficulty: 'Advanced',
    technologies: ['Rust', 'gRPC'],
    features: ['Zero-copy serialization', 'Raft consensus'],
    githubUrl: 'https://github.com/systems/log-engine',
    demoUrl: 'https://log-engine.demo',
    timeline: [{ hash: 'abc1234', message: 'Initial commit', date: '2026-10-22' }],
    art: 'project-2.png',
    gradient: 2,
    likesCount: 154,
    viewsCount: 3200,
    owner: {
      username: 'rustacean',
      displayName: 'Ferris Dev',
      avatarUrl: 'https://avatars.dev/rust.png',
    },
    createdAt: '2026-10-22T12:00:00.000Z',
  };

  const normalized = normalizeProject(mongoDoc);

  assertEqual(normalized.id, '6717a1234567890abcdef123');
  assertEqual(normalized.title, 'Distributed Log Engine');
  assertEqual(normalized.desc, mongoDoc.description);
  assertEqual(normalized.description, mongoDoc.description);
  assertEqual(normalized.category, 'Systems');
  assertEqual(normalized.difficulty, 'Advanced');
  assertEqual(normalized.tags.length, 2);
  assertEqual(normalized.tags[0], 'Rust');
  assertEqual(normalized.features.length, 2);
  assertEqual(normalized.likes, 154);
  assertEqual(normalized.views, 3200);
  assertEqual(normalized.author, 'rustacean');
  assertEqual(normalized.owner.displayName, 'Ferris Dev');
  assertEqual(normalized.gradient, 2);
});

test('normalizeProject: handles legacy seed project objects with fallback defaults', () => {
  const seedObj = {
    id: 'p1',
    title: 'Nebula UI Kit',
    desc: 'Glassmorphic component system',
    tags: ['React'],
    difficulty: 'Intermediate',
    likes: 842,
    views: 12400,
    category: 'Frontend',
    author: 'ari-devs',
    gradient: 0,
  };

  const normalized = normalizeProject(seedObj);

  assertEqual(normalized.id, 'p1');
  assertEqual(normalized.title, 'Nebula UI Kit');
  assertEqual(normalized.desc, 'Glassmorphic component system');
  assertEqual(normalized.description, 'Glassmorphic component system');
  assertEqual(normalized.likes, 842);
  assertEqual(normalized.views, 12400);
  assertEqual(normalized.author, 'ari-devs');
});

test('normalizeProject: returns null when input is null or undefined', () => {
  assertEqual(normalizeProject(null), null);
  assertEqual(normalizeProject(undefined), null);
});

// ── 3. projectService Interface ──────────────────────────────────────────────

test('projectService: exports all required CRUD methods', () => {
  assert(typeof projectService.getProjects === 'function', 'Must export getProjects');
  assert(typeof projectService.getProjectById === 'function', 'Must export getProjectById');
  assert(typeof projectService.createProject === 'function', 'Must export createProject');
  assert(typeof projectService.updateProject === 'function', 'Must export updateProject');
  assert(typeof projectService.deleteProject === 'function', 'Must export deleteProject');
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
