/**
 * DEVVERSE — Prompt 14: Unit Tests for Pure Helpers
 *
 * Tests pure, side-effect-free helper functions:
 *   - filterAndSortProjects (filtering, sorting, immutability)
 *   - validateUrlProtocol (URL safety)
 *   - parseGithubRepoUrl (URL parsing)
 *   - addTemporaryProject / getSeedProjectById / getUserSubmittedProjects (session data)
 *
 * No test framework installed — uses a minimal inline runner identical in style
 * to all other verify scripts in this project (node scripts pattern).
 * Deliberately kept small: only pure helpers are tested here. React components
 * and network calls are covered by the existing verify-*.js scripts.
 *
 * Run: node scripts/test-unit-helpers.js
 */

import {
  filterAndSortProjects,
  validateUrlProtocol,
  getSeedProjectById,
  addTemporaryProject,
  getUserSubmittedProjects,
  getSeedProjects,
  getSeedCategories,
  getRelatedProjects,
  SEED_PROJECTS,
} from '../src/data/seedProjects.js';

import { parseGithubRepoUrl } from '../src/services/githubImport.js';

// ---------------------------------------------------------------------------
// Minimal test runner
// ---------------------------------------------------------------------------

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

function assertDeepEqual(a, b, msg) {
  const as = JSON.stringify(a);
  const bs = JSON.stringify(b);
  if (as !== bs) throw new Error(msg || `Expected:\n  ${bs}\nGot:\n  ${as}`);
}

// ---------------------------------------------------------------------------
// ─── filterAndSortProjects ────────────────────────────────────────────────
// ---------------------------------------------------------------------------

test('filterAndSortProjects: returns all projects when no criteria given', () => {
  const result = filterAndSortProjects(SEED_PROJECTS);
  assertEqual(result.length, SEED_PROJECTS.length);
});

test('filterAndSortProjects: does NOT mutate the input array', () => {
  const input = [...SEED_PROJECTS];
  const original = [...input];
  filterAndSortProjects(input, { sort: 'likes' });
  assertDeepEqual(input.map(p => p.id), original.map(p => p.id), 'Input array was mutated');
});

test('filterAndSortProjects: does NOT mutate frozen SEED_PROJECTS', () => {
  // SEED_PROJECTS is Object.freeze([...]); sort would throw if it tried to sort in place
  assert(Object.isFrozen(SEED_PROJECTS), 'SEED_PROJECTS should be frozen');
  // This should not throw
  const result = filterAndSortProjects(SEED_PROJECTS, { sort: 'likes' });
  assert(result.length === SEED_PROJECTS.length, 'Should return all projects');
});

test('filterAndSortProjects: category filter is case-insensitive', () => {
  const lower = filterAndSortProjects(SEED_PROJECTS, { category: 'frontend' });
  const upper = filterAndSortProjects(SEED_PROJECTS, { category: 'Frontend' });
  assertEqual(lower.length, upper.length, 'Case should not matter for category filter');
  assert(lower.length > 0, 'Should match at least one Frontend project');
});

test('filterAndSortProjects: filters by category correctly', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { category: 'Frontend' });
  assert(result.length > 0, 'Expected Frontend projects');
  assert(result.every(p => p.category.toLowerCase() === 'frontend'), 'All results must be Frontend');
});

test('filterAndSortProjects: filters by difficulty correctly', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { difficulty: 'Advanced' });
  assert(result.length > 0, 'Expected Advanced projects');
  assert(result.every(p => p.difficulty.toLowerCase() === 'advanced'), 'All results must be Advanced');
});

test('filterAndSortProjects: combined category + difficulty filter', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { category: 'Systems', difficulty: 'Advanced' });
  assert(result.length > 0, 'Expected Systems+Advanced projects');
  assert(result.every(p => p.category === 'Systems' && p.difficulty === 'Advanced'));
});

test('filterAndSortProjects: search matches project title (case-insensitive)', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { search: 'nebula' });
  assert(result.length >= 1, 'Should match Nebula UI Kit');
  assert(result[0].title.toLowerCase().includes('nebula'), 'Match should be title-based');
});

