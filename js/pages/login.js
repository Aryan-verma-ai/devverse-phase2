/* =========================================================
   SIGN IN
   ========================================================= */

function dvLoginInit() {
  const form = document.getElementById('login-form');
  if (!form) return;
  const redirectTarget = dvSafeRedirect(dvGetQueryParam('redirect'));
  const signupLink = document.getElementById('login-to-signup-link');
  if (signupLink && dvGetQueryParam('redirect')) {
    signupLink.href = 'signup.html?redirect=' + encodeURIComponent(redirectTarget);
  }

  if (dvIsLoggedIn()) {
    dvToast('You\u2019re already signed in');
    window.location.href = redirectTarget;
    return;
  }

  dvWirePasswordField('login-password', 'login-password-toggle', 'login-capslock-warning');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('login-error-notice').style.display = 'none';

    if (!dvValidateForm(form)) return;

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value.trim().toLowerCase();
    // Trimmed on both sides (here and at signup) — this is a demo
    // account with no real security stakes, so a stray space from
    // autofill or a copy-paste shouldn't be able to masquerade as
    // "wrong password" when it's really just whitespace.
    const password = passwordInput.value.trim();

    const account = dvFindAccountByEmail(email);
    if (!account) {
      dvShowLoginError('No account found with that email — check for typos or create one first.');
      return;
    }
    if (account.password !== password) {
      dvShowLoginError('Incorrect password.');
      return;
    }

    DVStore.set('auth.session', account.email);
    dvToast(`Welcome back, ${account.name.split(' ')[0]}!`);
    window.location.href = redirectTarget;
  });

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', function () {
      if (this.classList.contains('field-error')) dvClearFieldError(this);
    });
  });
}

function dvShowLoginError(message) {
  const notice = document.getElementById('login-error-notice');
  document.getElementById('login-error-text').textContent = message;
  notice.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvLoginInit, 30));
