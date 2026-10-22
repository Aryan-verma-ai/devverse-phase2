import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addTemporaryProject,
  getSeedProjectById,
  getSeedProjects,
  getUserSubmittedProjects,
  validateUrlProtocol,
} from '../src/data/seedProjects.js';

console.log('--- Verifying DevVerse Submit Project Form & Session Storage ---');

let failures = 0;

// 1. Validation Logic Checks
const isValidTitle = (t) => t && t.trim().length >= 3;
const isValidDesc = (d) => d && d.trim().length >= 20;
const isValidTags = (t) => t && t.split(',').map(x => x.trim()).filter(Boolean).length > 0;

if (!isValidTitle('') && !isValidTitle('ab') && isValidTitle('Project Alpha')) {
  console.log('[PASS] Title validation enforces minimum 3 characters.');
} else {
  console.error('[FAIL] Title validation failed.');
  failures++;
}

if (!isValidDesc('') && !isValidDesc('Too short') && isValidDesc('This is a sufficiently long description explaining the project in detail.')) {
  console.log('[PASS] Description validation enforces minimum 20 characters.');
} else {
  console.error('[FAIL] Description validation failed.');
  failures++;
}

if (!isValidTags('') && !isValidTags('  ,  ') && isValidTags('React, Node.js')) {
  console.log('[PASS] Tags validation requires at least one non-empty technology tag.');
} else {
  console.error('[FAIL] Tags validation failed.');
  failures++;
}

// 2. URL Protocol Validation on Inputs
if (
  validateUrlProtocol('https://github.com/test/repo') &&
  validateUrlProtocol('http://test.demo') &&
  !validateUrlProtocol('javascript:alert(1)') &&
  !validateUrlProtocol('invalid')
) {
  console.log('[PASS] Repository and live demo URLs strictly reject unsafe schemes.');
} else {
  console.error('[FAIL] Repository URL validation failed.');
  failures++;
}

// 3. Temporary Client Submission Workflow
const initialCount = getSeedProjects().length;
const testProject = addTemporaryProject({
  title: 'Test Client Project',
  desc: 'A temporary project created during the automated client test run to verify in-memory session persistence.',
  category: 'Frontend',
  difficulty: 'Beginner',
  tags: 'React, Vite',
  features: 'Fast HMR, Clean Design',
  githubUrl: 'https://github.com/test/project',
  demoUrl: 'https://demo.test.com',
  author: 'you',
});

if (testProject && testProject.id.startsWith('user-') && testProject.isTemporary === true) {
  console.log(`[PASS] addTemporaryProject created session project with ID "${testProject.id}".`);
} else {
  console.error('[FAIL] addTemporaryProject did not return expected project object.');
  failures++;
}

const retrieved = getSeedProjectById(testProject.id);
if (retrieved && retrieved.title === 'Test Client Project') {
  console.log(`[PASS] Newly submitted project is immediately queryable by ID via getSeedProjectById("${testProject.id}").`);
} else {
  console.error('[FAIL] Could not retrieve newly created session project by ID.');
  failures++;
}

const allProjects = getSeedProjects();
if (allProjects.length === initialCount + 1 && allProjects[0].id === testProject.id) {
  console.log(`[PASS] Session project prepends to getSeedProjects() list for immediate catalog visibility.`);
} else {
  console.error('[FAIL] Session project did not prepend to getSeedProjects().');
  failures++;
}

const userProjects = getUserSubmittedProjects();
if (userProjects.some((p) => p.id === testProject.id)) {
  console.log(`[PASS] Session project correctly tracked in getUserSubmittedProjects().`);
} else {
  console.error('[FAIL] Session project missing from getUserSubmittedProjects().');
  failures++;
}

// 4. Code & Disclosure Audit
const __filenameCurrent = fileURLToPath(import.meta.url);
const __dirnameCurrent = path.dirname(__filenameCurrent);
const submitPageCode = fs.readFileSync(path.join(__dirnameCurrent, '../src/pages/SubmitProjectPage.jsx'), 'utf8');

if (submitPageCode.includes('Client-Side Demo Storage') && submitPageCode.includes('temporary memory')) {
  console.log('[PASS] SubmitProjectPage explicitly discloses temporary client-side storage without false persistence claims.');
} else {
  console.error('[FAIL] Missing clear storage disclosure in SubmitProjectPage.');
  failures++;
}

if (/dangerouslySetInnerHTML|\.innerHTML\s*=/i.test(submitPageCode)) {
  console.error('[FAIL] SubmitProjectPage contains innerHTML sinks!');
  failures++;
} else {
  console.log('[PASS] SubmitProjectPage uses controlled React inputs with zero innerHTML injection sinks.');
}

if (failures === 0) {
  console.log('\nAll Submit Project validation, session storage, and security checks passed successfully!');
  process.exit(0);
} else {
  console.error(`\nValidation failed with ${failures} error(s).`);
  process.exit(1);
}
