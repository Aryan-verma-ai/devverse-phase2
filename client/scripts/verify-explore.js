import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEED_PROJECTS,
  getSeedProjects,
  getSeedProjectById,
  getSeedCategories,
  filterAndSortProjects,
} from '../src/data/seedProjects.js';

console.log('--- Verifying DevVerse Explore & Seed Projects ---');

let failures = 0;

// 1. Verify Canonical Seed Data
if (SEED_PROJECTS.length === 15) {
  console.log(`[PASS] Canonical seed dataset contains exactly 15 projects.`);
} else {
  console.error(`[FAIL] Expected 15 seed projects, found ${SEED_PROJECTS.length}.`);
  failures++;
}

// 2. Immutability Check
const originalSnapshot = JSON.stringify(SEED_PROJECTS);
const initialCopy = getSeedProjects();
filterAndSortProjects(initialCopy, { search: 'react', category: 'Frontend', sort: 'likes' });
const postFilterSnapshot = JSON.stringify(SEED_PROJECTS);

if (originalSnapshot === postFilterSnapshot) {
  console.log('[PASS] Filter and sort operations are strictly immutable (canonical array untouched).');
} else {
  console.error('[FAIL] Filter/sort operation mutated the canonical dataset!');
  failures++;
}

// 3. Filter by Category
const frontendProjects = filterAndSortProjects(SEED_PROJECTS, { category: 'Frontend' });
const allAreFrontend = frontendProjects.every((p) => p.category === 'Frontend');
if (frontendProjects.length > 0 && allAreFrontend) {
  console.log(`[PASS] Category filter ('Frontend') returned ${frontendProjects.length} items, all verified as Frontend.`);
} else {
  console.error('[FAIL] Category filter failed.');
  failures++;
}

// 4. Filter by Difficulty
const advancedProjects = filterAndSortProjects(SEED_PROJECTS, { difficulty: 'Advanced' });
const allAreAdvanced = advancedProjects.every((p) => p.difficulty === 'Advanced');
if (advancedProjects.length > 0 && allAreAdvanced) {
  console.log(`[PASS] Difficulty filter ('Advanced') returned ${advancedProjects.length} items, all verified as Advanced.`);
} else {
  console.error('[FAIL] Difficulty filter failed.');
  failures++;
}

// 5. Combined Filter
const combined = filterAndSortProjects(SEED_PROJECTS, { category: 'Systems', difficulty: 'Advanced' });
const validCombined = combined.every((p) => p.category === 'Systems' && p.difficulty === 'Advanced');
if (combined.length === 2 && validCombined) {
  console.log(`[PASS] Combined filter ('Systems' + 'Advanced') returned exactly ${combined.length} matching items (${combined.map(p => p.title).join(', ')}).`);
} else {
  console.error('[FAIL] Combined filter failed.');
  failures++;
}

// 6. Keyword Search
const searchReact = filterAndSortProjects(SEED_PROJECTS, { search: 'react' });
if (searchReact.length === 1 && searchReact[0].id === 'p1') {
  console.log(`[PASS] Search ('react') returned ${searchReact.length} matching project (${searchReact[0].title}).`);
} else {
  console.error(`[FAIL] Search for 'react' returned unexpected results.`);
  failures++;
}

// 7. Zero Match Search (Empty state trigger)
const emptyResults = filterAndSortProjects(SEED_PROJECTS, { search: 'xyznonexistent123' });
if (emptyResults.length === 0) {
  console.log('[PASS] Zero-match search returns empty array (triggers EmptyState).');
} else {
  console.error('[FAIL] Zero-match search did not return empty array.');
  failures++;
}

// 8. Sorting Verification
const byLikes = filterAndSortProjects(SEED_PROJECTS, { sort: 'likes' });
let likesSorted = true;
for (let i = 0; i < byLikes.length - 1; i++) {
  if (byLikes[i].likes < byLikes[i + 1].likes) {
    likesSorted = false;
    break;
  }
}
if (likesSorted) {
  console.log(`[PASS] Sort by 'likes' is strictly descending (Top: ${byLikes[0].title} with ${byLikes[0].likes} likes).`);
} else {
  console.error('[FAIL] Sort by likes failed.');
  failures++;
}

const byViews = filterAndSortProjects(SEED_PROJECTS, { sort: 'views' });
let viewsSorted = true;
for (let i = 0; i < byViews.length - 1; i++) {
  if (byViews[i].views < byViews[i + 1].views) {
    viewsSorted = false;
    break;
  }
}
if (viewsSorted) {
  console.log(`[PASS] Sort by 'views' is strictly descending (Top: ${byViews[0].title} with ${byViews[0].views} views).`);
} else {
  console.error('[FAIL] Sort by views failed.');
  failures++;
}

// 9. XSS / HTML Injection Audit
const __filenameCurrent = fileURLToPath(import.meta.url);
const __dirnameCurrent = path.dirname(__filenameCurrent);
const explorePageCode = fs.readFileSync(path.join(__dirnameCurrent, '../src/pages/ExplorePage.jsx'), 'utf8');

if (/dangerouslySetInnerHTML|\.innerHTML\s*=/i.test(explorePageCode)) {
  console.error('[FAIL] ExplorePage contains dangerous innerHTML / HTML injection sinks!');
  failures++;
} else {
  console.log('[PASS] ExplorePage uses React declarative JSX exclusively (zero innerHTML/HTML-injection sinks).');
}

if (failures === 0) {
  console.log('\nAll Explore filter, sort, search, and security checks passed successfully!');
  process.exit(0);
} else {
  console.error(`\nValidation failed with ${failures} error(s).`);
  process.exit(1);
}
