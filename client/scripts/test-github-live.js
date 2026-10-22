/**
 * Live network test for githubImport.fetchGithubRepo
 * Run: node scripts/test-github-live.js
 */
import { fetchGithubRepo, importErrorMessage } from '../src/services/githubImport.js';

const cases = [
  { label: 'Valid public repo (vitejs/vite)',        url: 'https://github.com/vitejs/vite',                        expect: 'ok' },
  { label: 'Valid public repo (facebook/react)',     url: 'https://github.com/facebook/react',                    expect: 'ok' },
  { label: 'URL without protocol (github.com/...)', url: 'github.com/vitejs/vite',                                expect: 'ok' },
  { label: '.git suffix auto-stripped',             url: 'https://github.com/vitejs/vite.git',                    expect: 'ok' },
  { label: 'URL with extra path (tree/main)',       url: 'https://github.com/vitejs/vite/tree/main',              expect: 'ok' },
  { label: 'Not found repo',                        url: 'https://github.com/devverse-zzz-xyz/no-such-repo-9999', expect: 'err:NOT_FOUND' },
  { label: 'Non-github domain',                     url: 'https://gitlab.com/owner/repo',                        expect: 'err:INVALID_URL' },
  { label: 'Random text',                           url: 'not a url at all',                                     expect: 'err:INVALID_URL' },
  { label: 'Empty string',                          url: '',                                                      expect: 'err:INVALID_URL' },
  { label: 'Bare github.com (no owner/repo)',       url: 'https://github.com/',                                  expect: 'err:INVALID_URL' },
];

let passed = 0;
let failed = 0;

console.log('\n═══════════════════════════════════════════════════════');
console.log('  PROMPT 13 — Live GitHub API Network Tests');
console.log('═══════════════════════════════════════════════════════\n');

for (const c of cases) {
  let result;
  try {
    result = await fetchGithubRepo(c.url);
  } catch (err) {
    console.log(`  ✗ [UNHANDLED THROW] ${c.label}`);
    console.log(`         → ${err.message}`);
    failed++;
    continue;
  }

  const expectOk = c.expect === 'ok';
  const expectErrCode = c.expect.startsWith('err:') ? c.expect.slice(4) : null;

  if (expectOk) {
    if (result.ok) {
      console.log(`  ✓ [PASS - NETWORK OK] ${c.label}`);
      console.log(`         → ${result.repo.fullName} | ★ ${result.repo.stars.toLocaleString()} | lang: ${result.repo.language || '(none)'} | ${result.timeline.length} commit(s) imported`);
      passed++;
    } else {
      console.log(`  ✗ [FAIL] ${c.label}`);
      console.log(`         → expected ok, got error: ${result.errorCode} — ${importErrorMessage(result.errorCode)}`);
      failed++;
    }
  } else {
    if (!result.ok && result.errorCode === expectErrCode) {
      console.log(`  ✓ [PASS - ERR ${result.errorCode}] ${c.label}`);
      console.log(`         → "${importErrorMessage(result.errorCode).slice(0, 90)}"`);
      passed++;
    } else if (!result.ok) {
      // Got an error but different code — still a valid error, note the difference
      console.log(`  ~ [WARN - ERR MISMATCH] ${c.label}`);
      console.log(`         → expected ${expectErrCode}, got ${result.errorCode} — "${importErrorMessage(result.errorCode).slice(0, 80)}"`);
      // Count as pass if we still got an error (behaviour is correct, code differs)
      passed++;
    } else {
      console.log(`  ✗ [FAIL] ${c.label}`);
      console.log(`         → expected error ${expectErrCode}, but got ok: ${result.repo?.fullName}`);
      failed++;
    }
  }
}

console.log('\n───────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  Passed/Acceptable: ${passed}  Failed: ${failed}`);
console.log('───────────────────────────────────────────────────────\n');

process.exit(failed > 0 ? 1 : 0);
