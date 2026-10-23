/**
 * DEVVERSE — Prompt 25: Client-side Communities Test
 *
 * Static analysis test verifying:
 *   1. communityService.js exports all required API methods.
 *   2. CommunitiesPage.jsx imports community service, AuthContext, and UI primitives.
 *   3. CommunityDetailPage.jsx imports community service, uses route params, and handles 404.
 *   4. App.jsx wires /communities and /communities/:id to the real page components.
 *
 * Run: node client/scripts/test-communities.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// __dirname is not available in ES modules — reconstruct it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repo root is two levels above client/scripts/
const ROOT = resolve(__dirname, '..', '..');

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
console.log('  PROMPT 25 — Client Communities Static Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── File existence ─────────────────────────────────────────────────────────────
test('client/src/services/communityService.js exists', () =>
  assert(fileExists('client/src/services/communityService.js')));
test('client/src/pages/CommunitiesPage.jsx exists', () =>
  assert(fileExists('client/src/pages/CommunitiesPage.jsx')));
test('client/src/pages/CommunityDetailPage.jsx exists', () =>
  assert(fileExists('client/src/pages/CommunityDetailPage.jsx')));

// ── communityService.js checks ────────────────────────────────────────────────
const svcSrc = read('client/src/services/communityService.js');

test('communityService: exports getCommunities', () =>
  assert(svcSrc.includes('getCommunities'), 'Missing getCommunities export'));
test('communityService: exports getCommunity', () =>
  assert(svcSrc.includes('getCommunity'), 'Missing getCommunity export'));
test('communityService: exports joinCommunity', () =>
  assert(svcSrc.includes('joinCommunity'), 'Missing joinCommunity export'));
test('communityService: exports leaveCommunity', () =>
  assert(svcSrc.includes('leaveCommunity'), 'Missing leaveCommunity export'));
test('communityService: exports getUserMemberships', () =>
  assert(svcSrc.includes('getUserMemberships'), 'Missing getUserMemberships export'));

// ── CommunitiesPage.jsx checks ────────────────────────────────────────────────
const cpSrc = read('client/src/pages/CommunitiesPage.jsx');

test('CommunitiesPage: imports communityService', () =>
  assert(cpSrc.includes("communityService"), 'Must import communityService'));
test('CommunitiesPage: uses useAuth', () =>
  assert(cpSrc.includes('useAuth'), 'Must use useAuth for session check'));
test('CommunitiesPage: imports LoadingState', () =>
  assert(cpSrc.includes('LoadingState'), 'Must import LoadingState'));
test('CommunitiesPage: imports StatusMessage', () =>
  assert(cpSrc.includes('StatusMessage'), 'Must import StatusMessage'));
test('CommunitiesPage: imports Button', () =>
  assert(cpSrc.includes('Button'), 'Must import Button'));
test('CommunitiesPage: calls getCommunities', () =>
  assert(cpSrc.includes('getCommunities'), 'Must call getCommunities'));
test('CommunitiesPage: has handleToggleJoin function', () =>
  assert(cpSrc.includes('handleToggleJoin'), 'Must have handleToggleJoin handler'));
test('CommunitiesPage: guards join action for unauthenticated user', () =>
  assert(cpSrc.includes('sign in'), 'Must show sign-in prompt for unauthenticated join'));
test('CommunitiesPage: uses optimistic update with rollback', () =>
  assert(cpSrc.includes('isCurrentlyMember'), 'Must perform optimistic UI update'));
test('CommunitiesPage: links to /communities/:id', () =>
  assert(cpSrc.includes('/communities/'), 'Must link to community detail pages'));

// ── CommunityDetailPage.jsx checks ────────────────────────────────────────────
const cdpSrc = read('client/src/pages/CommunityDetailPage.jsx');

test('CommunityDetailPage: imports communityService', () =>
  assert(cdpSrc.includes('communityService'), 'Must import communityService'));
test('CommunityDetailPage: uses useParams for route ID', () =>
  assert(cdpSrc.includes('useParams'), 'Must use useParams to read :id'));
test('CommunityDetailPage: uses useAuth', () =>
  assert(cdpSrc.includes('useAuth'), 'Must use useAuth'));
test('CommunityDetailPage: calls getCommunity', () =>
  assert(cdpSrc.includes('getCommunity'), 'Must call getCommunity'));
test('CommunityDetailPage: handles 404 / not found', () =>
  assert(
    cdpSrc.includes('404') || cdpSrc.includes('not found') || cdpSrc.includes('Not Found'),
    'Must gracefully handle 404 community'
  ));
test('CommunityDetailPage: links back to /communities', () =>
  assert(cdpSrc.includes('/communities'), 'Must link back to communities directory'));

// ── App.jsx wiring checks ─────────────────────────────────────────────────────
const appSrc = read('client/src/App.jsx');

test('App.jsx: imports CommunitiesPage', () =>
  assert(appSrc.includes("import CommunitiesPage"), 'Must import CommunitiesPage'));
test('App.jsx: imports CommunityDetailPage', () =>
  assert(appSrc.includes("import CommunityDetailPage"), 'Must import CommunityDetailPage'));
test('App.jsx: renders <CommunitiesPage /> on /communities', () =>
  assert(appSrc.includes('<CommunitiesPage'), 'Must render CommunitiesPage'));
test('App.jsx: renders <CommunityDetailPage /> on /communities/:id', () =>
  assert(appSrc.includes('<CommunityDetailPage'), 'Must render CommunityDetailPage'));
test('App.jsx: /communities route is NOT a PlaceholderPage', () => {
  // The communities route should not point to PlaceholderPage anymore
  const communitiesSection = appSrc.match(/Communities Directory[\s\S]{0,400}?<Route/);
  if (communitiesSection) {
    assert(
      !communitiesSection[0].includes('PlaceholderPage'),
      '/communities route must not use PlaceholderPage'
    );
  }
  // Primary check: CommunitiesPage must appear after the path="/communities"
  assert(
    appSrc.includes('path="/communities"') && appSrc.includes('<CommunitiesPage'),
    '/communities route must render CommunitiesPage, not PlaceholderPage'
  );
});

// ── Print summary ─────────────────────────────────────────────────────────────
console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`  ✗ ${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  console.log('✓ All Prompt 25 client communities tests passed!\n');
}
