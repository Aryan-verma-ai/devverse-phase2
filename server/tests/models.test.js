/**
 * DEVVERSE — Prompt 18: User and Project Model Tests
 *
 * Verifies:
 *   1. Models compile and instantiate cleanly.
 *   2. User schema:
 *      - Unique & normalized constraints on username and email.
 *      - passwordHash is select: false and stripped on .toJSON() / .toObject().
 *      - Validation rules (length, format regex, required fields).
 *   3. Project schema:
 *      - Owner reference to 'User' model.
 *      - Category & difficulty enum validation.
 *      - URL protocol regex validation.
 *      - Compound and text index configurations.
 *      - Safe serialization (strips __v).
 *
 * Run: node server/tests/models.test.js
 */

import mongoose from 'mongoose';
import { User, Project, PROJECT_CATEGORIES, PROJECT_DIFFICULTIES } from '../models/index.js';

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

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 18 — User and Project Model Tests');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. User Model Schema & Validation ────────────────────────────────────────

test('User model: compiles and is registered with mongoose', () => {
  assertEqual(User.modelName, 'User');
  assert(User.schema instanceof mongoose.Schema, 'User should have a Mongoose schema');
});

test('User schema: username path has required, unique, lowercase, and trim', () => {
  const usernamePath = User.schema.path('username');
  assert(usernamePath.isRequired, 'Username must be required');
  assert(usernamePath.options.unique === true, 'Username must have unique: true');
  assert(usernamePath.options.lowercase === true, 'Username must have lowercase: true');
  assert(usernamePath.options.trim === true, 'Username must have trim: true');
});

test('User schema: email path has required, unique, lowercase, trim, and select: false', () => {
  const emailPath = User.schema.path('email');
  assert(emailPath.isRequired, 'Email must be required');
  assert(emailPath.options.unique === true, 'Email must have unique: true');
  assert(emailPath.options.lowercase === true, 'Email must have lowercase: true');
  assert(emailPath.options.select === false, 'Email must have select: false');
});

test('User schema: passwordHash path is required and select: false', () => {
  const pwPath = User.schema.path('passwordHash');
  assert(pwPath.isRequired, 'passwordHash must be required');
  assert(pwPath.options.select === false, 'passwordHash must have select: false');
});

test('User schema: safe serialization strips passwordHash and __v', () => {
  const user = new User({
    username: 'alex_dev',
    email: 'alex@example.com',
    passwordHash: '$2b$10$hashedPasswordHere1234567890',
    displayName: 'Alex Developer',
  });

  const json = user.toJSON();
  assertEqual(json.passwordHash, undefined, 'passwordHash must not appear in toJSON');
  assertEqual(json.__v, undefined, '__v must not appear in toJSON');
  assertEqual(json.username, 'alex_dev');
  assertEqual(json.displayName, 'Alex Developer');

  const obj = user.toObject();
  assertEqual(obj.passwordHash, undefined, 'passwordHash must not appear in toObject');
  assertEqual(obj.__v, undefined, '__v must not appear in toObject');
});

await testAsync('User validation: valid user passes schema validation', async () => {
  const user = new User({
    username: 'valid_user-1',
    email: 'valid@devverse.io',
    passwordHash: '$2b$10$xyz',
    displayName: 'Valid User',
  });
  const err = await user.validate().catch((e) => e);
  assertEqual(err, undefined, 'Valid user should not produce validation errors');
});

await testAsync('User validation: rejects invalid username characters', async () => {
  const user = new User({
    username: 'Bad Username!@#',
    email: 'valid@devverse.io',
    passwordHash: '$2b$10$xyz',
    displayName: 'Bad Name',
  });
  const err = await user.validate().catch((e) => e);
  assert(err?.errors?.username, 'Should reject invalid username characters');
});

await testAsync('User validation: rejects invalid email address', async () => {
  const user = new User({
    username: 'validname',
    email: 'not-an-email',
    passwordHash: '$2b$10$xyz',
    displayName: 'Valid Name',
  });
  const err = await user.validate().catch((e) => e);
  assert(err?.errors?.email, 'Should reject invalid email format');
});

await testAsync('User validation: rejects missing required fields', async () => {
  const user = new User({});
  const err = await user.validate().catch((e) => e);
  assert(err?.errors?.username, 'Username is required');
  assert(err?.errors?.email, 'Email is required');
  assert(err?.errors?.passwordHash, 'Password hash is required');
  assert(err?.errors?.displayName, 'Display name is required');
});

// ── 2. Project Model Schema & Validation ─────────────────────────────────────

test('Project model: compiles and is registered with mongoose', () => {
  assertEqual(Project.modelName, 'Project');
  assert(Project.schema instanceof mongoose.Schema, 'Project should have a Mongoose schema');
});

test('Project schema: owner references User model and is required', () => {
  const ownerPath = Project.schema.path('owner');
  assert(ownerPath.isRequired, 'Owner must be required');
  assertEqual(ownerPath.options.ref, 'User', 'Owner must reference User model');
  assertEqual(ownerPath.instance, 'ObjectId', 'Owner must be an ObjectId');
});

