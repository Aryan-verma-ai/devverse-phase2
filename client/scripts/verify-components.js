import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiDir = path.join(__dirname, '../src/components/ui');

console.log('--- Verifying DevVerse Shared UI Primitives ---');

let failures = 0;

// 1. Verify ProjectCard does not secretly fetch or touch global data
const projectCardCode = fs.readFileSync(path.join(uiDir, 'ProjectCard.jsx'), 'utf8');
if (/DVStore|localStorage|sessionStorage|fetch\(|axios/i.test(projectCardCode)) {
  console.error('[FAIL] ProjectCard contains forbidden references to global storage or network!');
  failures++;
} else {
  console.log('[PASS] ProjectCard is a pure component (no global store or hidden network fetches).');
}

// 2. Verify FormField accessibility features
const formFieldCode = fs.readFileSync(path.join(uiDir, 'FormField.jsx'), 'utf8');
if (
  formFieldCode.includes('aria-required') &&
  formFieldCode.includes('aria-invalid') &&
  formFieldCode.includes('aria-describedby') &&
  formFieldCode.includes('htmlFor')
) {
  console.log('[PASS] FormField implements full ARIA accessibility (required, invalid, describedby, htmlFor).');
} else {
  console.error('[FAIL] FormField is missing ARIA accessibility attributes.');
  failures++;
}

// 3. Verify Button accessibility & busy states
const buttonCode = fs.readFileSync(path.join(uiDir, 'Button.jsx'), 'utf8');
if (buttonCode.includes('aria-busy') && buttonCode.includes('aria-disabled')) {
  console.log('[PASS] Button implements aria-busy and disabled/loading handling.');
} else {
  console.error('[FAIL] Button is missing aria-busy or aria-disabled.');
  failures++;
}

// 4. Verify StatusMessage / ErrorMessage
const statusMsgCode = fs.readFileSync(path.join(uiDir, 'StatusMessage.jsx'), 'utf8');
if (statusMsgCode.includes('role=') && statusMsgCode.includes('ErrorMessage')) {
  console.log('[PASS] StatusMessage provides accessible roles (alert/status) and ErrorMessage alias.');
} else {
  console.error('[FAIL] StatusMessage missing accessible role or ErrorMessage export.');
  failures++;
}

// 5. Verify Dialog accessibility
const dialogCode = fs.readFileSync(path.join(uiDir, 'Dialog.jsx'), 'utf8');
if (
  dialogCode.includes('role="dialog"') &&
  dialogCode.includes('aria-modal="true"') &&
  dialogCode.includes('aria-labelledby') &&
  dialogCode.includes('Escape')
) {
  console.log('[PASS] Dialog implements role="dialog", aria-modal, aria-labelledby, and Escape key dismissal.');
} else {
  console.error('[FAIL] Dialog is missing accessibility attributes or Escape dismiss.');
  failures++;
}

// 6. Verify LoadingState and EmptyState exist
if (fs.existsSync(path.join(uiDir, 'LoadingState.jsx')) && fs.existsSync(path.join(uiDir, 'EmptyState.jsx'))) {
  console.log('[PASS] LoadingState and EmptyState components exist and are registered.');
} else {
  console.error('[FAIL] LoadingState or EmptyState is missing.');
  failures++;
}

if (failures === 0) {
  console.log('\nAll shared UI primitives verified successfully!');
  process.exit(0);
} else {
  console.error(`\nValidation failed with ${failures} error(s).`);
  process.exit(1);
}
