/**
 * DEVVERSE — Prompt 26: Client-side Threads Static Tests
 *
 * Static analysis verifying:
 *   1. threadService.js exists and exports all 5 required methods.
 *   2. CommunityDetailPage.jsx imports threadService.
 *   3. CommunityDetailPage.jsx renders thread list and has compose forms.
 *   4. CommunityDetailPage.jsx does NOT use dangerouslySetInnerHTML (XSS safe).
 *   5. CommunityDetailPage.jsx uses useAuth for authentication gating.
 *   6. CommunityDetailPage.jsx links to /login for unauthenticated users.
 *
 * Run: node client/scripts/test-threads.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repo root is two levels above client/scripts/
const ROOT = resolve(__dirname, '..', '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ [FAIL] ${name}\n    Error: ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function fileExists(rel) {
  return existsSync(resolve(ROOT, rel));
}

function read(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 26 — Client Threads Static Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── File existence ─────────────────────────────────────────────────────────────
test('client/src/services/threadService.js exists', () =>
  assert(fileExists('client/src/services/threadService.js')));
test('client/src/pages/CommunityDetailPage.jsx exists', () =>
  assert(fileExists('client/src/pages/CommunityDetailPage.jsx')));
test('server/models/Thread.js exists', () =>
  assert(fileExists('server/models/Thread.js')));
test('server/models/Reply.js exists', () =>
  assert(fileExists('server/models/Reply.js')));
test('server/validators/threadValidator.js exists', () =>
  assert(fileExists('server/validators/threadValidator.js')));
test('server/services/threadService.js exists', () =>
  assert(fileExists('server/services/threadService.js')));
test('server/controllers/threadController.js exists', () =>
  assert(fileExists('server/controllers/threadController.js')));
test('server/routes/threads.js exists', () =>
  assert(fileExists('server/routes/threads.js')));

// ── threadService.js checks ────────────────────────────────────────────────────
const svcSrc = read('client/src/services/threadService.js');

test('threadService: exports getThreads', () =>
  assert(svcSrc.includes('getThreads'), 'Missing getThreads'));
test('threadService: exports getThread', () =>
  assert(svcSrc.includes('getThread'), 'Missing getThread'));
test('threadService: exports createThread', () =>
  assert(svcSrc.includes('createThread'), 'Missing createThread'));
test('threadService: exports getReplies', () =>
  assert(svcSrc.includes('getReplies'), 'Missing getReplies'));
test('threadService: exports createReply', () =>
  assert(svcSrc.includes('createReply'), 'Missing createReply'));

// ── CommunityDetailPage.jsx checks ────────────────────────────────────────────
const cdpSrc = read('client/src/pages/CommunityDetailPage.jsx');

test('CommunityDetailPage: imports threadService', () =>
  assert(cdpSrc.includes('threadService'), 'Must import threadService'));
test('CommunityDetailPage: uses useAuth', () =>
  assert(cdpSrc.includes('useAuth'), 'Must use useAuth'));
test('CommunityDetailPage: calls getThreads', () =>
  assert(cdpSrc.includes('getThreads'), 'Must call getThreads'));
test('CommunityDetailPage: calls createThread', () =>
  assert(cdpSrc.includes('createThread'), 'Must call createThread'));
test('CommunityDetailPage: calls getReplies', () =>
  assert(cdpSrc.includes('getReplies'), 'Must call getReplies'));
test('CommunityDetailPage: calls createReply', () =>
  assert(cdpSrc.includes('createReply'), 'Must call createReply'));
test('CommunityDetailPage: has compose thread form', () =>
  assert(cdpSrc.includes('ComposeThreadForm') || cdpSrc.includes('New Thread'), 'Must have compose thread form'));
test('CommunityDetailPage: has compose reply form', () =>
  assert(cdpSrc.includes('ComposeReplyForm') || cdpSrc.includes('Write a reply'), 'Must have compose reply form'));
test('CommunityDetailPage: XSS safe — does NOT use dangerouslySetInnerHTML', () => {
  // Strip comment lines before searching so doc comments do not trigger false positive
  const nonCommentLines = cdpSrc.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'));
  const nonCommentSrc = nonCommentLines.join('\n');
  assert(!nonCommentSrc.includes('dangerouslySetInnerHTML'), 'Must NOT use dangerouslySetInnerHTML in code (comments excluded)');
});
test('CommunityDetailPage: links unauthenticated users to /login', () =>
  assert(cdpSrc.includes('/login'), 'Must provide /login link for unauthenticated users'));
test('CommunityDetailPage: uses useParams to read :id from URL', () =>
  assert(cdpSrc.includes('useParams'), 'Must use useParams'));
test('CommunityDetailPage: handles empty thread state', () =>
  assert(cdpSrc.includes('No threads') || cdpSrc.includes('no thread'), 'Must handle empty thread state'));

// ── Server-side checks ─────────────────────────────────────────────────────────
const threadSvcSrc = read('server/services/threadService.js');

test('server/threadService: uses safe author projection (no email/passwordHash)', () =>
  assert(
    threadSvcSrc.includes('username displayName avatarUrl') ||
    threadSvcSrc.includes('AUTHOR_PROJECTION'),
    'Must use safe author projection'
  ));
test('server/threadService: checks THREAD_COMMUNITY_MISMATCH', () =>
  assert(threadSvcSrc.includes('THREAD_COMMUNITY_MISMATCH'), 'Must enforce community parentage'));
test('server/threadService: syncs repliesCount from real Reply records', () =>
  assert(threadSvcSrc.includes('repliesCount') && threadSvcSrc.includes('countDocuments'), 'Must sync repliesCount'));

const threadValidatorSrc = read('server/validators/threadValidator.js');
test('threadValidator: validates title (5-140)', () =>
  assert(threadValidatorSrc.includes('title') && threadValidatorSrc.includes('5'), 'Must validate title minLength'));
test('threadValidator: validates body for thread (10-5000)', () =>
  assert(threadValidatorSrc.includes('5000'), 'Must validate thread body maxLength'));
test('threadValidator: validates reply body (1-2000)', () =>
  assert(threadValidatorSrc.includes('2000'), 'Must validate reply body maxLength'));

const routesSrc = read('server/routes/threads.js');
test('thread routes: uses mergeParams: true', () =>
  assert(routesSrc.includes('mergeParams'), 'Router must use mergeParams: true'));
test('thread routes: requireAuth on POST /', () =>
  assert(routesSrc.includes('requireAuth'), 'Must require auth for POST'));

const appSrc = read('server/app.js');
test('app.js: mounts thread routes at /api/communities/:communityId/threads', () =>
  assert(appSrc.includes('/api/communities/:communityId/threads'), 'Must mount thread routes'));

// ── Print summary ─────────────────────────────────────────────────────────────
console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`  ✗ ${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  console.log('✓ All Prompt 26 client threads tests passed!\n');
}
