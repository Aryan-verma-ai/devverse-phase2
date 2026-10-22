/**
 * DEVVERSE — Prompt 16: Middleware Integration Tests
 *
 * Tests the full middleware pipeline without a real database connection.
 * Imports app directly and binds it to an ephemeral port for the duration
 * of this script. No PORT conflict, no database required.
 *
 * Test coverage:
 *   - Health endpoint still works after refactor
 *   - Unknown /api route → 404 NOT_FOUND JSON
 *   - Malformed JSON body → 400 BAD_JSON
 *   - Validation: valid body → 200
 *   - Validation: missing required field → 422 VALIDATION_ERROR with details
 *   - Validation: field too short → 422 with length message
 *   - Validation: field too long → 422 with length message
 *   - Validation: invalid URL pattern → 422
 *   - Validation: optional field absent → 200 (not an error)
 *   - Validation: empty body → 422
 *   - Validation: multiple fields fail simultaneously
 *   - Known AppError thrown in route → correct status/code/message
 *   - AppError in development includes stack trace
 *   - Unexpected (non-AppError) error → 500 INTERNAL_ERROR
 *   - Every error response has status:"error", code, message
 *   - Payload too large → 413 PAYLOAD_TOO_LARGE
 *   - Rate limiter exports authRateLimiter and clearRateLimitStore
 *   - AppError constructor: correct fields and instanceof check
 *   - AppError defaults (500 / INTERNAL_ERROR / empty details)
 *
 * Run: npm test --workspace=server
 *   or: node server/tests/middleware.test.js  (from repo root)
 */

import http from 'http';

// Force development mode so test routes are enabled and stack traces appear
process.env.NODE_ENV = 'development';

import app from '../app.js';
import AppError from '../utils/AppError.js';
import { authRateLimiter, clearRateLimitStore } from '../middleware/rateLimiter.js';

// ---------------------------------------------------------------------------
// Minimal test runner (same pattern as client verify scripts)
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

// ---------------------------------------------------------------------------
// HTTP helpers — all requests go to the ephemeral server
// ---------------------------------------------------------------------------

let BASE = '';

async function apiReq(method, path, bodyStr, contentType = 'application/json') {
  const opts = { method, headers: {} };
  if (contentType) opts.headers['Content-Type'] = contentType;
  if (bodyStr !== undefined) opts.body = bodyStr;
  const res = await fetch(`${BASE}${path}`, opts);
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, body: json };
}

const GET = (path) => apiReq('GET', path, undefined, null);
const POST = (path, obj) => apiReq('POST', path, JSON.stringify(obj));
const POST_RAW = (path, raw) => apiReq('POST', path, raw, 'application/json');

// ---------------------------------------------------------------------------
// Run all tests inside a single async IIFE once the server is listening
// ---------------------------------------------------------------------------

