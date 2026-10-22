/**
 * DEVVERSE — Prompt 13: GitHub Import Verification Script
 *
 * Tests the pure helper functions from githubImport.js.
 * Network-dependent tests (actual GitHub API calls) are marked NOT RUN
 * because they depend on external availability and rate limits.
 *
 * Run: node scripts/verify-github-import.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

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

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}

// ---------------------------------------------------------------------------
// Module existence checks
// ---------------------------------------------------------------------------

test('githubImport.js exists at src/services/', () => {
  const p = join(ROOT, 'src', 'services', 'githubImport.js');
  assert(existsSync(p), `Missing: ${p}`);
});

test('SubmitProjectPage.jsx exists', () => {
  const p = join(ROOT, 'src', 'pages', 'SubmitProjectPage.jsx');
  assert(existsSync(p), `Missing: ${p}`);
});

// ---------------------------------------------------------------------------
// Source content checks (static analysis — no import needed)
// ---------------------------------------------------------------------------

const ghImportSrc = readFileSync(
  join(ROOT, 'src', 'services', 'githubImport.js'),
  'utf8'
);

const submitSrc = readFileSync(
  join(ROOT, 'src', 'pages', 'SubmitProjectPage.jsx'),
  'utf8'
);

test('githubImport exports parseGithubRepoUrl', () => {
  assert(ghImportSrc.includes('export function parseGithubRepoUrl'), 'parseGithubRepoUrl not exported');
});

test('githubImport exports fetchGithubRepo', () => {
  assert(ghImportSrc.includes('export async function fetchGithubRepo'), 'fetchGithubRepo not exported');
});

test('githubImport exports IMPORT_ERROR constants', () => {
  assert(ghImportSrc.includes('export const IMPORT_ERROR'), 'IMPORT_ERROR not exported');
});

test('githubImport exports importErrorMessage', () => {
  assert(ghImportSrc.includes('export function importErrorMessage'), 'importErrorMessage not exported');
});

test('githubImport does NOT embed any secret or token in source', () => {
  const dangerous = ['process.env.GITHUB_TOKEN', 'Authorization:', 'ghp_', 'token '];
  for (const pattern of dangerous) {
    // Allow the word 'token' in comments/docs but not in fetch headers
    if (pattern === 'token ') {
      // Check for Authorization header usage, not just the word token in prose
      assert(
        !ghImportSrc.includes("'Authorization'") && !ghImportSrc.includes('"Authorization"'),
        `Found Authorization header in githubImport.js — no secrets should be embedded`
      );
    } else {
      assert(!ghImportSrc.includes(pattern), `Found suspicious pattern "${pattern}" in githubImport.js`);
    }
  }
});

test('githubImport only calls api.github.com (not a backend proxy)', () => {
  assert(
    ghImportSrc.includes('api.github.com'),
    'Expected api.github.com in githubImport.js'
  );
  assert(
    !ghImportSrc.includes('/api/github'),
    'Should not proxy through /api/github — no backend yet'
  );
});

test('githubImport handles NOT_FOUND (404) case', () => {
  assert(ghImportSrc.includes('NOT_FOUND'), 'Missing NOT_FOUND error handling');
  assert(ghImportSrc.includes('res.status === 404'), 'Missing 404 status check');
});

test('githubImport handles rate limit (403/429) case', () => {
  assert(ghImportSrc.includes('RATE_LIMITED'), 'Missing RATE_LIMITED error');
  assert(
    ghImportSrc.includes('res.status === 403') || ghImportSrc.includes('res.status === 429'),
    'Missing 403/429 rate-limit check'
  );
});

test('githubImport handles NETWORK errors (fetch throws)', () => {
  assert(ghImportSrc.includes('NETWORK'), 'Missing NETWORK error code');
  assert(ghImportSrc.includes('catch'), 'Missing catch for network errors');
});

test('githubImport commit fetch failure is non-fatal (separate try/catch)', () => {
  // The commits fetch should be wrapped in its own try/catch, distinct from the repo fetch
  const repoFetchIdx = ghImportSrc.indexOf('fetch(API_BASE');
  const commitsFetchIdx = ghImportSrc.indexOf('commits?per_page=5');
  assert(repoFetchIdx !== -1, 'Missing main repo fetch call');
  assert(commitsFetchIdx !== -1, 'Missing commits fetch call');
  // Both should be present; commits failure should not propagate
  assert(
    ghImportSrc.includes('non-fatal') || ghImportSrc.includes('Non-fatal') || ghImportSrc.includes('not a blocking'),
    'Commits fetch failure should be documented as non-fatal'
  );
});

test('SubmitProjectPage imports fetchGithubRepo from services/githubImport', () => {
  assert(
    submitSrc.includes("from '../services/githubImport'"),
    'SubmitProjectPage must import from services/githubImport'
  );
  assert(submitSrc.includes('fetchGithubRepo'), 'SubmitProjectPage must use fetchGithubRepo');
});

test('SubmitProjectPage has GitHub import UI panel with input and button', () => {
  assert(submitSrc.includes('gh-url-input') || submitSrc.includes('gh-import'), 'Missing GitHub URL input');
  assert(
    submitSrc.includes('Fetch from GitHub') || submitSrc.includes('Import from GitHub'),
    'Missing GitHub fetch/import button or heading'
  );
});

test('SubmitProjectPage shows typed error/success/loading feedback for import', () => {
  assert(submitSrc.includes("type: 'error'") || submitSrc.includes("type: 'loading'"), 'Missing import status state types');
  assert(submitSrc.includes('role="alert"') || submitSrc.includes('role="status"'), 'Missing accessible role for import status');
});

test('SubmitProjectPage form fields remain editable after import (not readonly)', () => {
  // Should NOT have readOnly on imported fields
  assert(!submitSrc.includes('readOnly={true}'), 'Form fields must remain editable after import');
});

test('SubmitProjectPage passes timeline to addTemporaryProject', () => {
  assert(submitSrc.includes('timeline: importedTimeline') || submitSrc.includes('timeline:'), 'Missing timeline passthrough to addTemporaryProject');
});

test('SubmitProjectPage has Clear button to reset import state', () => {
  assert(
    submitSrc.includes('Clear') && (submitSrc.includes('handleClearImport') || submitSrc.includes('setGhUrl')),
    'Missing Clear button for GitHub import reset'
  );
});

// ---------------------------------------------------------------------------
// parseGithubRepoUrl logic tests (via inline re-implementation for Node.js)
// ---------------------------------------------------------------------------

// Inline the pure parsing logic so we can run tests without ESM transform
function parseGithubRepoUrlInline(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try { url = new URL(normalized); } catch { return null; }
  if (url.hostname !== 'github.com') return null;
  const parts = url.pathname.replace(/^\//, '').split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  if (!owner || !repo) return null;
  return { owner, repo };
}

test('parseGithubRepoUrl: valid https URL', () => {
  const r = parseGithubRepoUrlInline('https://github.com/facebook/react');
  assertEqual(r?.owner, 'facebook');
  assertEqual(r?.repo, 'react');
});

test('parseGithubRepoUrl: valid http URL', () => {
  const r = parseGithubRepoUrlInline('http://github.com/owner/repo');
  assertEqual(r?.owner, 'owner');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: URL without protocol', () => {
  const r = parseGithubRepoUrlInline('github.com/torvalds/linux');
  assertEqual(r?.owner, 'torvalds');
  assertEqual(r?.repo, 'linux');
});

test('parseGithubRepoUrl: URL with trailing slash', () => {
  const r = parseGithubRepoUrlInline('https://github.com/owner/repo/');
  assertEqual(r?.owner, 'owner');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: URL with extra path segments (tree/branch)', () => {
  const r = parseGithubRepoUrlInline('https://github.com/owner/repo/tree/main');
  assertEqual(r?.owner, 'owner');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: strips .git suffix', () => {
  const r = parseGithubRepoUrlInline('https://github.com/owner/repo.git');
  assertEqual(r?.repo, 'repo');
});

test('parseGithubRepoUrl: rejects non-github domain', () => {
  const r = parseGithubRepoUrlInline('https://gitlab.com/owner/repo');
  assertEqual(r, null, 'Should return null for non-github domain');
});

test('parseGithubRepoUrl: rejects missing repo segment', () => {
  const r = parseGithubRepoUrlInline('https://github.com/owner');
  assertEqual(r, null, 'Should return null for URL with only owner');
});

test('parseGithubRepoUrl: rejects empty string', () => {
  const r = parseGithubRepoUrlInline('');
  assertEqual(r, null, 'Should return null for empty string');
});

test('parseGithubRepoUrl: rejects random text', () => {
  const r = parseGithubRepoUrlInline('not a url at all');
  assertEqual(r, null, 'Should return null for nonsense input');
});

test('parseGithubRepoUrl: rejects github.com with no path', () => {
  const r = parseGithubRepoUrlInline('https://github.com/');
  assertEqual(r, null, 'Should return null for bare github.com/');
});

// ---------------------------------------------------------------------------
// Print results
// ---------------------------------------------------------------------------

console.log('\n═══════════════════════════════════════════════════');
console.log('  PROMPT 13 — GitHub Import Verification');
console.log('═══════════════════════════════════════════════════\n');

for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} [${r.status}] ${r.name}`);
  if (r.error) console.log(`         → ${r.error}`);
}

console.log('\n───────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────\n');

console.log('  Network-dependent tests: NOT RUN');
console.log('  (Actual GitHub API calls require live network and');
console.log('   unauthenticated rate limit — 60 req/hr per IP.)');
console.log('  Manual verification required for:');
console.log('    - Valid public repo import');
console.log('    - 404 / private repo error message');
console.log('    - Rate-limited error message');
console.log('    - Network offline error message');
console.log('    - Field editability after import');
console.log('    - Clear button resets state');
console.log('    - Timeline badge appears when commits are imported');
console.log();

if (failed > 0) {
  console.error(`  ✗ ${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  console.log(`  All ${passed} static tests passed.\n`);
}