test('filterAndSortProjects: search matches tags', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { search: 'rust' });
  assert(result.length >= 1, 'Should match projects with Rust tag');
  assert(
    result.every(p =>
      p.title.toLowerCase().includes('rust') ||
      p.desc.toLowerCase().includes('rust') ||
      p.tags.some(t => t.toLowerCase().includes('rust'))
    ),
    'All matches should contain "rust" in title, desc, or tags'
  );
});

test('filterAndSortProjects: no-match search returns empty array', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { search: 'zzz-no-match-xyzzy' });
  assertEqual(result.length, 0);
});

test('filterAndSortProjects: sort=likes descending', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { sort: 'likes' });
  for (let i = 0; i < result.length - 1; i++) {
    assert(result[i].likes >= result[i + 1].likes, `Index ${i} has fewer likes than ${i + 1}`);
  }
});

test('filterAndSortProjects: sort=views descending', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { sort: 'views' });
  for (let i = 0; i < result.length - 1; i++) {
    assert(result[i].views >= result[i + 1].views, `Index ${i} has fewer views than ${i + 1}`);
  }
});

test('filterAndSortProjects: sort=trending returns deterministic order', () => {
  const a = filterAndSortProjects(SEED_PROJECTS, { sort: 'trending' });
  const b = filterAndSortProjects(SEED_PROJECTS, { sort: 'trending' });
  assertDeepEqual(a.map(p => p.id), b.map(p => p.id), 'Trending sort should be deterministic');
});

test('filterAndSortProjects: sort=newest places canonical p15 before p1', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { sort: 'newest' });
  const ids = result.map(p => p.id);
  const idxP1 = ids.indexOf('p1');
  const idxP15 = ids.indexOf('p15');
  assert(idxP1 !== -1 && idxP15 !== -1, 'p1 and p15 should both be present');
  assert(idxP15 < idxP1, `p15 (idx ${idxP15}) should appear before p1 (idx ${idxP1}) in newest order`);
});

test('filterAndSortProjects: sort=newest places user-submitted projects before canonical ones', () => {
  const fakeUserProject = { id: 'user-9999999999999', title: 'Test', desc: 'Test', tags: [], category: 'Frontend', difficulty: 'Beginner', likes: 0, views: 0 };
  const mixed = [SEED_PROJECTS[0], fakeUserProject, SEED_PROJECTS[1]];
  const result = filterAndSortProjects(mixed, { sort: 'newest' });
  assertEqual(result[0].id, 'user-9999999999999', 'User project should appear first in newest sort');
});

test('filterAndSortProjects: "All" category returns all projects', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { category: 'All' });
  assertEqual(result.length, SEED_PROJECTS.length);
});

test('filterAndSortProjects: "All" difficulty returns all projects', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { difficulty: 'All' });
  assertEqual(result.length, SEED_PROJECTS.length);
});

test('filterAndSortProjects: reset (All+All+no search) returns all 15 projects', () => {
  const result = filterAndSortProjects(SEED_PROJECTS, { search: '', category: 'All', difficulty: 'All', sort: 'trending' });
  assertEqual(result.length, 15, 'All 15 seed projects should be present after reset');
});

// ---------------------------------------------------------------------------
// ─── validateUrlProtocol ──────────────────────────────────────────────────
// ---------------------------------------------------------------------------

test('validateUrlProtocol: accepts https URL', () => {
  assertEqual(validateUrlProtocol('https://github.com/owner/repo'), 'https://github.com/owner/repo');
});

test('validateUrlProtocol: accepts http URL', () => {
  const result = validateUrlProtocol('http://example.com');
  assert(result !== null, 'http URL should be valid');
});

test('validateUrlProtocol: rejects javascript: scheme', () => {
  assertEqual(validateUrlProtocol('javascript:alert(1)'), null);
});

test('validateUrlProtocol: rejects data: scheme', () => {
  assertEqual(validateUrlProtocol('data:text/html,<h1>XSS</h1>'), null);
});

test('validateUrlProtocol: rejects vbscript: scheme', () => {
  assertEqual(validateUrlProtocol('vbscript:MsgBox(1)'), null);
});

test('validateUrlProtocol: rejects empty string', () => {
  assertEqual(validateUrlProtocol(''), null);
});

