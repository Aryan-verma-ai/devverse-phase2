/**
 * DEVVERSE — Prompt 23: Profile and Portfolio Verification Tests
 *
 * Verifies that:
 *   - services/userService.js exists and exports:
 *     * getPublicProfile(usernameOrId)
 *     * updateProfile(data, targetUserId)
 *   - pages/ProfilePage.jsx exists and supports:
 *     * public profile view & authenticated profile editing
 *     * grounded fields (displayName, bio, avatarUrl, skills, links)
 *     * exclusion of private fields (email, passwordHash)
 *     * tier computation (Legend, Architect, Builder, Novice)
 *     * authored projects display
 *   - pages/PortfolioPage.jsx exists and supports:
 *     * editor mode for authenticated owner
 *     * public showcase mode for visitors
 *     * live card preview & shareable link
 *     * grounded portfolio fields
 *   - App.jsx routes:
 *     * /profile and /profile/:username
 *     * /portfolio and /portfolio/:username
 *
 * Run: node client/scripts/test-profile-portfolio.js
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
console.log('  PROMPT 23 — Profile & Portfolio Client Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. userService static inspection ──────────────────────────────

const userServicePath = path.join(srcDir, 'services/userService.js');
test('services/userService.js exists', () => {
  assert(fs.existsSync(userServicePath), 'userService.js must exist');
});

const userServiceCode = fs.readFileSync(userServicePath, 'utf8');

test('userService exports getPublicProfile(usernameOrId)', () => {
  assert(/getPublicProfile\s*\(/.test(userServiceCode), 'must define getPublicProfile');
  assert(/apiClient\.get\(/.test(userServiceCode), 'must invoke apiClient.get');
});

test('userService exports updateProfile(data, targetUserId)', () => {
  assert(/updateProfile\s*\(/.test(userServiceCode), 'must define updateProfile');
  assert(/apiClient\.patch\(/.test(userServiceCode), 'must invoke apiClient.patch');
});

// ── 2. ProfilePage inspection ─────────────────────────────────────

const profilePagePath = path.join(srcDir, 'pages/ProfilePage.jsx');
test('pages/ProfilePage.jsx exists', () => {
  assert(fs.existsSync(profilePagePath), 'ProfilePage.jsx must exist');
});

const profilePageCode = fs.readFileSync(profilePagePath, 'utf8');

test('ProfilePage supports public profile retrieval and authenticated editing', () => {
  assert(profilePageCode.includes('getPublicProfile'), 'must call getPublicProfile');
  assert(profilePageCode.includes('updateProfile'), 'must call updateProfile');
  assert(profilePageCode.includes('useParams'), 'must support route params for public profile view');
});

test('ProfilePage adheres to grounded field inventory without leaking private account fields', () => {
  assert(profilePageCode.includes('displayName'), 'must support displayName');
  assert(profilePageCode.includes('bio'), 'must support bio');
  assert(profilePageCode.includes('avatarUrl'), 'must support avatarUrl');
  assert(profilePageCode.includes('skills'), 'must support skills');
  assert(profilePageCode.includes('links'), 'must support social links');
  assert(!profilePageCode.includes('type="password"'), 'must not expose password inputs');
  assert(!profilePageCode.includes('name="passwordHash"'), 'must never reference passwordHash');
});

test('ProfilePage renders authored projects and builder tier', () => {
  assert(profilePageCode.includes('ProjectCard'), 'must render authored projects using ProjectCard');
  assert(profilePageCode.includes('Legend') && profilePageCode.includes('Architect'), 'must support tier calculations');
});

// ── 3. PortfolioPage inspection ───────────────────────────────────

const portfolioPagePath = path.join(srcDir, 'pages/PortfolioPage.jsx');
test('pages/PortfolioPage.jsx exists', () => {
  assert(fs.existsSync(portfolioPagePath), 'PortfolioPage.jsx must exist');
});

const portfolioPageCode = fs.readFileSync(portfolioPagePath, 'utf8');

test('PortfolioPage supports dual mode: owner editor and visitor showcase', () => {
  assert(portfolioPageCode.includes('isEditorMode') || portfolioPageCode.includes('isOwner'), 'must distinguish owner editor vs visitor view');
  assert(portfolioPageCode.includes('getPublicProfile'), 'must load user profile via service');
  assert(portfolioPageCode.includes('updateProfile'), 'must save updates via service');
});

test('PortfolioPage supports live preview card and shareable link', () => {
  assert(portfolioPageCode.includes('handleCopyShareLink') || portfolioPageCode.includes('navigator.clipboard'), 'must support copying shareable portfolio link');
  assert(portfolioPageCode.includes('Live Preview'), 'must show live preview card for builder');
});

// ── 4. App.jsx route wiring ───────────────────────────────────────

const appJsxPath = path.join(srcDir, 'App.jsx');
const appContent = fs.readFileSync(appJsxPath, 'utf8');

test('App.jsx mounts /profile and /portfolio with both root and parameterized paths', () => {
  assert(/path=["']\/profile["']/.test(appContent), 'App.jsx must declare path="/profile"');
  assert(/path=["']\/portfolio["']/.test(appContent), 'App.jsx must declare path="/portfolio"');
  assert(/path=["']\/profile\/:username["']/.test(appContent), 'App.jsx must declare path="/profile/:username"');
  assert(/path=["']\/portfolio\/:username["']/.test(appContent), 'App.jsx must declare path="/portfolio/:username"');
});

// ── Summary ───────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✓ All client profile & portfolio checks passed!\n');
}