const server = http.createServer(app);

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  BASE = `http://127.0.0.1:${port}`;

  // ─── AppError unit tests (no HTTP needed) ────────────────────────────────

  test('AppError: correct name, status, code, details', () => {
    const err = new AppError('Test message', 422, 'TEST_CODE', [{ field: 'x', message: 'bad' }]);
    assertEqual(err.name, 'AppError');
    assertEqual(err.message, 'Test message');
    assertEqual(err.status, 422);
    assertEqual(err.code, 'TEST_CODE');
    assert(Array.isArray(err.details) && err.details.length === 1, 'details should have 1 entry');
    assert(err instanceof Error, 'AppError must extend Error');
  });

  test('AppError: defaults (500 / INTERNAL_ERROR / empty details)', () => {
    const err = new AppError('Oops');
    assertEqual(err.status, 500);
    assertEqual(err.code, 'INTERNAL_ERROR');
    assert(Array.isArray(err.details) && err.details.length === 0, 'details should default to []');
  });

  // ─── Rate limiter static checks ─────────────────────────────────────────

  test('rateLimiter exports authRateLimiter function', () => {
    assert(typeof authRateLimiter === 'function', 'authRateLimiter must be a function');
  });

  test('rateLimiter exports clearRateLimitStore function', () => {
    assert(typeof clearRateLimitStore === 'function', 'clearRateLimitStore must be a function');
  });

  // ─── HTTP tests ──────────────────────────────────────────────────────────

  await testAsync('GET /api/health → 200 with status:ok and required fields', async () => {
    const { status, body } = await GET('/api/health');
    assertEqual(status, 200);
    assertEqual(body.status, 'ok');
    assertEqual(body.service, 'devverse-api');
    assert(typeof body.timestamp === 'string', 'Should have timestamp string');
    assert(typeof body.environment === 'string', 'Should have environment string');
  });

  await testAsync('GET /api/unknown-route → 404 NOT_FOUND JSON', async () => {
    const { status, body } = await GET('/api/unknown-route');
    assertEqual(status, 404);
    assertEqual(body.status, 'error');
    assertEqual(body.code, 'NOT_FOUND');
    assert(body.message, 'Should have a message');
  });

  await testAsync('GET /api/deeply/nested/missing → 404 NOT_FOUND JSON', async () => {
    const { status, body } = await GET('/api/deeply/nested/missing');
    assertEqual(status, 404);
    assertEqual(body.code, 'NOT_FOUND');
  });

  await testAsync('POST with malformed JSON → 400 BAD_JSON', async () => {
    const { status, body } = await POST_RAW('/api/_test/validate', '{not valid json');
    assertEqual(status, 400);
    assertEqual(body.status, 'error');
    assertEqual(body.code, 'BAD_JSON');
    assert(body.message.toLowerCase().includes('json'), 'Message should mention JSON');
  });

  await testAsync('POST /api/_test/validate valid body → 200', async () => {
    const { status, body } = await POST('/api/_test/validate', { title: 'My Valid Title', url: 'https://example.com' });
    assertEqual(status, 200);
    assertEqual(body.status, 'ok');
  });

  await testAsync('POST /api/_test/validate missing required title → 422 VALIDATION_ERROR with details', async () => {
    const { status, body } = await POST('/api/_test/validate', { url: 'https://example.com' });
    assertEqual(status, 422);
    assertEqual(body.status, 'error');
    assertEqual(body.code, 'VALIDATION_ERROR');
    assert(Array.isArray(body.details), 'Should have details array');
    assert(body.details.length > 0, 'Should have at least one error detail');
    const titleErr = body.details.find((d) => d.field === 'title');
    assert(titleErr, 'Should have error for title field');
    assert(titleErr.message, 'Error detail should have message');
  });

  await testAsync('POST /api/_test/validate title too short (2 chars, min 3) → 422', async () => {
    const { status, body } = await POST('/api/_test/validate', { title: 'Hi' });
    assertEqual(status, 422);
    assertEqual(body.code, 'VALIDATION_ERROR');
    const titleErr = body.details.find((d) => d.field === 'title');
    assert(titleErr, 'Should have error for title field');
    assert(titleErr.message.includes('3'), 'Error should mention minimum length of 3');
  });

  await testAsync('POST /api/_test/validate title too long (81 chars, max 80) → 422', async () => {
    const { status, body } = await POST('/api/_test/validate', { title: 'A'.repeat(81) });
    assertEqual(status, 422);
    assertEqual(body.code, 'VALIDATION_ERROR');
    const titleErr = body.details.find((d) => d.field === 'title');
    assert(titleErr, 'Should have error for title field');
    assert(titleErr.message.includes('80'), 'Error should mention max length of 80');
  });

  await testAsync('POST /api/_test/validate invalid URL pattern (ftp://) → 422', async () => {
    const { status, body } = await POST('/api/_test/validate', { title: 'Valid Title', url: 'ftp://bad-scheme.com' });
    assertEqual(status, 422);
    assertEqual(body.code, 'VALIDATION_ERROR');
    const urlErr = body.details.find((d) => d.field === 'url');
    assert(urlErr, 'Should have error for url field');
  });

  await testAsync('POST /api/_test/validate optional url absent → 200 (not required)', async () => {
    const { status } = await POST('/api/_test/validate', { title: 'Valid Title' });
    assertEqual(status, 200);
  });

  await testAsync('POST /api/_test/validate empty body {} → 422 (title required)', async () => {
    const { status, body } = await POST('/api/_test/validate', {});
    assertEqual(status, 422);
    assertEqual(body.code, 'VALIDATION_ERROR');
  });

  await testAsync('validation: multiple fields fail simultaneously', async () => {
    // title too short AND url bad scheme — both errors should appear at once
    const { status, body } = await POST('/api/_test/validate', { title: 'Hi', url: 'javascript:alert(1)' });
    assertEqual(status, 422);
    assert(body.details.length >= 2, `Expected ≥2 errors, got ${body.details.length}`);
  });

  await testAsync('GET /api/_test/error → 418 TEST_ERROR (known AppError)', async () => {
    const { status, body } = await GET('/api/_test/error');
    assertEqual(status, 418);
    assertEqual(body.status, 'error');
    assertEqual(body.code, 'TEST_ERROR');
    assert(body.message, 'Should have a message');
  });

  await testAsync('AppError in development includes stack trace in response', async () => {
    const { body } = await GET('/api/_test/error');
    assert(body.stack, 'Stack trace should be present in development mode');
  });

  await testAsync('GET /api/_test/unexpected → 500 INTERNAL_ERROR', async () => {
    const { status, body } = await GET('/api/_test/unexpected');
    assertEqual(status, 500);
    assertEqual(body.status, 'error');
    assert(body.code, 'Should have error code');
    assert(body.message, 'Should have a message');
  });

  await testAsync('All error responses have status:"error", code, message', async () => {
    const responses = await Promise.all([
      GET('/api/no-such-route'),
      POST('/api/_test/validate', {}),
      GET('/api/_test/error'),
    ]);
    for (const { body } of responses) {
      assertEqual(body.status, 'error', `Expected status:"error", got: ${JSON.stringify(body)}`);
      assert(typeof body.code === 'string' && body.code.length > 0, 'code must be non-empty string');
      assert(typeof body.message === 'string' && body.message.length > 0, 'message must be non-empty string');
    }
  });

  await testAsync('POST with body > 1 MB → 413 PAYLOAD_TOO_LARGE', async () => {
    const largeBody = JSON.stringify({ title: 'X'.repeat(1_100_000) });
    const { status, body } = await POST_RAW('/api/_test/validate', largeBody);
    assertEqual(status, 413);
    assertEqual(body.code, 'PAYLOAD_TOO_LARGE');
  });

  // ─── Print results ───────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  PROMPT 16 — Middleware Integration Tests');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} [${r.status}] ${r.name}`);
    if (r.error) console.log(`         → ${r.error}`);
  }

  console.log('\n───────────────────────────────────────────────────────');
  console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
  console.log('───────────────────────────────────────────────────────\n');

  server.close(() => {
    if (failed > 0) {
      console.error(`  ✗ ${failed} test(s) failed.\n`);
      process.exit(1);
    } else {
      console.log(`  All ${passed} middleware tests passed.\n`);
      process.exit(0);
    }
  });
});