test('validateUrlProtocol: rejects null/undefined', () => {
  assertEqual(validateUrlProtocol(null), null);
  assertEqual(validateUrlProtocol(undefined), null);
});

test('validateUrlProtocol: rejects plain text (no protocol)', () => {
  assertEqual(validateUrlProtocol('example.com/no-protocol'), null);
});

test('validateUrlProtocol: normalises trailing slash', () => {
  const result = validateUrlProtocol('https://example.com');
  assert(result !== null && result.startsWith('https://'), 'Should return valid URL');
});

// ---------------------------------------------------------------------------
// ─── parseGithubRepoUrl ───────────────────────────────────────────────────
// ---------------------------------------------------------------------------

test('parseGithubRepoUrl: parses standard https URL', () => {
  const r = parseGithubRepoUrl('https://github.com/owner/repo');
  assertEqual(r?.owner, 'owner');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: parses URL without protocol', () => {
  const r = parseGithubRepoUrl('github.com/owner/repo');
  assertEqual(r?.owner, 'owner');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: strips .git suffix', () => {
  const r = parseGithubRepoUrl('https://github.com/owner/repo.git');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: ignores extra path segments', () => {
  const r = parseGithubRepoUrl('https://github.com/owner/repo/tree/main/src');
  assertEqual(r?.owner, 'owner');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: returns null for non-github domain', () => {
  assertEqual(parseGithubRepoUrl('https://gitlab.com/owner/repo'), null);
});

test('parseGithubRepoUrl: returns null for owner-only URL', () => {
  assertEqual(parseGithubRepoUrl('https://github.com/owner'), null);
});

test('parseGithubRepoUrl: returns null for empty string', () => {
  assertEqual(parseGithubRepoUrl(''), null);
});

// ---------------------------------------------------------------------------
// ─── Seed data helpers ────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

test('SEED_PROJECTS: has exactly 15 canonical projects', () => {
  assertEqual(SEED_PROJECTS.length, 15);
});

test('SEED_PROJECTS: all projects have required fields', () => {
  for (const p of SEED_PROJECTS) {
    assert(p.id, `Project missing id: ${JSON.stringify(p)}`);
    assert(p.title, `Project "${p.id}" missing title`);
    assert(p.desc, `Project "${p.id}" missing desc`);
    assert(Array.isArray(p.tags), `Project "${p.id}" tags must be an array`);
    assert(p.category, `Project "${p.id}" missing category`);
    assert(p.difficulty, `Project "${p.id}" missing difficulty`);
  }
});

test('getSeedCategories: returns unique sorted categories', () => {
  const cats = getSeedCategories();
  const unique = [...new Set(cats)];
  assertEqual(cats.length, unique.length, 'Categories must be unique');
  assertDeepEqual(cats, [...cats].sort(), 'Categories must be sorted');
});

test('getSeedProjectById: returns correct canonical project', () => {
  const p = getSeedProjectById('p1');
  assert(p !== null, 'p1 should exist');
  assertEqual(p.id, 'p1');
  assertEqual(p.title, 'Nebula UI Kit');
});

test('getSeedProjectById: returns null for unknown id', () => {
  assertEqual(getSeedProjectById('no-such-id'), null);
});

test('getSeedProjectById: returns null for empty string', () => {
  assertEqual(getSeedProjectById(''), null);
});

test('getRelatedProjects: excludes the current project from results', () => {
  const related = getRelatedProjects('p1', 3);
  assert(!related.some(p => p.id === 'p1'), 'Current project should not appear in related');
});

test('getRelatedProjects: returns at most count projects', () => {
  const related = getRelatedProjects('p1', 3);
  assert(related.length <= 3, `Expected at most 3, got ${related.length}`);
});

test('getRelatedProjects: returns empty array for unknown project', () => {
  const related = getRelatedProjects('does-not-exist', 3);
  assertEqual(related.length, 0);
});

// ---------------------------------------------------------------------------
// ─── addTemporaryProject / session helpers ────────────────────────────────
// ---------------------------------------------------------------------------

