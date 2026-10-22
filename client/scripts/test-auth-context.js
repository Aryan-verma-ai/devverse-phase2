/**
 * DEVVERSE — Prompt 22: Client AuthContext and Service Verification
 *
 * Verifies that:
 *   - authService exports all required session methods:
 *     * getCurrentUser()
 *     * login()
 *     * signup()
 *     * logout()
 *   - apiClient has credentials: 'include' for cross-origin/proxy cookie transport.
 *   - AuthContext exports AuthProvider and useAuth.
 *   - ProtectedRoute exists and guards authenticated components.
 *   - LoginPage and SignupPage exist and wire AuthContext.
 *   - App.jsx includes AuthProvider and protects user routes.
 *
 * Run: node client/scripts/test-auth-context.js
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
console.log('  PROMPT 22 — Client Auth Service & Context Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. authService static inspection ──────────────────────────────────────────

const authServicePath = path.join(srcDir, 'services/authService.js');
test('services/authService.js exists', () => {
  assert(fs.existsSync(authServicePath), 'authService.js must exist');
});

const authServiceCode = fs.readFileSync(authServicePath, 'utf8');

test('authService exports getCurrentUser, login, signup, logout', () => {
  assert(authServiceCode.includes('getCurrentUser'), 'Must export getCurrentUser');
  assert(authServiceCode.includes('login(') || authServiceCode.includes('login:'), 'Must export login');
  assert(authServiceCode.includes('signup(') || authServiceCode.includes('signup:'), 'Must export signup');
  assert(authServiceCode.includes('logout(') || authServiceCode.includes('logout:'), 'Must export logout');
});

test('authService calls /auth/me for current user session', () => {
  assert(authServiceCode.includes("'/auth/me'") || authServiceCode.includes('"/auth/me"'), 'Must query /auth/me');
});

test('authService calls /auth/logout for session clearance', () => {
  assert(authServiceCode.includes("'/auth/logout'") || authServiceCode.includes('"/auth/logout"'), 'Must post to /auth/logout');
});

// ── 2. apiClient credentials check ───────────────────────────────────────────

const apiClientPath = path.join(srcDir, 'services/apiClient.js');
const apiClientCode = fs.readFileSync(apiClientPath, 'utf8');

test("apiClient includes credentials: 'include' for cookie sessions", () => {
  assert(
    apiClientCode.includes("credentials: 'include'") || apiClientCode.includes('credentials: "include"'),
    "apiClient must specify credentials: 'include'"
  );
});

// ── 3. AuthContext inspection ────────────────────────────────────────────────

const authContextPath = path.join(srcDir, 'context/AuthContext.jsx');
test('context/AuthContext.jsx exists', () => {
  assert(fs.existsSync(authContextPath), 'AuthContext.jsx must exist');
});

const authContextCode = fs.readFileSync(authContextPath, 'utf8');

test('AuthContext exports AuthProvider and useAuth hook', () => {
  assert(authContextCode.includes('export function AuthProvider'), 'Must export AuthProvider');
  assert(authContextCode.includes('export function useAuth'), 'Must export useAuth');
});

test('AuthContext hydrates session from server on mount (GET /auth/me)', () => {
  assert(authContextCode.includes('authService.getCurrentUser()'), 'Must call authService.getCurrentUser() on init');
  assert(authContextCode.includes('useEffect'), 'Must use useEffect for initial session check');
});

test('AuthContext handles 401 unauthenticated guest gracefully without error crash', () => {
  assert(authContextCode.includes('401') || authContextCode.includes('UNAUTHORIZED'), 'Must handle 401 status safely');
});

test('AuthContext never stores passwords or tokens in localStorage', () => {
  assert(!authContextCode.includes('localStorage.setItem'), 'localStorage must not be used for tokens/passwords');
});

// ── 4. ProtectedRoute inspection ─────────────────────────────────────────────

const protectedRoutePath = path.join(srcDir, 'components/auth/ProtectedRoute.jsx');
test('components/auth/ProtectedRoute.jsx exists', () => {
  assert(fs.existsSync(protectedRoutePath), 'ProtectedRoute.jsx must exist');
});

const protectedRouteCode = fs.readFileSync(protectedRoutePath, 'utf8');

test('ProtectedRoute uses useAuth and redirects to /login when unauthenticated', () => {
  assert(protectedRouteCode.includes('useAuth'), 'Must consume useAuth');
  assert(protectedRouteCode.includes('/login'), 'Must redirect to /login');
  assert(protectedRouteCode.includes('Navigate'), 'Must use React Router Navigate');
});

// ── 5. LoginPage & SignupPage inspection ─────────────────────────────────────

const loginPagePath = path.join(srcDir, 'pages/LoginPage.jsx');
test('pages/LoginPage.jsx exists and consumes useAuth', () => {
  assert(fs.existsSync(loginPagePath), 'LoginPage.jsx must exist');
  const code = fs.readFileSync(loginPagePath, 'utf8');
  assert(code.includes('useAuth'), 'LoginPage must consume useAuth');
  assert(code.includes('login('), 'LoginPage must invoke login()');
});

const signupPagePath = path.join(srcDir, 'pages/SignupPage.jsx');
test('pages/SignupPage.jsx exists and consumes useAuth', () => {
  assert(fs.existsSync(signupPagePath), 'SignupPage.jsx must exist');
  const code = fs.readFileSync(signupPagePath, 'utf8');
  assert(code.includes('useAuth'), 'SignupPage must consume useAuth');
  assert(code.includes('signup('), 'SignupPage must invoke signup()');
});

// ── 6. App.jsx integration ───────────────────────────────────────────────────

const appPath = path.join(srcDir, 'App.jsx');
const appCode = fs.readFileSync(appPath, 'utf8');

test('App.jsx wraps routes in AuthProvider', () => {
  assert(appCode.includes('<AuthProvider>'), 'App.jsx must render <AuthProvider>');
});

test('App.jsx protects /submit-project with ProtectedRoute', () => {
  assert(
    appCode.includes('path="/submit-project"') && appCode.includes('<ProtectedRoute>'),
    'Submit project route must be wrapped in ProtectedRoute'
  );
});

// ── Print results ────────────────────────────────────────────────────────────

console.log('───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`✗ ${failed} client auth check(s) failed.`);
  process.exit(1);
} else {
  console.log('✓ All client auth service and context tests passed!\n');
}
