/* =========================================================
   SIGN UP
   ========================================================= */

function dvSignupInit() {
  const form = document.getElementById('signup-form');
  if (!form) return;
  const redirectTarget = dvSafeRedirect(dvGetQueryParam('redirect'));
  const redirectQuery = dvGetQueryParam('redirect') ? '?redirect=' + encodeURIComponent(redirectTarget) : '';

  const loginLink = document.getElementById('signup-to-login-link');
  if (loginLink) loginLink.href = 'login.html' + redirectQuery;
  const existingLoginLink = document.getElementById('signup-existing-login-link');
  if (existingLoginLink) existingLoginLink.href = 'login.html' + redirectQuery;

  if (dvIsLoggedIn()) {
    dvToast('You\u2019re already signed in');
    window.location.href = redirectTarget;
    return;
  }



  dvWirePasswordField('signup-password', 'signup-password-toggle', 'signup-capslock-warning');
  dvWirePasswordField('signup-confirm', 'signup-confirm-toggle', null);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('signup-name');
    const usernameInput = document.getElementById('signup-username');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm');

    if (!dvValidateForm(form)) return;

    // --- Password strength validation ---
    // Must contain at least 1 uppercase, 1 number, 1 special character,
    // and be at least 7 characters long. Checked character-by-character
    // using a for loop and string methods (all within lectures 1–24).
    const pw = passwordInput.value.trim();
    let hasUpper = false;
    let hasNumber = false;
    let hasSpecial = false;
    const specials = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~\\';
    for (let i = 0; i < pw.length; i++) {
      const ch = pw[i];
      if (ch >= 'A' && ch <= 'Z') hasUpper = true;
      if (ch >= '0' && ch <= '9') hasNumber = true;
      if (specials.indexOf(ch) !== -1) hasSpecial = true;
    }
    dvClearFieldError(passwordInput);
    if (pw.length < 7) {
      dvShowFieldError(passwordInput, 'Use at least 7 characters.');
      passwordInput.focus();
      return;
    }
    if (!hasUpper) {
      dvShowFieldError(passwordInput, 'Include at least one uppercase letter (A–Z).');
      passwordInput.focus();
      return;
    }
    if (!hasNumber) {
      dvShowFieldError(passwordInput, 'Include at least one number (0–9).');
      passwordInput.focus();
      return;
    }
    if (!hasSpecial) {
      dvShowFieldError(passwordInput, 'Include at least one special character (!@#$% etc.).');
      passwordInput.focus();
      return;
    }

    // Confirm password must match.
    dvClearFieldError(confirmInput);
    if (confirmInput.value.trim() !== pw) {
      dvShowFieldError(confirmInput, 'Passwords don\u2019t match.');
      confirmInput.focus();
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const username = usernameInput.value.trim().toLowerCase();

    // Check if an account with this email already exists.
    if (dvFindAccountByEmail(email)) {
      dvShowFieldError(emailInput, 'An account with this email already exists. Try signing in instead.');
      emailInput.focus();
      return;
    }

    // Check if an account with this username already exists.
    if (dvFindAccountByUsername(username)) {
      dvShowFieldError(usernameInput, 'That username is already taken. Try another one.');
      usernameInput.focus();
      return;
    }

    const account = {
      name: nameInput.value.trim(),
      username: username,
      email: email,
      password: pw,
    };

    // Add the new account to the accounts array so multiple accounts
    // can coexist on the same device.
    const accounts = DVStore.get('auth.accounts', []);
    accounts.push(account);
    DVStore.set('auth.accounts', accounts);

    DVStore.set('auth.session', account.email);
    DVStore.set('profile.overrides', { name: account.name, username: account.username, bio: '', avatarSeed: 'you-builder' });

    dvAwardOnce('milestone', 'account-created', DV_POINT_VALUES.milestone.accountCreated, 'Created your DevVerse account');
    dvToast(`Welcome to DevVerse, ${account.name.split(' ')[0]}!`);
    window.location.href = redirectTarget;
  });

  // Clear a field's error as soon as the person starts fixing it.
  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', function () {
      if (this.classList.contains('field-error')) dvClearFieldError(this);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSignupInit, 30));
