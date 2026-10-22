import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getSeedProjectById,
  getSeedAuthor,
  getRelatedProjects,
  validateUrlProtocol,
} from '../src/data/seedProjects.js';

console.log('--- Verifying DevVerse Project Detail & Navigation ---');

let failures = 0;

// 1. Direct Project Lookup
const p1 = getSeedProjectById('p1');
if (p1 && p1.title === 'Nebula UI Kit' && p1.category === 'Frontend') {
  console.log(`[PASS] Direct project lookup ('p1') retrieved: "${p1.title}" (${p1.category}, author: ${p1.author}).`);
} else {
  console.error('[FAIL] Direct lookup for p1 failed.');
  failures++;
}

// 2. Unknown Project Lookup (Graceful Not-Found)
const pUnknown = getSeedProjectById('unknown-999');
if (pUnknown === null) {
  console.log('[PASS] Unknown project ID returns null, correctly triggering the EmptyState component.');
} else {
  console.error('[FAIL] Unknown project lookup did not return null.');
  failures++;
}

// 3. Author Information Resolution
const author = getSeedAuthor(p1.author);
if (author && author.name === 'Ari Solano' && author.skills.includes('React')) {
  console.log(`[PASS] Author resolved successfully: ${author.name} (@${author.handle}).`);
} else {
  console.error('[FAIL] Author resolution failed.');
  failures++;
}

// 4. Related Projects Resolution
const related = getRelatedProjects('p1', 3);
const containsSelf = related.some((r) => r.id === 'p1');
if (related.length === 3 && !containsSelf) {
  console.log(`[PASS] Related projects for p1 returned 3 items excluding p1 (${related.map(r => r.id).join(', ')}).`);
} else {
  console.error('[FAIL] Related projects resolution failed.');
  failures++;
}

// 5. External Link Protocol Validation & XSS Prevention
const safeHttps = validateUrlProtocol('https://github.com/ari-devs/nebula-ui');
const safeHttp = validateUrlProtocol('http://example.com/demo');
const dangerousJs = validateUrlProtocol('javascript:alert(document.cookie)');
const dangerousData = validateUrlProtocol('data:text/html,<script>alert(1)</script>');
const dangerousVb = validateUrlProtocol('vbscript:msgbox(1)');
const malformed = validateUrlProtocol('invalid-uri-scheme');

if (
  safeHttps === 'https://github.com/ari-devs/nebula-ui' &&
  safeHttp === 'http://example.com/demo' &&
  dangerousJs === null &&
  dangerousData === null &&
  dangerousVb === null &&
  malformed === null
) {
  console.log('[PASS] URL protocol validation strictly allows http/https and blocks dangerous schemes (javascript:, data:, vbscript:).');
} else {
  console.error('[FAIL] URL protocol validator did not correctly sanitize dangerous schemes.');
  failures++;
}

// 6. ProjectDetailPage Security and External Link Safety Audit
const __filenameCurrent = fileURLToPath(import.meta.url);
const __dirnameCurrent = path.dirname(__filenameCurrent);
const detailPageCode = fs.readFileSync(path.join(__dirnameCurrent, '../src/pages/ProjectDetailPage.jsx'), 'utf8');

if (/dangerouslySetInnerHTML|\.innerHTML\s*=/i.test(detailPageCode)) {
  console.error('[FAIL] ProjectDetailPage contains dangerous innerHTML / HTML injection sinks!');
  failures++;
} else {
  console.log('[PASS] ProjectDetailPage uses declarative React JSX with zero innerHTML injection sinks.');
}

if (detailPageCode.includes('rel="noopener noreferrer"')) {
  console.log('[PASS] External repository and demo links enforce rel="noopener noreferrer" for security.');
} else {
  console.error('[FAIL] Missing rel="noopener noreferrer" on external links.');
  failures++;
}

if (failures === 0) {
  console.log('\nAll Project Detail data, navigation, and security checks passed successfully!');
  process.exit(0);
} else {
  console.error(`\nValidation failed with ${failures} error(s).`);
  process.exit(1);
}
