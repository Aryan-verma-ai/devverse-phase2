/**
 * DEVVERSE — Prompt 15: Server Structure Verification
 *
 * Tests that all required files exist, contain expected exports/patterns,
 * and that no secrets are committed.
 *
 * This is a static analysis script — it does NOT start the server.
 * Actual HTTP tests are run separately with curl/fetch after `npm run dev:server`.
 *
 * Run: node scripts/verify-server.js  (from repo root)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve('.');
const SERVER = resolve('server');

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

function fileExists(rel) {
  return existsSync(resolve(ROOT, rel));
}

function read(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------

test('server/package.json exists', () => assert(fileExists('server/package.json')));
test('server/index.js exists', () => assert(fileExists('server/index.js')));
test('server/app.js exists', () => assert(fileExists('server/app.js')));
test('server/config/env.js exists', () => assert(fileExists('server/config/env.js')));
test('server/config/database.js exists', () => assert(fileExists('server/config/database.js')));
test('server/models/User.js exists', () => assert(fileExists('server/models/User.js')));
test('server/models/Project.js exists', () => assert(fileExists('server/models/Project.js')));
test('server/models/index.js exists', () => assert(fileExists('server/models/index.js')));
test('server/routes/projects.js exists', () => assert(fileExists('server/routes/projects.js')));
test('server/controllers/projectController.js exists', () => assert(fileExists('server/controllers/projectController.js')));
test('server/services/projectService.js exists', () => assert(fileExists('server/services/projectService.js')));
test('server/validators/projectValidator.js exists', () => assert(fileExists('server/validators/projectValidator.js')));
test('server/middleware/devAuthGuard.js exists', () => assert(fileExists('server/middleware/devAuthGuard.js')));
test('server/routes/auth.js exists', () => assert(fileExists('server/routes/auth.js')));
test('server/controllers/authController.js exists', () => assert(fileExists('server/controllers/authController.js')));
test('server/services/authService.js exists', () => assert(fileExists('server/services/authService.js')));
test('server/validators/authValidator.js exists', () => assert(fileExists('server/validators/authValidator.js')));
test('server/routes/users.js exists', () => assert(fileExists('server/routes/users.js')));
test('server/controllers/userController.js exists', () => assert(fileExists('server/controllers/userController.js')));
test('server/services/userService.js exists', () => assert(fileExists('server/services/userService.js')));
test('server/validators/userValidator.js exists', () => assert(fileExists('server/validators/userValidator.js')));
test('server/middleware/auth.js exists', () => assert(fileExists('server/middleware/auth.js')));
test('server/utils/session.js exists', () => assert(fileExists('server/utils/session.js')));
test('docs/AUTH-DESIGN-DECISION.md exists', () => assert(fileExists('docs/AUTH-DESIGN-DECISION.md')));
test('.env.example exists at repo root', () => assert(fileExists('.env.example')));
test('.gitignore exists at repo root', () => assert(fileExists('.gitignore')));

// ---------------------------------------------------------------------------
// server/package.json checks
// ---------------------------------------------------------------------------

const serverPkg = JSON.parse(read('server/package.json'));

test('server/package.json: type is "module" (ES modules)', () => {
  assert(serverPkg.type === 'module', `Expected "module", got "${serverPkg.type}"`);
});

test('server/package.json: has express dependency', () => {
  assert(serverPkg.dependencies?.express, 'express not listed in dependencies');
});

test('server/package.json: has dotenv dependency', () => {
  assert(serverPkg.dependencies?.dotenv, 'dotenv not listed in dependencies');
});

test('server/package.json: has start script (node index.js)', () => {
  assert(serverPkg.scripts?.start, 'Missing start script');
  assert(serverPkg.scripts.start.includes('index.js'), 'start should run index.js');
});

test('server/package.json: has dev script (nodemon)', () => {
  assert(serverPkg.scripts?.dev, 'Missing dev script');
  assert(serverPkg.scripts.dev.includes('nodemon'), 'dev should use nodemon');
});

// ---------------------------------------------------------------------------
// server/app.js checks
// ---------------------------------------------------------------------------

const appSrc = read('server/app.js');

test('app.js: imports express', () => {
  assert(appSrc.includes("from 'express'"), 'Missing express import');
});

test('app.js: imports cors', () => {
  assert(appSrc.includes("from 'cors'"), 'Missing cors import');
});

test('app.js: imports env config', () => {
  assert(appSrc.includes("from './config/env.js'"), 'Missing env config import');
});

test('app.js: defines GET /api/health route', () => {
  assert(appSrc.includes('/api/health'), 'Missing /api/health route');
});

test('app.js: health route returns 200', () => {
  assert(appSrc.includes('res.status(200)') || appSrc.includes("status: 'ok'"), 'Health response should include status ok');
});

test('app.js: has unknown /api 404 handler', () => {
  assert(
    appSrc.includes("app.use('/api'") && appSrc.includes('404'),
    'Missing /api catch-all 404 handler'
  );
});

test('app.js: 404 response is JSON (not HTML)', () => {
  assert(appSrc.includes('.json('), 'Unknown /api route should respond with JSON');
});

// Error handler was extracted to middleware/errorHandler.js in Prompt 16.
const errorHandlerSrc = read('server/middleware/errorHandler.js');

test('errorHandler.js: has 4-argument error handler (err, req, res, next)', () => {
  assert(
    errorHandlerSrc.includes('(err,') || errorHandlerSrc.includes('(err, '),
    'Missing Express 4-argument error handler in errorHandler.js'
  );
});

test('errorHandler.js: does NOT expose stack trace in production', () => {
  assert(
    errorHandlerSrc.includes('production') && errorHandlerSrc.includes('stack'),
    'Error handler should conditionally include stack trace (dev only)'
  );
});

test('app.js: exports default app', () => {
  assert(appSrc.includes('export default app'), 'app.js must export default app');
});

// ---------------------------------------------------------------------------
// server/index.js checks
// ---------------------------------------------------------------------------

const indexSrc = read('server/index.js');

test('index.js: imports app from app.js', () => {
  assert(indexSrc.includes("from './app.js'"), 'index.js must import from app.js');
});

test('index.js: imports env config', () => {
  assert(indexSrc.includes("from './config/env.js'"), 'index.js must import env config');
});

test('index.js: calls app.listen', () => {
  assert(indexSrc.includes('app.listen'), 'index.js must call app.listen');
});

test('index.js: handles SIGTERM for graceful shutdown', () => {
  assert(indexSrc.includes('SIGTERM'), 'index.js must handle SIGTERM');
});

test('index.js: handles SIGINT for graceful shutdown', () => {
  assert(indexSrc.includes('SIGINT'), 'index.js must handle SIGINT');
});

test('index.js: handles unhandledRejection', () => {
  assert(indexSrc.includes('unhandledRejection'), 'index.js must handle unhandledRejection');
});

// ---------------------------------------------------------------------------
// server/config/env.js checks
// ---------------------------------------------------------------------------

const envSrc = read('server/config/env.js');

test('config/env.js: loads dotenv', () => {
  assert(envSrc.includes('dotenv'), 'env.js must import/load dotenv');
});

test('config/env.js: exports default env object', () => {
  assert(envSrc.includes('export default env'), 'env.js must export default env');
});

test('config/env.js: includes PORT', () => {
  assert(envSrc.includes('PORT'), 'env.js must expose PORT');
});

test('config/env.js: includes NODE_ENV', () => {
  assert(envSrc.includes('NODE_ENV'), 'env.js must expose NODE_ENV');
});

test('config/env.js: exports frozen object (Object.freeze)', () => {
  assert(envSrc.includes('Object.freeze'), 'env should be frozen to prevent mutation');
});

// ---------------------------------------------------------------------------
// .env.example checks — must exist with placeholders, NO real values
// ---------------------------------------------------------------------------

const envExample = read('.env.example');

test('.env.example: documents PORT', () => assert(envExample.includes('PORT='), '.env.example must document PORT'));
test('.env.example: documents NODE_ENV', () => assert(envExample.includes('NODE_ENV='), '.env.example must document NODE_ENV'));
test('.env.example: documents MONGODB_URI', () => assert(envExample.includes('MONGODB_URI='), '.env.example must document MONGODB_URI'));
test('.env.example: documents SESSION_SECRET', () => assert(envExample.includes('SESSION_SECRET='), '.env.example must document SESSION_SECRET'));

test('.env.example: does NOT contain a real MongoDB Atlas URI', () => {
  assert(!envExample.includes('mongodb+srv://') || envExample.includes('<user>'),
    '.env.example should not contain a real Atlas connection string');
});

test('.env.example: SESSION_SECRET is empty (no real secret committed)', () => {
  const match = envExample.match(/SESSION_SECRET=(.+)/);
  // Should be absent or empty after the =
  if (match) {
    assert(match[1].trim() === '', 'SESSION_SECRET must be empty in .env.example');
  }
});

// ---------------------------------------------------------------------------
// .gitignore checks
// ---------------------------------------------------------------------------

const gitignore = read('.gitignore');

test('.gitignore: ignores .env', () => assert(gitignore.includes('.env'), '.gitignore must ignore .env'));
test('.gitignore: does NOT ignore .env.example', () => {
  // .env.example must NOT be in .gitignore
  const lines = gitignore.split('\n').map(l => l.trim()).filter(l => !l.startsWith('#'));
  assert(!lines.includes('.env.example'), '.env.example must NOT be in .gitignore — it should stay in git');
});
test('.gitignore: ignores node_modules', () => assert(gitignore.includes('node_modules'), '.gitignore must ignore node_modules'));
test('.gitignore: ignores server/uploads', () => assert(gitignore.includes('server/uploads'), '.gitignore should ignore server/uploads'));
test('.gitignore: ignores coverage output', () => assert(gitignore.includes('coverage'), '.gitignore should ignore coverage/'));

// ---------------------------------------------------------------------------
// Security: no real secrets in tracked files
// ---------------------------------------------------------------------------

const filesToScan = [
  'server/app.js',
  'server/index.js',
  'server/config/env.js',
  'server/config/database.js',
  'server/models/User.js',
  'server/models/Project.js',
  'server/routes/projects.js',
  'server/controllers/projectController.js',
  'server/services/projectService.js',
  'server/validators/projectValidator.js',
  'server/middleware/devAuthGuard.js',
  'server/routes/auth.js',
  'server/controllers/authController.js',
  'server/services/authService.js',
  'server/validators/authValidator.js',
  'server/routes/users.js',
  'server/controllers/userController.js',
  'server/services/userService.js',
  'server/validators/userValidator.js',
  'server/middleware/auth.js',
  'server/utils/session.js',
];
const suspiciousPatterns = [
  /mongodb\+srv:\/\/[^<\s]+:[^<\s]+@/i,   // real Atlas URI
  /password\s*[:=]\s*['"][^'"]{4,}/i,       // hardcoded password
  /secret\s*[:=]\s*['"][a-zA-Z0-9+/]{8,}/i, // hardcoded secret
];

for (const file of filesToScan) {
  test(`No hardcoded secrets in ${file}`, () => {
    const src = read(file);
    for (const pattern of suspiciousPatterns) {
      assert(!pattern.test(src), `Suspicious pattern found in ${file}: ${pattern}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Root package.json workspace checks
// ---------------------------------------------------------------------------

const rootPkg = JSON.parse(read('package.json'));

test('root package.json: includes "server" in workspaces', () => {
  assert(
    Array.isArray(rootPkg.workspaces) && rootPkg.workspaces.includes('server'),
    'root package.json must list "server" in workspaces'
  );
});

test('root package.json: has dev:server script', () => {
  assert(rootPkg.scripts?.['dev:server'], 'Missing dev:server script in root package.json');
});

test('root package.json: has concurrently for combined dev', () => {
  assert(
    rootPkg.devDependencies?.concurrently || rootPkg.scripts?.dev?.includes('concurrently'),
    'root should use concurrently for running both client and server'
  );
});

// ---------------------------------------------------------------------------
// Print results
// ---------------------------------------------------------------------------

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 15 — Server Structure Verification');
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
  console.log(`  All ${passed} static checks passed.\n`);
}