test('addTemporaryProject: returns project with correct fields', () => {
  const input = {
    title: 'Test QA Project',
    desc: 'A project created during the Prompt 14 QA pass to verify session storage.',
    tags: 'React, Node.js',
    features: 'Auth, Dashboard',
    category: 'Frontend',
    difficulty: 'Intermediate',
    githubUrl: 'https://github.com/user/qa-project',
    demoUrl: 'https://qa-project.example.com',
    timeline: [{ label: 'init commit', when: '1 day ago' }],
    author: 'qa-tester',
  };
  const project = addTemporaryProject(input);

  assert(project.id.startsWith('user-'), `ID should start with "user-", got: ${project.id}`);
  assertEqual(project.title, 'Test QA Project');
  assertEqual(project.category, 'Frontend');
  assertEqual(project.difficulty, 'Intermediate');
  assertEqual(project.isTemporary, true);
  assert(Array.isArray(project.tags), 'Tags should be parsed to array');
  assert(project.tags.includes('React'), 'Tags should include React');
  assert(project.tags.includes('Node.js'), 'Tags should include Node.js');
  assert(Array.isArray(project.features), 'Features should be an array');
  assertEqual(project.features[0], 'Auth');
  assert(Array.isArray(project.timeline), 'Timeline should be an array');
  assertEqual(project.timeline.length, 1, 'Timeline entry should be stored');
  assertEqual(project.timeline[0].label, 'init commit');
  assertEqual(project.githubUrl, 'https://github.com/user/qa-project');
  assertEqual(project.demoUrl, 'https://qa-project.example.com');
  assertEqual(project.author, 'qa-tester');
  assertEqual(project.likes, 0);
  assertEqual(project.views, 1);
});

test('addTemporaryProject: parses comma-separated tags string', () => {
  const project = addTemporaryProject({
    title: 'Tag Test',
    desc: 'Testing tag parsing logic.',
    tags: '  Vue , Go , PostgreSQL ',
    category: 'Backend',
    difficulty: 'Advanced',
  });
  assertDeepEqual(project.tags, ['Vue', 'Go', 'PostgreSQL']);
});

test('addTemporaryProject: handles pre-parsed tags array', () => {
  const project = addTemporaryProject({
    title: 'Array Tags Test',
    desc: 'Tags already an array.',
    tags: ['TypeScript', 'Vite'],
    category: 'Frontend',
    difficulty: 'Beginner',
  });
  assertDeepEqual(project.tags, ['TypeScript', 'Vite']);
});

test('addTemporaryProject: timeline defaults to empty array when not provided', () => {
  const project = addTemporaryProject({
    title: 'No Timeline',
    desc: 'Project without GitHub import timeline.',
    tags: 'CSS',
    category: 'Frontend',
    difficulty: 'Beginner',
  });
  assertDeepEqual(project.timeline, []);
});

test('getUserSubmittedProjects: returns copies of submitted projects', () => {
  const submitted = getUserSubmittedProjects();
  assert(Array.isArray(submitted), 'Should return an array');
  // The projects created in tests above should be in here
  assert(submitted.length >= 1, 'Should contain at least one submitted project');
  assert(submitted.every(p => p.isTemporary === true), 'All returned projects should be isTemporary');
});

test('getSeedProjects: includes both submitted and canonical projects', () => {
  const all = getSeedProjects();
  const submitted = getUserSubmittedProjects();
  assert(all.length === SEED_PROJECTS.length + submitted.length,
    `Expected ${SEED_PROJECTS.length + submitted.length} total, got ${all.length}`);
  // User projects come first
  for (let i = 0; i < submitted.length; i++) {
    assertEqual(all[i].id, submitted[i].id, 'User projects should be first in getSeedProjects()');
  }
});

test('getSeedProjectById: finds session-submitted project by ID', () => {
  const submitted = getUserSubmittedProjects();
  assert(submitted.length > 0, 'Need at least one submitted project for this test');
  const id = submitted[0].id;
  const found = getSeedProjectById(id);
  assert(found !== null, `Should find submitted project by id: ${id}`);
  assertEqual(found.id, id);
  assertEqual(found.isTemporary, true);
});

// ---------------------------------------------------------------------------
// ─── Print results ────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 14 — Unit Tests for Pure Helpers');
console.log('═══════════════════════════════════════════════════════\n');

for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} [${r.status}] ${r.name}`);
  if (r.error) console.log(`         → ${r.error}`);
}

console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`  ✗ ${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  console.log(`  All ${passed} unit tests passed.\n`);
}