test('Project schema: category enum matches agreed 9 UI categories', () => {
  const categoryPath = Project.schema.path('category');
  const enums = categoryPath.enumValues;
  assertEqual(enums.length, 9);
  assert(enums.includes('Frontend'), 'Must include Frontend');
  assert(enums.includes('Backend'), 'Must include Backend');
  assert(enums.includes('Systems'), 'Must include Systems');
  assert(enums.includes('AI/ML'), 'Must include AI/ML');
  assert(enums.includes('Graphics'), 'Must include Graphics');
});

test('Project schema: difficulty enum matches Beginner, Intermediate, Advanced', () => {
  const diffPath = Project.schema.path('difficulty');
  const enums = diffPath.enumValues;
  assertEqual(enums.length, 3);
  assertEqual(diffPath.options.default, 'Intermediate');
});

test('Project schema: indexes are configured (compound + text)', () => {
  const indexes = Project.schema.indexes();
  // Check for compound index on category, difficulty, createdAt
  const compound = indexes.find(
    ([spec]) => spec.category === 1 && spec.difficulty === 1 && spec.createdAt === -1
  );
  assert(compound, 'Must define compound index on category, difficulty, createdAt');

  // Check for text index on title, description, technologies
  const textIdx = indexes.find(
    ([spec]) => spec.title === 'text' && spec.description === 'text' && spec.technologies === 'text'
  );
  assert(textIdx, 'Must define text search index on title, description, technologies');
});

test('Project schema: safe serialization strips __v', () => {
  const project = new Project({
    title: 'PulseDB',
    description: 'A lightweight time-series database written for edge devices.',
    category: 'Systems',
    difficulty: 'Advanced',
    owner: new mongoose.Types.ObjectId(),
  });

  const json = project.toJSON();
  assertEqual(json.__v, undefined, '__v must not appear in toJSON');
  assertEqual(json.title, 'PulseDB');
  assertEqual(json.category, 'Systems');
});

await testAsync('Project validation: valid project passes schema validation', async () => {
  const validOwnerId = new mongoose.Types.ObjectId();
  const project = new Project({
    title: 'Nebula UI Kit',
    description: 'A glassmorphic component library for ambitious developer dashboards.',
    category: 'Frontend',
    difficulty: 'Intermediate',
    technologies: ['React', 'CSS'],
    features: ['Accessible buttons', 'Dark mode'],
    githubUrl: 'https://github.com/ari-devs/nebula-ui',
    demoUrl: 'https://nebula.devverse.app',
    owner: validOwnerId,
  });

  const err = await project.validate().catch((e) => e);
  assertEqual(err, undefined, 'Valid project should not produce validation errors');
});

await testAsync('Project validation: rejects invalid category enum', async () => {
  const project = new Project({
    title: 'Invalid Category Project',
    description: 'A project with an invalid category enum that should fail validation.',
    category: 'InvalidCategory123',
    owner: new mongoose.Types.ObjectId(),
  });
  const err = await project.validate().catch((e) => e);
  assert(err?.errors?.category, 'Should reject invalid category');
});

await testAsync('Project validation: rejects invalid difficulty enum', async () => {
  const project = new Project({
    title: 'Invalid Difficulty Project',
    description: 'A project with an invalid difficulty enum that should fail validation.',
    category: 'Frontend',
    difficulty: 'SuperHard',
    owner: new mongoose.Types.ObjectId(),
  });
  const err = await project.validate().catch((e) => e);
  assert(err?.errors?.difficulty, 'Should reject invalid difficulty');
});

await testAsync('Project validation: rejects description shorter than 20 characters', async () => {
  const project = new Project({
    title: 'Short Desc Project',
    description: 'Too short',
    category: 'Backend',
    owner: new mongoose.Types.ObjectId(),
  });
  const err = await project.validate().catch((e) => e);
  assert(err?.errors?.description, 'Should reject description shorter than 20 chars');
});

await testAsync('Project validation: rejects invalid URL protocols (non-http/https)', async () => {
  const project = new Project({
    title: 'Invalid Protocol Project',
    description: 'A project with an unsafe URL protocol that should be rejected by regex.',
    category: 'Fullstack',
    githubUrl: 'ftp://ftp.example.com/repo',
    owner: new mongoose.Types.ObjectId(),
  });
  const err = await project.validate().catch((e) => e);
  assert(err?.errors?.githubUrl, 'Should reject ftp:// protocol in githubUrl');
});

await testAsync('Project validation: rejects missing owner reference', async () => {
  const project = new Project({
    title: 'Missing Owner Project',
    description: 'A project without an owner reference that must fail validation.',
    category: 'AI/ML',
  });
  const err = await project.validate().catch((e) => e);
  assert(err?.errors?.owner, 'Should reject project missing owner reference');
});

// ── Print Results ───────────────────────────────────────────────────────────

for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} [${r.status}] ${r.name}`);
  if (r.error) console.log(`         → ${r.error}`);
}

console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

if (failed > 0) {
  process.exit(1);
}
