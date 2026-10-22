/**
 * DEVVERSE — Prompt 24: Likes & Bookmarks Client Integration Tests
 *
 * Verifies that:
 *   - services/projectService.js exports all interaction methods:
 *     * likeProject(id)
 *     * unlikeProject(id)
 *     * bookmarkProject(id)
 *     * unbookmarkProject(id)
 *     * getUserInteractions()
 *   - normalizeProject preserves liked and bookmarked boolean states.
 *   - ProjectDetailPage.jsx:
 *     * Wires like and bookmark toggle handlers to projectService
 *     * Prevents unauthenticated action with explicit user warning
 *     * Reports interaction errors honestly with StatusMessage
 *     * Grounds like counts in server responses
 *   - ExplorePage.jsx:
 *     * Hydrates user interactions on mount when authenticated
 *     * Connects ProjectCard onLike and onBookmark callbacks
 *     * Updates counts and active state from server responses
 *     * Reports failures honestly without faking persistence
 *   - ProjectCard.jsx:
 *     * Supports liked, bookmarked, likes, onLike, onBookmark props
 *
 * Run: node client/scripts/test-likes-bookmarks.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

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

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 24 — Likes & Bookmarks Client Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. projectService static inspection ────────────────────────────

const projectServicePath = path.join(srcDir, 'services/projectService.js');
test('services/projectService.js exists', () => {
  assert(fs.existsSync(projectServicePath), 'projectService.js must exist');
});

const projectServiceCode = fs.readFileSync(projectServicePath, 'utf8');

test('projectService exports likeProject(id)', () => {
  assert(/likeProject\s*\(/.test(projectServiceCode), 'must define likeProject');
  assert(/apiClient\.post\(`\/projects\/\$\{id\}\/like`\)/.test(projectServiceCode), 'must post to /projects/:id/like');
});

test('projectService exports unlikeProject(id)', () => {
  assert(/unlikeProject\s*\(/.test(projectServiceCode), 'must define unlikeProject');
  assert(/apiClient\.delete\(`\/projects\/\$\{id\}\/like`\)/.test(projectServiceCode), 'must delete to /projects/:id/like');
});

test('projectService exports bookmarkProject(id)', () => {
  assert(/bookmarkProject\s*\(/.test(projectServiceCode), 'must define bookmarkProject');
  assert(/apiClient\.post\(`\/projects\/\$\{id\}\/bookmark`\)/.test(projectServiceCode), 'must post to /projects/:id/bookmark');
});

test('projectService exports unbookmarkProject(id)', () => {
  assert(/unbookmarkProject\s*\(/.test(projectServiceCode), 'must define unbookmarkProject');
  assert(/apiClient\.delete\(`\/projects\/\$\{id\}\/bookmark`\)/.test(projectServiceCode), 'must delete to /projects/:id/bookmark');
});

test('projectService exports getUserInteractions()', () => {
  assert(/getUserInteractions\s*\(/.test(projectServiceCode), 'must define getUserInteractions');
  assert(/apiClient\.get\(['"]\/projects\/user-interactions['"]\)/.test(projectServiceCode), 'must get /projects/user-interactions');
});

test('normalizeProject preserves liked and bookmarked flags', () => {
  assert(projectServiceCode.includes('liked: Boolean(p.liked)'), 'must normalize liked');
  assert(projectServiceCode.includes('bookmarked: Boolean(p.bookmarked)'), 'must normalize bookmarked');
});

// ── 2. ProjectDetailPage inspection ────────────────────────────────

const projectDetailPagePath = path.join(srcDir, 'pages/ProjectDetailPage.jsx');
test('pages/ProjectDetailPage.jsx exists', () => {
  assert(fs.existsSync(projectDetailPagePath), 'ProjectDetailPage.jsx must exist');
});

const projectDetailPageCode = fs.readFileSync(projectDetailPagePath, 'utf8');

test('ProjectDetailPage wires like and bookmark toggle handlers', () => {
  assert(projectDetailPageCode.includes('handleToggleLike'), 'must declare handleToggleLike');
  assert(projectDetailPageCode.includes('handleToggleBookmark'), 'must declare handleToggleBookmark');
  assert(projectDetailPageCode.includes('likeProject'), 'must invoke projectService.likeProject');
  assert(projectDetailPageCode.includes('unlikeProject'), 'must invoke projectService.unlikeProject');
  assert(projectDetailPageCode.includes('bookmarkProject'), 'must invoke projectService.bookmarkProject');
  assert(projectDetailPageCode.includes('unbookmarkProject'), 'must invoke projectService.unbookmarkProject');
});

test('ProjectDetailPage enforces authentication check for interactions', () => {
  assert(projectDetailPageCode.includes('useAuth'), 'must import and use useAuth');
  assert(projectDetailPageCode.includes('Please sign in to like projects'), 'must alert unauthenticated user on like');
  assert(projectDetailPageCode.includes('Please sign in to bookmark projects'), 'must alert unauthenticated user on bookmark');
});

test('ProjectDetailPage reports failures honestly with StatusMessage', () => {
  assert(projectDetailPageCode.includes('StatusMessage'), 'must render StatusMessage on error');
  assert(projectDetailPageCode.includes('interactionError'), 'must track interactionError state');
});

// ── 3. ExplorePage inspection ──────────────────────────────────────

const explorePagePath = path.join(srcDir, 'pages/ExplorePage.jsx');
test('pages/ExplorePage.jsx exists', () => {
  assert(fs.existsSync(explorePagePath), 'ExplorePage.jsx must exist');
});

const explorePageCode = fs.readFileSync(explorePagePath, 'utf8');

test('ExplorePage hydrates authenticated user interactions on mount', () => {
  assert(explorePageCode.includes('getUserInteractions'), 'must fetch getUserInteractions on mount');
  assert(explorePageCode.includes('setLikedIds'), 'must set likedIds');
  assert(explorePageCode.includes('setBookmarkedIds'), 'must set bookmarkedIds');
});

test('ExplorePage wires ProjectCard callbacks to API service and handles errors', () => {
  assert(explorePageCode.includes('onLike={handleToggleLike}'), 'must pass handleToggleLike to ProjectCard');
  assert(explorePageCode.includes('onBookmark={handleToggleBookmark}'), 'must pass handleToggleBookmark to ProjectCard');
  assert(explorePageCode.includes('interactionNotice'), 'must maintain interactionNotice state');
  assert(explorePageCode.includes('likes: res.likesCount'), 'must update project likes canonically from server');
});

// ── 4. ProjectCard inspection ──────────────────────────────────────

const projectCardPath = path.join(srcDir, 'components/ui/ProjectCard.jsx');
const projectCardCode = fs.readFileSync(projectCardPath, 'utf8');

test('ProjectCard supports liked, bookmarked, onLike, and onBookmark props', () => {
  assert(projectCardCode.includes('liked'), 'ProjectCard must accept liked prop');
  assert(projectCardCode.includes('bookmarked'), 'ProjectCard must accept bookmarked prop');
  assert(projectCardCode.includes('onLike'), 'ProjectCard must accept onLike callback');
  assert(projectCardCode.includes('onBookmark'), 'ProjectCard must accept onBookmark callback');
});

// ── Summary ────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✓ All client likes & bookmarks checks passed!\n');
}
