import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appJsxPath = path.join(__dirname, '../src/App.jsx');
const appContent = fs.readFileSync(appJsxPath, 'utf8');

const expectedRoutes = [
  '/',
  '/explore',
  '/projects/:id',
  '/submit-project',
  '/communities',
  '/communities/:id',
  '/hackathons',
  '/hackathons/:id',
  '/squads',
  '/portfolio',
  '/profile',
  '/leaderboard',
  '/codex',
  '/settings',
  '/login',
  '/signup',
];

const legacyRedirects = [
  { from: '/index.html', to: '/' },
  { from: '/explore.html', to: '/explore' },
  { from: '/project.html', to: '/explore' },
  { from: '/submit-project.html', to: '/submit-project' },
  { from: '/communities.html', to: '/communities' },
  { from: '/community.html', to: '/communities' },
  { from: '/hackathons.html', to: '/hackathons' },
  { from: '/hackathon.html', to: '/hackathons' },
  { from: '/squads.html', to: '/squads' },
  { from: '/portfolio.html', to: '/portfolio' },
  { from: '/profile.html', to: '/profile' },
  { from: '/leaderboard.html', to: '/leaderboard' },
  { from: '/codex.html', to: '/codex' },
  { from: '/settings.html', to: '/settings' },
  { from: '/login.html', to: '/login' },
  { from: '/signup.html', to: '/signup' },
];

console.log('--- Verifying DevVerse React Router Configuration ---');

let failures = 0;

for (const route of expectedRoutes) {
  const pattern = new RegExp(`path=["']${route}["']`);
  if (pattern.test(appContent)) {
    console.log(`[PASS] Route registered: ${route}`);
  } else {
    console.error(`[FAIL] Missing expected route: ${route}`);
    failures++;
  }
}

for (const redirect of legacyRedirects) {
  const pattern = new RegExp(`path=["']${redirect.from}["'][^>]*element={<Navigate to=["']${redirect.to}["']`);
  if (pattern.test(appContent)) {
    console.log(`[PASS] Legacy redirect: ${redirect.from} -> ${redirect.to}`);
  } else {
    console.error(`[FAIL] Missing redirect: ${redirect.from} -> ${redirect.to}`);
    failures++;
  }
}

if (appContent.includes('path="*"')) {
  console.log('[PASS] Wildcard 404 fallback route registered');
} else {
  console.error('[FAIL] Missing wildcard 404 fallback route');
  failures++;
}

if (failures === 0) {
  console.log('\nAll 16 destinations, 16 legacy redirects, and 404 fallback verified successfully!');
  process.exit(0);
} else {
  console.error(`\nValidation failed with ${failures} error(s).`);
  process.exit(1);
}
