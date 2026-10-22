/**
 * DEVVERSE — Prompt 21: Authentication Integration Tests
 *
 * Tests:
 *   - User registration (POST /api/auth/signup):
 *       * Success creates user with bcrypt password hash only (no passwordHash in response)
 *       * Enforces password complexity & field validation (422)
 *       * Rejects duplicate username (409)
 *       * Rejects duplicate email (409)
 *   - User authentication (POST /api/auth/login):
 *       * Success with email or username sets HttpOnly session cookie and returns 200
 *       * Invalid password returns 401 with generic message
 *       * Non-existent user returns 401 with generic message
 *   - Session validation & Profile (GET /api/auth/me):
 *       * Authenticated with session cookie returns 200 + user profile
 *       * Authenticated with Bearer token header returns 200 + user profile
 *       * Unauthenticated / invalid token returns 401 UNAUTHORIZED
 *   - Sign out (POST /api/auth/logout):
 *       * Clears session cookie and returns 200
 *   - Rate limiting:
 *       * Auth endpoints return 429 RATE_LIMITED when burst threshold is exceeded
 *
 * Run: node server/tests/auth.test.js
 */

import http from 'http';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import { User } from '../models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { clearRateLimitStore } from '../middleware/rateLimiter.js';
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
console.log('  PROMPT 21 — Authentication API Integration Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── Setup database connection & test server ──────────────────────────────────

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/devverse_test_auth';
await connectDatabase(TEST_DB_URI);

// Clean test user collection
await User.deleteMany({});
clearRateLimitStore();

// Start HTTP server on ephemeral port
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

/**
 * Helper to make HTTP requests against the test server
 */
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

/**
 * Extracts cookie value by name from response headers
 */
function getCookieValue(headers, cookieName) {
  const raw = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie().join('; ')
    : headers.get('set-cookie') || '';
  const match = raw.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

let testSessionCookie = null;
let testToken = null;

// ── 1. User Registration (Signup) Tests ───────────────────────────────────────

await testAsync('POST /api/auth/signup creates user and returns 201 with session cookie and safe user object', async () => {
  const payload = {
    username: 'alice_dev',
    email: 'alice@example.com',
    password: 'ValidPassword123!',
    displayName: 'Alice Developer',
    bio: 'Fullstack builder',
  };

  const res = await api('POST', '/api/auth/signup', payload);
  assertEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
  assertEqual(res.body.status, 'ok', 'Status should be ok');
  assert(res.body.data?.user, 'Response should contain user');
  assertEqual(res.body.data.user.username, 'alice_dev', 'Username should match');
  assertEqual(res.body.data.user.email, 'alice@example.com', 'Email should match');
  assertEqual(res.body.data.user.passwordHash, undefined, 'passwordHash must NEVER be returned in response');

  // Verify cookie was set
  const cookie = getCookieValue(res.headers, COOKIE_NAME);
  assert(cookie, `Expected ${COOKIE_NAME} cookie to be set in response headers`);
  const rawSetCookie = res.headers.get('set-cookie') || '';
  assert(rawSetCookie.toLowerCase().includes('httponly'), 'Cookie must have HttpOnly flag');
  assert(rawSetCookie.toLowerCase().includes('samesite=lax'), 'Cookie must have SameSite=lax flag');

  // Verify database record has bcrypt hash, not plaintext
  const dbUser = await User.findOne({ username: 'alice_dev' }).select('+passwordHash');
  assert(dbUser, 'User must exist in MongoDB');
  assert(dbUser.passwordHash !== payload.password, 'Password must not be stored as plaintext');
  assert(dbUser.passwordHash.startsWith('$2'), 'Password hash must be a valid bcrypt hash');
  const isMatch = await bcrypt.compare(payload.password, dbUser.passwordHash);
  assert(isMatch, 'Bcrypt hash in DB must verify with original password');
});

await testAsync('POST /api/auth/signup rejects weak password (< 7 chars or missing requirements) with 422', async () => {
  const payload = {
    username: 'weak_pw_user',
    email: 'weak@example.com',
    password: 'short',
    displayName: 'Weak Password',
  };

  const res = await api('POST', '/api/auth/signup', payload);
  assertEqual(res.status, 422, 'Expected 422 VALIDATION_ERROR');
  assertEqual(res.body.code, 'VALIDATION_ERROR', 'Expected code VALIDATION_ERROR');
  assert(Array.isArray(res.body.details), 'Expected validation details');
  const pwError = res.body.details.find((d) => d.field === 'password');
  assert(pwError, 'Should report error on password field');
});

await testAsync('POST /api/auth/signup rejects duplicate username with 409 CONFLICT', async () => {
  const payload = {
    username: 'ALICE_DEV', // Case-insensitive duplicate
    email: 'alice.unique@example.com',
    password: 'AnotherPassword123!',
    displayName: 'Duplicate Alice',
  };

  const res = await api('POST', '/api/auth/signup', payload);
  assertEqual(res.status, 409, 'Expected 409 CONFLICT for duplicate username');
  assertEqual(res.body.code, 'CONFLICT', 'Expected error code CONFLICT');
  assert(res.body.message?.toLowerCase().includes('username'), 'Message should mention username');
});

await testAsync('POST /api/auth/signup rejects duplicate email with 409 CONFLICT', async () => {
  const payload = {
    username: 'different_user',
    email: 'ALICE@EXAMPLE.COM', // Case-insensitive duplicate
    password: 'AnotherPassword123!',
    displayName: 'Different User',
  };

  const res = await api('POST', '/api/auth/signup', payload);
  assertEqual(res.status, 409, 'Expected 409 CONFLICT for duplicate email');
  assertEqual(res.body.code, 'CONFLICT', 'Expected error code CONFLICT');
  assert(res.body.message?.toLowerCase().includes('email'), 'Message should mention email');
});

// ── 2. User Authentication (Login) Tests ─────────────────────────────────────

await testAsync('POST /api/auth/login succeeds with valid username and password', async () => {
  const payload = {
    emailOrUsername: 'alice_dev',
    password: 'ValidPassword123!',
  };

  const res = await api('POST', '/api/auth/login', payload);
  assertEqual(res.status, 200, 'Expected 200 OK');
  assertEqual(res.body.status, 'ok', 'Status should be ok');
  assertEqual(res.body.data?.user?.username, 'alice_dev', 'Username should match');
  assertEqual(res.body.data?.user?.passwordHash, undefined, 'passwordHash must not be returned');

  testSessionCookie = getCookieValue(res.headers, COOKIE_NAME);
  assert(testSessionCookie, 'Session cookie must be set on successful login');
  testToken = testSessionCookie;
});

await testAsync('POST /api/auth/login succeeds with valid email address', async () => {
  const payload = {
    emailOrUsername: 'alice@example.com',
    password: 'ValidPassword123!',
  };

  const res = await api('POST', '/api/auth/login', payload);
  assertEqual(res.status, 200, 'Expected 200 OK when logging in by email');
  assertEqual(res.body.data?.user?.email, 'alice@example.com', 'Email should match');
});

await testAsync('POST /api/auth/login fails on wrong password with generic 401 error', async () => {
  const payload = {
    emailOrUsername: 'alice_dev',
    password: 'WrongPassword999!',
  };

  const res = await api('POST', '/api/auth/login', payload);
  assertEqual(res.status, 401, 'Expected 401 for incorrect password');
  assertEqual(res.body.code, 'INVALID_CREDENTIALS', 'Expected generic error code');
  assert(
    res.body.message?.includes('Invalid username/email or password'),
    'Generic error message must be returned to prevent enumeration'
  );
});

await testAsync('POST /api/auth/login fails on non-existent account with same generic 401 error', async () => {
  const payload = {
    emailOrUsername: 'ghost_user_9999',
    password: 'SomePassword123!',
  };

  const res = await api('POST', '/api/auth/login', payload);
  assertEqual(res.status, 401, 'Expected 401 for unknown user');
  assertEqual(res.body.code, 'INVALID_CREDENTIALS', 'Expected generic error code');
  assert(
    res.body.message?.includes('Invalid username/email or password'),
    'Same generic error message must be returned to prevent enumeration'
  );
});

// ── 3. Session Validation (GET /api/auth/me) Tests ───────────────────────────

await testAsync('GET /api/auth/me returns current user when valid cookie is provided', async () => {
  assert(testSessionCookie, 'testSessionCookie must be available');
  const res = await api('GET', '/api/auth/me', undefined, {
    Cookie: `${COOKIE_NAME}=${testSessionCookie}`,
  });

  assertEqual(res.status, 200, 'Expected 200 OK');
  assertEqual(res.body.data?.user?.username, 'alice_dev', 'Should return current user');
  assertEqual(res.body.data?.user?.passwordHash, undefined, 'passwordHash must not be present');
});

await testAsync('GET /api/auth/me returns current user when valid Bearer header is provided', async () => {
  assert(testToken, 'testToken must be available');
  const res = await api('GET', '/api/auth/me', undefined, {
    Authorization: `Bearer ${testToken}`,
  });

  assertEqual(res.status, 200, 'Expected 200 OK');
  assertEqual(res.body.data?.user?.username, 'alice_dev', 'Should return current user');
});

await testAsync('GET /api/auth/me rejects request without credentials with 401 UNAUTHORIZED', async () => {
  const res = await api('GET', '/api/auth/me');
  assertEqual(res.status, 401, 'Expected 401 UNAUTHORIZED');
  assertEqual(res.body.code, 'UNAUTHORIZED', 'Expected UNAUTHORIZED code');
});

await testAsync('GET /api/auth/me rejects tampered or forged session token with 401 UNAUTHORIZED', async () => {
  const forgedCookie = `${testSessionCookie.split('.')[0]}.forgedinvalidsignature12345`;
  const res = await api('GET', '/api/auth/me', undefined, {
    Cookie: `${COOKIE_NAME}=${forgedCookie}`,
  });

  assertEqual(res.status, 401, 'Expected 401 UNAUTHORIZED for forged signature');
});

// ── 4. Sign Out (POST /api/auth/logout) Tests ─────────────────────────────────

await testAsync('POST /api/auth/logout clears session cookie and returns 200', async () => {
  const res = await api('POST', '/api/auth/logout', undefined, {
    Cookie: `${COOKIE_NAME}=${testSessionCookie}`,
  });

  assertEqual(res.status, 200, 'Expected 200 OK');
  assertEqual(res.body.status, 'ok', 'Status should be ok');

  // Verify clear cookie header
  const rawSetCookie = res.headers.get('set-cookie') || '';
  assert(
    rawSetCookie.includes(`${COOKIE_NAME}=;`) || rawSetCookie.includes('Max-Age=0') || rawSetCookie.includes('expires='),
    'Logout must clear the session cookie'
  );
});

// ── 5. Rate Limiter Tests ────────────────────────────────────────────────────

await testAsync('Auth rate limiter throttles excessive signup/login requests with 429 RATE_LIMITED', async () => {
  clearRateLimitStore();

  let rateLimitedRes = null;

  // Rapidly issue 25 requests to trigger the 20-req limit (use empty payload so validateLogin halts before heavy bcrypt)
  for (let i = 0; i < 25; i++) {
    const res = await api('POST', '/api/auth/login', {});
    if (res.status === 429) {
      rateLimitedRes = res;
      break;
    }
  }

  assert(rateLimitedRes !== null, 'Rate limiter should have triggered 429 within 25 requests');
  assertEqual(rateLimitedRes.status, 429, 'Expected 429 Too Many Requests');
  assertEqual(rateLimitedRes.body.code, 'RATE_LIMITED', 'Expected RATE_LIMITED error code');
  assert(rateLimitedRes.headers.get('retry-after'), 'Response should include Retry-After header');
  assert(rateLimitedRes.headers.get('x-ratelimit-limit'), 'Response should include X-RateLimit-Limit');

  // Clean store for remaining tests
  clearRateLimitStore();
});

// ── Teardown ─────────────────────────────────────────────────────────────────

await disconnectDatabase();
await new Promise((resolve) => server.close(resolve));

console.log('───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.error(`✗ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✓ All authentication integration tests passed!\n');
}
