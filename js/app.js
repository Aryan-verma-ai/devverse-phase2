/* =========================================================
   DEVVERSE — APP SHELL
   Runs on every page: boot sequence, nav, particles, toasts,
   settings application, and small reusable utilities.
   ========================================================= */

/* ---------- LocalStorage store (namespaced per account) ----------
   BUG FIXED HERE: this store used to keep every piece of data — likes,
   bookmarks, portfolio, submitted projects, profile edits, settings,
   follows, points, everything — under one single flat localStorage key
   ('devverse:v1'), with no account boundary at all. "auth.session" (who's
   currently signed in) lived in that SAME object as everyone's data, so
   signing out and into a different account only ever swapped which
   account's *name* was shown — every account kept reading and writing the
   exact same shared bucket underneath. That's why signing into Account B
   showed Account A's likes/bookmarks/portfolio/etc: there was never more
   than one bucket to begin with.

   Fix: split storage into
     - one small GLOBAL bucket (KEY) that holds ONLY `auth` (the list of
       accounts on this device + which one is currently signed in) — this
       has to be readable before we know who's signed in, so it can't live
       inside a per-account bucket.
     - one PER-ACCOUNT bucket per email (or a shared "guest" bucket while
       signed out), holding everything else: likes, bookmarks, follows,
       portfolio, submitted projects, profile edits, settings, points, etc.
   Every existing call site (DVStore.get('likes', []), .set('settings.theme', ...),
   etc.) is unchanged — only path === 'auth' or a path starting with 'auth.'
   is routed to the global bucket; anything else is routed to whichever
   bucket belongs to the signed-in account. */
const DVStore = {
  KEY: 'devverse:v1',
  _isAuthPath(path) {
    return path === 'auth' || path.indexOf('auth.') === 0;
  },
  _read() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch {
      return {};
    }
  },
  _write(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },
  /** Storage key for the currently signed-in account's own bucket, or a
   *  shared guest bucket when nobody's signed in yet. */
  _userKey() {
    const session = this._read().auth && this._read().auth.session;
    return session ? this.KEY + ':user:' + session : this.KEY + ':guest';
  },
  _readUser() {
    try {
      return JSON.parse(localStorage.getItem(this._userKey())) || {};
    } catch {
      return {};
    }
  },
  _writeUser(data) {
    localStorage.setItem(this._userKey(), JSON.stringify(data));
  },
  get(path, fallback) {
    const data = this._isAuthPath(path) ? this._read() : this._readUser();
    const result = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), data);
    if (result !== undefined) return result;
    // Return a fresh copy of the fallback (via JSON, since every
    // fallback used in this app is plain data) rather than the
    // literal object/array passed in — otherwise a caller mutating
    // what they got back would silently corrupt a shared default
    // constant for every other call site that reuses it.
    if (fallback === undefined || typeof fallback !== 'object') return fallback;
    return JSON.parse(JSON.stringify(fallback));
  },
  set(path, value) {
    const isAuth = this._isAuthPath(path);
    const data = isAuth ? this._read() : this._readUser();
    const keys = path.split('.');
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = obj[keys[i]] || {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    if (isAuth) this._write(data); else this._writeUser(data);
    return value;
  },
  toggleInSet(path, id) {
    // Plain array + push/splice — same toggle behavior as a Set, but
    // built entirely from array methods on the syllabus.
    const arr = this.get(path, []);
    const index = arr.indexOf(id);
    let active;
    if (index === -1) {
      arr.push(id);
      active = true;
    } else {
      arr.splice(index, 1);
      active = false;
    }
    this.set(path, arr);
    return active;
  },
  has(path, id) {
    return (this.get(path, []) || []).includes(id);
  },
  /** Resets only the SIGNED-IN ACCOUNT's own data (likes, bookmarks,
   *  portfolio, settings, ...) — matches what the Settings page tells the
   *  user this button does. It deliberately does not touch the global
   *  auth bucket, so it doesn't sign anyone out or delete other accounts. */
  resetAll() {
    localStorage.removeItem(this._userKey());
  },
};

/* ---------- Migrate old single-account data to multi-account ----------
   Earlier versions stored one account under "auth.account" (singular).
   This one-time migration moves it into "auth.accounts" (an array) so
   that the multi-account login/signup flow works correctly. The old
   key is deleted once the migration is done. */
(function dvMigrateAuth() {
  const old = DVStore.get('auth.account', null);
  if (old && old.email) {
    const existing = DVStore.get('auth.accounts', []);
    // Only migrate if this email isn't already in the array.
    let found = false;
    for (let i = 0; i < existing.length; i++) {
      if (existing[i].email === old.email) { found = true; break; }
    }
    if (!found) {
      existing.push(old);
      DVStore.set('auth.accounts', existing);
    }
    // Remove the old singular key so migration doesn't re-run.
    const data = DVStore._read();
    if (data.auth) {
      delete data.auth.account;
      DVStore._write(data);
    }
  }
})();

/* ---------- Migrate old un-namespaced data into a per-account bucket ----------
   Before the fix above, everything (likes, bookmarks, portfolio, settings,
   etc.) lived directly in the global "devverse:v1" object next to "auth".
   Move any such leftover fields into whichever bucket the current session
   should own (the signed-in account's bucket, or the guest bucket), then
   strip them out of the global object so only "auth" remains there. */
(function dvMigrateUnnamespacedData() {
  const data = DVStore._read();
  const keys = Object.keys(data).filter((k) => k !== 'auth');
  if (keys.length === 0) return;
  const userData = DVStore._readUser();
  keys.forEach((k) => {
    if (userData[k] === undefined) userData[k] = data[k];
    delete data[k];
  });
  DVStore._writeUser(userData);
  DVStore._write(data);
})();

/* ---------- Form validation (shared across Portfolio Builder & Comments) ----------
   Real HTML5 constraints (required / minlength / type=url) checked via the
   Constraint Validation API, with our own styled inline error messages
   instead of the browser's native validation bubbles. */
function dvShowFieldError(input, message) {
  input.classList.add('field-error');
  let msgEl = input.parentElement.querySelector('.field-error-msg');
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.className = 'field-error-msg';
    input.insertAdjacentElement('afterend', msgEl);
  }
  msgEl.textContent = message;
  msgEl.classList.add('show');
  input.setAttribute('aria-invalid', 'true');
}
function dvClearFieldError(input) {
  input.classList.remove('field-error');
  input.removeAttribute('aria-invalid');
  const msgEl = input.parentElement.querySelector('.field-error-msg');
  if (msgEl) msgEl.classList.remove('show');
}
function dvFieldMessage(input) {
  if (input.validity.valueMissing) return input.dataset.errorRequired || 'This field is required.';
  if (input.validity.tooShort) return input.dataset.errorMinlength || `Please enter at least ${input.minLength} characters.`;
  if (input.validity.typeMismatch && input.type === 'url') return 'Enter a full URL, starting with http:// or https://';
  if (input.validity.typeMismatch && input.type === 'email') return 'Enter a valid email address.';
  if (input.validity.patternMismatch) return input.dataset.errorPattern || 'That format doesn\u2019t look right.';
  return input.validationMessage || 'Please check this field.';
}
/** Validates every constrained field inside a form/container. Returns true if all valid. */
function dvValidateForm(container) {
  let valid = true;
  container.querySelectorAll('input[required], textarea[required], input[data-validate]').forEach((input) => {
    dvClearFieldError(input);
    if (!input.checkValidity()) {
      dvShowFieldError(input, dvFieldMessage(input));
      valid = false;
    }
  });
  if (!valid) {
    const firstError = container.querySelector('.field-error');
    if (firstError) {
      firstError.focus();
      const card = firstError.closest('.glass');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 420);
      }
    }
  }
  return valid;
}

/* ---------- Array dedup (replaces `new Set(...)` for uniqueness) ----------
   filter() + indexOf() is the classic vanilla way to get unique values
   from an array — both are on the syllabus, Set isn't. */
function dvUniqueArray(arr) {
  return arr.filter((value, index) => arr.indexOf(value) === index);
}

/* ---------- Query string reader (replaces URLSearchParams) ----------
   Manually splits the URL's query string using string methods,
   a for...of loop, and array destructuring — same result as
   URLSearchParams.get(), built from scratch instead. */
function dvGetQueryParam(name) {
  const query = window.location.search.substring(1);
  if (!query) return null;
  const pairs = query.split('&');
  for (const pair of pairs) {
    const splitAt = pair.indexOf('=');
    const key = splitAt === -1 ? pair : pair.substring(0, splitAt);
    const value = splitAt === -1 ? '' : pair.substring(splitAt + 1);
    if (decodeURIComponent(key) === name) {
      return value ? decodeURIComponent(value) : '';
    }
  }
  return null;
}

/* ---------- Simulated auth (no backend) ----------
   This is a local-only stand-in for real authentication: multiple
   accounts per browser, stored in LocalStorage, no server, no
   password hashing, nothing sent anywhere. It exists to demonstrate
   the sign-up/sign-in flow and form validation properly, not to
   secure anything — that's stated plainly on both auth pages rather
   than implied. A real backend would replace this
   entirely with actual authentication. */
function dvAuthAccount() {
  const email = DVStore.get('auth.session', null);
  if (!email) return null;
  const accounts = DVStore.get('auth.accounts', []);
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].email === email) return accounts[i];
  }
  // BUG FIXED: "auth.session" being non-null used to be treated as proof
  // of being signed in (see dvIsLoggedIn below), but a session can point
  // at an email that no longer has a matching account — e.g. leftover
  // localStorage from an older build, a session value that was never a
  // real account email to begin with, or any other corrupted state.
  // Every navbar/profile piece that renders "who's signed in" falls back
  // to the literal name "You" whenever it has a truthy session but no
  // matching account, which made the site LOOK signed in (an avatar
  // reading "You") for a visitor who actually isn't. Since we're already
  // here having failed to find a match, clear the bad session so this
  // self-heals instead of showing that phantom "You" state again next
  // time anything checks.
  DVStore.set('auth.session', null);
  return null;
}
/** The signed-in user's real handle (their chosen username, falling
 *  back to the signup-time default, falling back to the literal
 *  string "you" if neither exists yet). Every place on the site that
 *  needs to know "is this handle actually me?" should compare
 *  against this — not just the literal string "you" — since profile
 *  edits and signup both give the account a real, different handle. */
function dvSelfHandle() {
  const overrides = DVStore.get('profile.overrides', {});
  const account = dvAuthAccount();
  return overrides.username || (account && account.username) || 'you';
}
/** Look up an account by email from the stored accounts array. */
function dvFindAccountByEmail(email) {
  const accounts = DVStore.get('auth.accounts', []);
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].email === email) return accounts[i];
  }
  return null;
}
/** Look up an account by username from the stored accounts array. */
function dvFindAccountByUsername(username) {
  const accounts = DVStore.get('auth.accounts', []);
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].username === username) return accounts[i];
  }
  return null;
}
function dvAuthCurrentEmail() {
  return DVStore.get('auth.session', null);
}
// BUG FIXED: this used to just check "is auth.session non-null?", which
// treats a stale/orphaned session (see dvAuthAccount above) as a real
// sign-in. It's now the same real check every other "am I signed in"
// decision on the site relies on: a session that actually resolves to
// an account in auth.accounts.
function dvIsLoggedIn() {
  return dvAuthAccount() !== null;
}
/** A creative signal that someone's actually logged in on this
 *  device: their name's first initial, in a color swirl rotated by
 *  that letter so different people land on visibly different (but
 *  still on-brand) gradients, instead of a generic person icon. */
function dvProfileNavButtonHTML() {
  const account = dvAuthAccount();
  const overrides = DVStore.get('profile.overrides', {});
  // BUG FIXED: this used to check account.name BEFORE overrides.name, so
  // editing your display name in Profile/Settings would never show up
  // here — it would keep showing the name you originally signed up with.
  // overrides (an explicit edit) should win; account.name is just the
  // signup-time default.
  const name = overrides.name || (account && account.name) || 'You';
  const email = account ? account.email : '';
  const initial = name.trim().charAt(0).toUpperCase() || 'Y';
  const hue = (initial.charCodeAt(0) * 27) % 360;
  return `
    <div class="dock-avatar-wrap">
      <button class="dock-icon-btn dock-avatar-btn" id="dock-avatar-trigger" title="${name}" data-page="profile">
        <span class="dock-avatar-initial" style="background: conic-gradient(from ${hue}deg, var(--violet), var(--cyan), var(--coral), var(--amber), var(--violet));">${initial}</span>
      </button>
      <div class="dock-avatar-menu" id="dock-avatar-menu">
        <div class="dock-avatar-menu-header">
          <div style="font-weight:600; font-size:13.5px;">${name}</div>
          ${email ? `<div class="mono muted" style="font-size:11px;">${email}</div>` : ''}
        </div>
        <a href="profile.html" class="dock-avatar-menu-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
          Profile
        </a>
        <button class="dock-avatar-menu-item dock-avatar-menu-item-danger" id="dock-avatar-signout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
          Sign out
        </button>
      </div>
    </div>`;
}

/** Wires a show/hide toggle button to a password input, and an
 *  optional Caps Lock warning that appears while typing into it —
 *  used on both Sign In and Sign Up, since "the password I typed
 *  looks right but isn't accepted" is very often just Caps Lock or
 *  an autofill mismatch, not a real logic bug. */
function dvWirePasswordField(inputId, toggleId, warningId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  const eyeIcon = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOffIcon = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-7-11-7a20.3 20.3 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a20.3 20.3 0 01-3.14 3.94"/><path d="M14.12 14.12a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></svg>';
  if (input && toggle) {
    toggle.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      toggle.innerHTML = showing ? eyeIcon : eyeOffIcon;
    });
  }
  if (input && warningId) {
    const warning = document.getElementById(warningId);
    if (warning) {
      const checkCaps = (e) => {
        const on = typeof e.getModifierState === 'function' && e.getModifierState('CapsLock');
        warning.classList.toggle('show', !!on);
      };
      input.addEventListener('keyup', checkCaps);
      input.addEventListener('keydown', checkCaps);
    }
  }
}

function dvIsFollowing(handle) {
  return DVStore.has('following', handle);
}

function dvAuthSignOut() {
  DVStore.set('auth.session', null);
  dvToast('Signed out');
  window.location.href = 'index.html';
}
/** Just "profile.html?u=kmori", not the full path — works the same
 *  whether the site is opened via a real server or straight from
 *  file://, where pathname would otherwise be a long absolute path. */
function dvCurrentPageWithQuery() {
  const parts = window.location.pathname.split('/');
  const filename = parts[parts.length - 1] || 'index.html';
  return filename + window.location.search;
}
/** Only allow a bare same-site "somefile.html" (optionally with a
 *  query string) as a redirect target — rejects anything with a
 *  protocol, host, or path traversal in it. */
function dvSafeRedirect(target) {
  if (target && /^[\w-]+\.html(\?[^"'<>]*)?$/.test(target)) return target;
  return 'index.html';
}

/* ---------- Settings application ---------- */
function dvApplySettings() {
  const accent = DVStore.get('settings.accent', 'violet');
  const motion = DVStore.get('settings.motion', 'on');
  const theme = DVStore.get('settings.theme', 'dark');
  document.documentElement.setAttribute('data-accent', accent);
  document.documentElement.setAttribute('data-motion', motion);
  document.documentElement.setAttribute('data-theme', theme);
}
dvApplySettings(); // runs before paint, in <head>, so there's no theme flash

const DV_ICON_SUN = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const DV_ICON_MOON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/></svg>`;

function dvToggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  DVStore.set('settings.theme', next);
  document.documentElement.setAttribute('data-theme', next);
  dvUpdateThemeIcon();
}
function dvUpdateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.innerHTML = theme === 'dark' ? DV_ICON_SUN : DV_ICON_MOON;
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  });
}

/* ---------- Shared icons (single source of truth so every like/bookmark
   button across pages looks and behaves identically) ---------- */
const DV_ICON_HEART = `<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c2 0 3.5 1.5 5.5 4 2-2.5 3.5-4 5.5-4C21 5 23.5 8.5 21.5 12.5 19 16.65 12 21 12 21z"/></svg>`;
const DV_ICON_BOOKMARK = `<svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>`;
const DV_ICON_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

/* ---------- Project view counts ----------
   BUG FIXED: the Stats panel on a project's detail page (Difficulty /
   Views / Likes) always printed the project's seed `views` number
   straight from data.js — visiting the page, refreshing it, coming
   back a week later, none of it ever changed the number, even though
   Likes right next to it already reacted live to the heart button.
   Real page views for user-submitted projects (which seed at 0) never
   moved either. Fix: keep a small object of extra views per project
   id in this account's own storage, bump it once per visit to the
   project page, and always display seed + extra together instead of
   the frozen seed number alone. */
function dvTrackProjectView(id) {
  const views = DVStore.get('projectViews', {});
  views[id] = (views[id] || 0) + 1;
  DVStore.set('projectViews', views);
  return views[id];
}
function dvProjectViewCount(p) {
  const extra = DVStore.get('projectViews', {})[p.id] || 0;
  return p.views + extra;
}
/** Compact "1.2k" style label for card views — falls back to the
 *  plain number under 1,000 instead of showing "0.0k" for a fresh
 *  user-submitted project. */
function dvProjectViewsLabel(p) {
  const total = dvProjectViewCount(p);
  return total >= 1000 ? (total / 1000).toFixed(1) + 'k' : String(total);
}

/* ---------- Badges ----------
   BUG FIXED: the profile page used to show all four badges as if
   already earned for every account, even a brand-new signup with 0
   projects and 0 activity. Each badge now has a real, checkable
   condition tied to something the account has actually done — same
   spirit as the Views/Likes fix, applied to badges. */
const DV_BADGES = [
  { icon: '🔥', name: 'Shipping Streak', description: 'Publish a project to Explore.' },
  { icon: '🌱', name: 'Early Adopter', description: 'Add a bio and a skill in the Portfolio Builder.' },
  { icon: '🐞', name: 'Bug Hunter', description: 'Leave your first comment on a project.' },
  { icon: '🏛️', name: 'Community Pillar', description: 'Join a squad or a community.' },
];
function dvBadgeEarned(name) {
  switch (name) {
    case 'Shipping Streak':
      return dvUserProjects().length >= 1;
    case 'Early Adopter': {
      const portfolio = DVStore.get('portfolio', null);
      return !!(portfolio && portfolio.bio && portfolio.skills && portfolio.skills.length >= 1);
    }
    case 'Bug Hunter': {
      const comments = DVStore.get('comments', {});
      return Object.keys(comments).some(function (id) {
        return comments[id].some(function (c) { return c.author === 'you'; });
      });
    }
    case 'Community Pillar':
      return dvMySquads().length >= 1 || DVStore.get('communities', []).length >= 1;
    default:
      return false;
  }
}

/* ---------- Avatar load fallback ----------
   BUG FIXED: every avatar <img> across the site points at an external
   API (dicebear) with no error handling — if that request ever fails
   (offline, blocked, rate-limited), the browser was left showing raw
   overlapping alt text instead of an image, most visible in the
   Contributors avatar stack on a project page. Image "error" events
   don't bubble, but they ARE visible in the capture phase, so one
   listener on the document catches every avatar on the site without
   needing to touch each template that renders one. */
const DV_AVATAR_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
  '<rect width="80" height="80" rx="16" fill="#23263a"/>' +
  '<circle cx="40" cy="32" r="14" fill="#4b4f6b"/>' +
  '<path d="M14 68c2-16 16-24 26-24s24 8 26 24" fill="#4b4f6b"/>' +
  '</svg>'
);
document.addEventListener('error', function (e) {
  const el = e.target;
  if (el && el.tagName === 'IMG' && el.src && el.src.indexOf('dicebear.com') !== -1 && !el.dataset.avatarFallback) {
    el.dataset.avatarFallback = 'true';
    el.src = DV_AVATAR_FALLBACK;
  }
}, true);

/** User-submitted projects don't collect an image, so they need a
 *  sensible piece of card art instead of a broken <img>. Sniff the
 *  title/description for a subject match (currently just medical —
 *  add more keyword sets here as more themed art gets added) and
 *  fall back to one of the seeded illustrations otherwise, picked
 *  deterministically from the project id so it's stable on rerender. */
function dvPickProjectArt(p) {
  const text = ((p.title || '') + ' ' + (p.desc || '')).toLowerCase();
  const medicalWords = ['health', 'medical', 'medicine', 'doctor', 'clinic', 'clinician', 'patient', 'hospital', 'pharmacy', 'nurse', 'therapy', 'diagnosis'];
  if (medicalWords.some((w) => text.includes(w))) return 'project-16.png';
  const fallbackPool = ['project-1.png', 'project-2.png', 'project-3.png', 'project-4.png', 'project-5.png'];
  const idx = Math.abs(String(p.id).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % fallbackPool.length;
  return fallbackPool[idx];
}

/* ---------- Shared project card (used on Home, Explore, Profile, Project Details) ---------- */
function dvProjectCardHTML(p) {
  const liked = DVStore.has('likes', p.id);
  const bookmarked = DVStore.has('bookmarks', p.id);
  const art = p.art || dvPickProjectArt(p);
  return `
  <a href="project.html?id=${p.id}" class="project-card glass card-lift reveal">
    <div class="pc-thumb" style="background:${DV_TECH_GRADIENTS[p.gradient]}">
      <img class="pc-art" src="assets/img/project-cards/${art}" alt="" aria-hidden="true">
      <span class="chip pc-diff">${p.difficulty}</span>
    </div>
    <div>
      <div class="pc-title">${p.title}</div>
      <div class="pc-desc">${p.desc}</div>
    </div>
    <div class="pc-tags">${p.tags.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
    <div class="pc-stats">
      <button class="pc-stat dv-like ${liked ? 'liked' : ''}" data-like="${p.id}" onclick="event.preventDefault()" aria-label="Like ${p.title}">
        ${DV_ICON_HEART}
        <span data-like-count data-base="${p.likes}">${(liked ? p.likes + 1 : p.likes).toLocaleString()}</span>
      </button>
      <span class="pc-stat">${DV_ICON_EYE}${dvProjectViewsLabel(p)}</span>
      <button class="pc-stat dv-bookmark ${bookmarked ? 'bookmarked' : ''}" data-bookmark="${p.id}" onclick="event.preventDefault()" style="margin-left:auto" aria-label="Bookmark ${p.title}">
        ${DV_ICON_BOOKMARK}
      </button>
    </div>
  </a>`;
}

/* ---------- Shared hackathon card (used on Hackathons, Profile library,
   and the "Other hackathons" section of the Hackathon detail page) ---------- */
function dvHackathonCardHTML(h) {
  const bookmarked = DVStore.has('bookmarks', 'hack-' + h.id);
  const registered = DVStore.has('hackathons', h.id);
  return `
  <a href="hackathon.html?id=${h.id}" class="glass card-lift reveal" style="padding:24px; display:flex; flex-direction:column; gap:16px;" data-end="${h.end}" data-hid="${h.id}">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <span class="chip chip-accent">${h.tags[0]}</span>
      <button class="pc-stat dv-bookmark ${bookmarked ? 'bookmarked' : ''}" data-bookmark="hack-${h.id}" onclick="event.preventDefault()" aria-label="Bookmark ${h.title}">
        ${DV_ICON_BOOKMARK}
      </button>
    </div>
    <div>
      <h3>${h.title}</h3>
      <p style="font-size:13.5px; margin-top:6px;">${h.desc}</p>
    </div>
    <div class="mono countdown" style="font-size:22px; font-weight:700; color:var(--accent);">--:--:--</div>
    <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-tertiary);">
      <span>${h.prize} prize pool</span>
      <span>${h.participants.toLocaleString()} joined</span>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border);">
      <span class="chip">${h.difficulty}</span>
      <button class="btn btn-sm ${registered ? 'btn-outline' : 'btn-primary'}" data-register="${h.id}" onclick="event.preventDefault()">${registered ? 'Registered ✓' : 'Register'}</button>
    </div>
  </a>`;
}

/* ---------- Countdown ticker (shared — runs on every page; harmless
   no-op if there are no [data-end] elements present) ---------- */
function dvTickCountdowns() {
  document.querySelectorAll('[data-end]').forEach((card) => {
    const end = parseInt(card.dataset.end, 10);
    const el = card.querySelector('.countdown');
    if (!el) return;
    const diff = end - Date.now();
    if (diff <= 0) { el.textContent = 'Live now'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = d > 0 ? `${d}d ${h}h ${m}m` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });
}

/* ---------- Forum data helpers (shared — Communities index preview
   and the per-community forum page both need these) ---------- */
function dvForumThreads(communityId) {
  const key = `forum.${communityId}`;
  let threads = DVStore.get(key, null);
  if (threads === null) {
    const seed = (typeof DV_FORUM_SEED !== 'undefined' && DV_FORUM_SEED[communityId]) || [];
    threads = seed.map((t, i) => ({
      id: `${communityId}-seed-${i}`,
      title: t.title,
      body: t.body,
      author: t.author,
      createdAt: Date.now() - t.minutesAgo * 60000,
      replies: t.replies.map((r, j) => ({
        id: `${communityId}-seed-${i}-r${j}`,
        author: r.author,
        text: r.text,
        createdAt: Date.now() - r.minutesAgo * 60000,
      })),
    }));
    DVStore.set(key, threads);
  }
  return threads;
}
function dvForumSave(communityId, threads) {
  DVStore.set(`forum.${communityId}`, threads);
}
function dvForumAuthorName(handle) {
  // BUG FIXED: this ignored profile.overrides/account.name entirely and
  // just hardcoded "You" for your own forum posts, instead of your real
  // display name.
  if (handle === 'you') {
    const overrides = DVStore.get('profile.overrides', {});
    const account = dvAuthAccount();
    return overrides.name || (account && account.name) || 'You';
  }
  const dev = DV_DEVS.find((d) => d.handle === handle);
  return dev ? dev.name : handle;
}
function dvForumAuthorAvatar(handle) {
  if (handle === 'you') return DVStore.get('profile.overrides', {}).avatarSeed || 'you-builder';
  const dev = DV_DEVS.find((d) => d.handle === handle);
  return dev ? dev.avatarSeed : handle;
}
function dvForumAgo(createdAt) {
  const min = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  return dvTimeAgo(min);
}

/** Collects every thread across every community into one flat list,
 *  tagged with which community each came from. Built with a plain
 *  for...of loop + push instead of .flatMap(), since flatMap isn't
 *  one of the array methods on the syllabus (forEach/map/filter/
 *  reduce/sort are). */
function dvAllForumThreads() {
  const allThreads = [];
  for (const c of DV_COMMUNITIES) {
    const threads = dvForumThreads(c.id);
    for (const t of threads) {
      allThreads.push({ ...t, communityId: c.id, communityName: c.name });
    }
  }
  return allThreads;
}

/* ---------- Toasts ---------- */
function dvToast(msg) {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="tdot"></span><span>${msg}</span>`;
  stack.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 320);
  }, 2400);
}

/* ---------- Boot sequence (first load per session) ---------- */
function dvBootSequence() {
  const boot = document.getElementById('boot-screen');
  if (!boot) return;
  if (sessionStorage.getItem('dv-booted')) {
    boot.remove();
    return;
  }
  const log = boot.querySelector('.boot-log');
  const lines = ['mounting filesystem…', 'authenticating builder…', 'loading DevVerse OS…', 'ready.'];
  let i = 0;
  const iv = setInterval(() => {
    if (log) log.textContent = lines[i];
    i++;
    if (i >= lines.length) clearInterval(iv);
  }, 260);
  setTimeout(() => {
    boot.classList.add('hidden');
    sessionStorage.setItem('dv-booted', '1');
    setTimeout(() => boot.remove(), 700);
  }, 1150);
}

/* ---------- Particle field ---------- */
function dvParticles() {
  const field = document.getElementById('particle-field');
  if (!field || document.documentElement.getAttribute('data-motion') === 'off') return;
  const count = window.innerWidth < 700 ? 14 : 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 2 + Math.random() * 3;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.bottom = `${-10 - Math.random() * 20}%`;
    p.style.animationDuration = `${14 + Math.random() * 16}s`;
    p.style.animationDelay = `${Math.random() * 12}s`;
    field.appendChild(p);
  }
}

/* ---------- Mobile menu ---------- */
function dvMobileMenu() {
  const toggle = document.querySelector('.dock-mobile-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menu.classList.remove('open')));
}

/* ---------- Animated counters & scroll reveal ----------
   Built with getBoundingClientRect() + a scroll listener instead of
   IntersectionObserver, and setInterval instead of
   requestAnimationFrame, since neither is on the syllabus — this
   keeps the same "animate once, when scrolled into view" behavior
   using only basic DOM/event/timer APIs. */
function dvElementInView(el, viewportFraction) {
  const rect = el.getBoundingClientRect();
  const triggerLine = window.innerHeight * viewportFraction;
  return rect.top < triggerLine && rect.bottom > 0;
}

function dvRunCounter(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const isWhole = target % 1 === 0;
  const steps = 45;
  const stepDuration = 1400 / steps;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const p = Math.min(1, step / steps);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = target * eased;
    el.textContent = (isWhole ? Math.floor(val).toLocaleString() : val.toFixed(1)) + suffix;
    if (step >= steps) clearInterval(timer);
  }, stepDuration);
}

function dvCheckCounters() {
  document.querySelectorAll('[data-count]:not(.dv-counted)').forEach((el) => {
    if (dvElementInView(el, 0.85)) {
      el.classList.add('dv-counted');
      dvRunCounter(el);
    }
  });
}
function dvAnimateCounters(root = document) {
  dvCheckCounters(); // catches anything already in view right now
}

function dvCheckReveals() {
  document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
    if (dvElementInView(el, 0.9)) el.classList.add('in');
  });
}
function dvReveal(root = document) {
  dvCheckReveals(); // catches anything already in view right now
}

/* ---------- Shared chrome: dock nav + mobile menu + boot + bg ---------- */
const DV_NAV = [
  { page: 'home', label: 'Home', href: 'index.html' },
  { page: 'explore', label: 'Explore', href: 'explore.html' },
  { page: 'communities', label: 'Communities', href: 'communities.html' },
  { page: 'hackathons', label: 'Hackathons', href: 'hackathons.html' },
  { page: 'squads', label: 'Squads', href: 'squads.html' },
  { page: 'leaderboard', label: 'Leaderboard', href: 'leaderboard.html' },
  { page: 'portfolio', label: 'Portfolio Builder', href: 'portfolio.html' },
  { page: 'codex', label: 'Codex', href: 'codex.html' },
];

/** The nav list actually shown right now: Codex is signed-in-only
 *  (the page itself requires it anyway), so hiding it while logged
 *  out both matches what it's for and frees up real width in the
 *  dock for exactly the moment the wider "Sign In" button appears —
 *  the two together were what caused the nav to overflow. */
function dvVisibleNav() {
  if (dvIsLoggedIn()) return DV_NAV;
  return DV_NAV.filter((n) => n.page !== 'codex');
}

function dvBuildChrome() {
  const chromeRoot = document.getElementById('dv-chrome');
  if (!chromeRoot) return;

  chromeRoot.innerHTML = `
    <div id="boot-screen">
      <div class="boot-mark">DEV<span>VERSE</span> OS</div>
      <div class="boot-bar"><div class="boot-bar-fill"></div></div>
      <div class="boot-log">initializing…</div>
    </div>
    <div class="aurora-bg"></div>
    <div id="particle-field"></div>
    <div class="dock-wrap">
      <nav class="dock">
        <a href="index.html" class="dock-brand"><span class="mark">DV</span> DevVerse</a>
        <div class="dock-links">
          ${dvVisibleNav().map((n) => `<a href="${n.href}" class="dock-link" data-page="${n.page}">${n.label}</a>`).join('')}
        </div>
        <div class="dock-actions">
          <button class="cmdk-dock-trigger" id="cmdk-trigger-btn" title="Search everything">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <span class="cmdk-trigger-label-text">Search</span>
            <kbd id="cmdk-trigger-kbd">Ctrl K</kbd>
          </button>
          <button class="dock-icon-btn" data-theme-toggle title="Toggle theme"></button>
          ${dvIsLoggedIn() ? '' : `<a href="login.html" class="btn btn-sm btn-primary" data-page="login" style="flex-shrink:0;">Sign In</a>`}
          ${dvIsLoggedIn() ? dvProfileNavButtonHTML() : `
          <a href="profile.html" class="dock-icon-btn" title="Profile" data-page="profile">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
          </a>`}
          <a href="settings.html" class="dock-icon-btn" title="Settings" data-page="settings">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>
          </a>
          <button class="dock-icon-btn dock-mobile-toggle" title="Menu">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </nav>
    </div>
    <div class="mobile-menu">
      <a href="#" id="cmdk-mobile-trigger" style="color:var(--accent);">Search everything</a>
      ${dvVisibleNav().map((n) => `<a href="${n.href}" data-page="${n.page}">${n.label}</a>`).join('')}
      <a href="profile.html" data-page="profile">Profile</a>
      <a href="settings.html" data-page="settings">Settings</a>
      ${dvIsLoggedIn()
        ? `<a href="#" id="mobile-signout" style="color:var(--coral);">Sign out</a>`
        : `<a href="login.html" data-page="login" style="color:var(--accent);">Sign in</a>`}
    </div>
  `;

  const mobileSignout = document.getElementById('mobile-signout');
  if (mobileSignout) {
    mobileSignout.addEventListener('click', (e) => {
      e.preventDefault();
      dvAuthSignOut();
    });
  }

  const avatarTrigger = document.getElementById('dock-avatar-trigger');
  const avatarMenu = document.getElementById('dock-avatar-menu');
  if (avatarTrigger && avatarMenu) {
    avatarTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      avatarMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!avatarMenu.classList.contains('open')) return;
      if (avatarMenu.contains(e.target) || avatarTrigger.contains(e.target)) return;
      avatarMenu.classList.remove('open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') avatarMenu.classList.remove('open');
    });
    const avatarSignout = document.getElementById('dock-avatar-signout');
    if (avatarSignout) avatarSignout.addEventListener('click', () => dvAuthSignOut());
  }

  dvUpdateThemeIcon();

  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);
  const main = document.querySelector('main');
  if (main) main.id = 'main-content';

  const backToTop = document.createElement('button');
  backToTop.id = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(backToTop);
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });

  const footerRoot = document.getElementById('dv-footer');
  if (footerRoot) {
    footerRoot.innerHTML = `
      <footer>
        <div class="wrap">
          <div class="footer-grid">
            <div>
              <a href="index.html" class="dock-brand" style="padding:0 0 12px;"><span class="mark">DV</span> DevVerse</a>
              <p style="max-width:280px;">An operating system for the people who build the internet, one commit at a time.</p>
            </div>
            <div>
              <h4>Platform</h4>
              <a href="explore.html">Explore Projects</a>
              <a href="leaderboard.html">Leaderboard</a>
              <a href="hackathons.html">Hackathons</a>
              <a href="portfolio.html">Portfolio Builder</a>
            </div>
            <div>
              <h4>Community</h4>
              <a href="communities.html">Communities</a>
              <a href="settings.html">Settings</a>
            </div>
            <div>
              <h4>Builder</h4>
              <a href="profile.html">Your Profile</a>
              <a href="submit-project.html">Submit a Project</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2026 DevVerse. Built with HTML, CSS &amp; vanilla JS — no backend required.</span>
            <span class="mono">v1.0.0</span>
          </div>
        </div>
      </footer>
    `;
  }
}

/* =========================================================
   COMMAND PALETTE (Ctrl/Cmd+K)
   The site's flagship differentiator: a Spotlight/Linear-style
   overlay that instantly searches and jumps to any project,
   developer, community, hackathon, page, or quick action from
   anywhere on the site. Fits the "operating system for
   developers" framing literally, not just as decoration.
   ========================================================= */
let dvCmdkOpen = false;
let dvPendingSquadMember = null;
let dvCmdkSelected = 0;
let dvCmdkItems = [];

function dvBuildCommandPalette() {
  const el = document.createElement('div');
  el.id = 'cmdk-overlay';
  el.className = 'cmdk-overlay';
  el.innerHTML = `
    <div class="cmdk-panel glass">
      <div class="cmdk-input-row">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        <input type="text" id="cmdk-input" placeholder="Search projects, developers, communities, hackathons…" autocomplete="off">
        <kbd class="cmdk-esc">Esc</kbd>
      </div>
      <div id="cmdk-results" class="cmdk-results"></div>
    </div>
  `;
  document.body.appendChild(el);

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  const kbdEl = document.getElementById('cmdk-trigger-kbd');
  if (kbdEl) kbdEl.textContent = isMac ? '⌘K' : 'Ctrl K';

  document.getElementById('cmdk-trigger-btn').addEventListener('click', dvOpenCommandPalette);
  const mobileTrigger = document.getElementById('cmdk-mobile-trigger');
  if (mobileTrigger) {
    mobileTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      const menu = document.querySelector('.mobile-menu');
      if (menu) menu.classList.remove('open');
      dvOpenCommandPalette();
    });
  }
  el.addEventListener('click', (e) => {
    if (e.target.id === 'cmdk-overlay') dvCloseCommandPalette();
  });
  document.getElementById('cmdk-input').addEventListener('input', (e) => dvRenderCmdkResults(e.target.value));
  const resultsRoot = document.getElementById('cmdk-results');
  resultsRoot.addEventListener('click', (e) => {
    const item = e.target.closest('.cmdk-item');
    if (item) dvCmdkActivate(parseInt(item.dataset.cmdkIndex, 10));
  });
  resultsRoot.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.cmdk-item');
    if (item) dvCmdkHighlight(parseInt(item.dataset.cmdkIndex, 10));
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dvCmdkOpen ? dvCloseCommandPalette() : dvOpenCommandPalette();
      return;
    }
    if (!dvCmdkOpen) return;
    if (e.key === 'Escape') { dvCloseCommandPalette(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); dvCmdkHighlight(Math.min(dvCmdkSelected + 1, dvCmdkItems.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); dvCmdkHighlight(Math.max(dvCmdkSelected - 1, 0)); return; }
    if (e.key === 'Enter') { e.preventDefault(); dvCmdkActivate(dvCmdkSelected); return; }
  });
}

/** Builds the full searchable index fresh each time it's needed, so
 *  it always reflects the current mock data — projects, developers,
 *  communities, hackathons, every page, and a few quick actions. */
function dvBuildSearchIndex() {
  const index = [];
  for (const p of dvAllProjects()) {
    index.push({ id: 'project-' + p.id, type: 'Project', icon: '⬡', label: p.title, sublabel: p.tags.join(', '), href: `project.html?id=${p.id}` });
  }
  for (const d of DV_DEVS) {
    index.push({ id: 'dev-' + d.handle, type: 'Developer', icon: '◆', label: d.name, sublabel: '@' + d.handle, href: `profile.html?u=${d.handle}` });
  }
  for (const c of DV_COMMUNITIES) {
    index.push({ id: 'community-' + c.id, type: 'Community', icon: '●', label: c.name, sublabel: `${c.members.toLocaleString()} members`, href: `community.html?id=${c.id}` });
  }
  for (const h of DV_HACKATHONS) {
    index.push({ id: 'hack-' + h.id, type: 'Hackathon', icon: '◈', label: h.title, sublabel: `${h.prize} prize pool`, href: `hackathon.html?id=${h.id}` });
  }
  for (const n of dvVisibleNav()) {
    index.push({ id: 'page-' + n.page, type: 'Page', icon: '▲', label: n.label, sublabel: 'Go to page', href: n.href });
  }
  index.push({ id: 'action-theme', type: 'Action', icon: '☾', label: 'Toggle dark / light theme', sublabel: 'Switch appearance', action: 'toggle-theme' });
  index.push({ id: 'action-points', type: 'Action', icon: '★', label: 'View your points', sublabel: 'Open the leaderboard', href: 'leaderboard.html' });
  index.push({ id: 'action-profile', type: 'Action', icon: '✎', label: 'Edit your profile', sublabel: 'Open your profile', href: 'profile.html' });
  index.push({ id: 'action-settings', type: 'Action', icon: '⚙', label: 'Settings', sublabel: 'Theme, accent color, reset data', href: 'settings.html' });
  index.push({ id: 'action-submit-project', type: 'Action', icon: '⬡', label: 'Submit a project', sublabel: 'Publish your work to Explore', href: 'submit-project.html' });
  if (dvIsLoggedIn()) {
    index.push({ id: 'action-signout', type: 'Action', icon: '⎋', label: 'Sign out', sublabel: 'End your DevVerse session', action: 'sign-out' });
  } else {
    index.push({ id: 'action-signin', type: 'Action', icon: '⎆', label: 'Sign in', sublabel: 'Access your DevVerse account', href: 'login.html' });
    index.push({ id: 'action-signup', type: 'Action', icon: '＋', label: 'Create an account', sublabel: 'Sign up for DevVerse', href: 'signup.html' });
  }
  return index;
}

function dvOpenCommandPalette() {
  const overlay = document.getElementById('cmdk-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  dvCmdkOpen = true;
  const input = document.getElementById('cmdk-input');
  input.value = '';
  dvRenderCmdkResults('');
  setTimeout(() => input.focus(), 10);
}
function dvCloseCommandPalette() {
  const overlay = document.getElementById('cmdk-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  dvCmdkOpen = false;
}

function dvRenderCmdkResults(query) {
  const resultsRoot = document.getElementById('cmdk-results');
  const index = dvBuildSearchIndex();
  let items;
  let showingRecent = false;

  if (!query) {
    const recentIds = DVStore.get('cmdk.recent', []);
    items = [];
    for (const id of recentIds) {
      const found = index.find((i) => i.id === id);
      if (found) items.push(found);
    }
    showingRecent = items.length > 0;
  } else {
    const q = query.toLowerCase();
    items = index.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
      item.type.toLowerCase().includes(q)
    ).slice(0, 8);
  }

  dvCmdkItems = items;
  dvCmdkSelected = 0;

  if (!items.length) {
    resultsRoot.innerHTML = `<p class="cmdk-empty">${query ? `No matches for "${query}" — try a project, developer, or community name.` : 'Start typing to search everything on DevVerse.'}</p>`;
    return;
  }

  // Group items by type, preserving first-seen order, without using flatMap/Set.
  const groups = [];
  for (const item of items) {
    let group = groups.find((g) => g.type === item.type);
    if (!group) {
      group = { type: item.type, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  let flatIndex = 0;
  let html = showingRecent ? `<div class="cmdk-group-label">Recently viewed</div>` : '';
  for (const group of groups) {
    if (!showingRecent) html += `<div class="cmdk-group-label">${group.type}${group.items.length > 1 ? 's' : ''}</div>`;
    for (const item of group.items) {
      html += `
        <button class="cmdk-item" data-cmdk-index="${flatIndex}">
          <span class="cmdk-item-icon">${item.icon}</span>
          <span class="cmdk-item-text">
            <span class="cmdk-item-label">${item.label}</span>
            ${item.sublabel ? `<span class="cmdk-item-sublabel">${item.sublabel}</span>` : ''}
          </span>
          <span class="cmdk-item-type">${item.type}</span>
        </button>`;
      flatIndex++;
    }
  }
  resultsRoot.innerHTML = html;
  dvCmdkHighlight(0);
}

function dvCmdkHighlight(index) {
  const items = document.querySelectorAll('.cmdk-item');
  items.forEach((el) => el.classList.remove('cmdk-active'));
  if (items[index]) {
    items[index].classList.add('cmdk-active');
    items[index].scrollIntoView({ block: 'nearest' });
  }
  dvCmdkSelected = index;
}

function dvCmdkActivate(index) {
  const item = dvCmdkItems[index];
  if (!item) return;

  if (item.type === 'Project' || item.type === 'Developer' || item.type === 'Community' || item.type === 'Hackathon') {
    let recent = DVStore.get('cmdk.recent', []);
    recent = recent.filter((id) => id !== item.id);
    recent.unshift(item.id);
    recent = recent.slice(0, 5);
    DVStore.set('cmdk.recent', recent);
  }

  if (item.action === 'toggle-theme') {
    dvToggleTheme();
    dvCloseCommandPalette();
    return;
  }
  if (item.action === 'sign-out') {
    dvCloseCommandPalette();
    dvAuthSignOut();
    return;
  }
  window.location.href = item.href;
}

/* ---------- Squads (shared — Squads page builds/manages them,
   Profile page displays the ones you're in) ----------
   A squad is a small team you form with other builders on the
   platform: a name, a description, a member list of any size, and
   the hackathons you've registered for together. Since only "you"
   are a real person here, forming a squad with a mock developer is
   simulated the same way following or messaging them is — but the
   squad itself, its description, and its registrations are real,
   persisted data. */
function dvSquads() {
  return DVStore.get('squads', []);
}
function dvSaveSquads(squads) {
  DVStore.set('squads', squads);
}
function dvMySquads() {
  return dvSquads().filter((s) => s.members.indexOf('you') !== -1);
}
function dvCreateSquad(name, description, memberHandles) {
  const squads = dvSquads();
  const members = ['you'];
  for (const h of memberHandles) {
    if (members.indexOf(h) === -1) members.push(h);
  }
  const squad = {
    id: 'squad-' + Date.now(),
    name,
    description,
    createdAt: Date.now(),
    members,
    registeredHackathons: [],
  };
  squads.push(squad);
  dvSaveSquads(squads);
  dvAwardPoints(DV_POINT_VALUES.squadFormed, `Formed the ${name} squad`);
  return squad;
}
function dvLeaveSquad(squadId) {
  const squads = dvSquads().filter((s) => s.id !== squadId);
  dvSaveSquads(squads);
}
function dvRegisterSquadForHackathon(squadId, hackathonId) {
  const squads = dvSquads();
  const squad = squads.find((s) => s.id === squadId);
  if (!squad) return false;
  if (squad.registeredHackathons.indexOf(hackathonId) !== -1) return false;
  squad.registeredHackathons.push(hackathonId);
  dvSaveSquads(squads);
  // Continuity: if your squad registers, you're registered too —
  // the same 'hackathons' set that drives the Register button
  // everywhere else on the site (hackathon cards, the detail page,
  // your profile library) so there's one source of truth instead of
  // two registration states that can drift apart.
  const personal = DVStore.get('hackathons', []);
  if (personal.indexOf(hackathonId) === -1) {
    personal.push(hackathonId);
    DVStore.set('hackathons', personal);
  }
  dvAwardOnce('squadHackathon', `${squadId}-${hackathonId}`, DV_POINT_VALUES.squadRegister, 'Registered a squad for a hackathon');
  return true;
}

/** The Follow / Message / + Squad action row — one implementation
 *  used everywhere a person shows up as someone you could team up
 *  with: match cards on Squads, and now anyone's profile page too.
 *  Doesn't include "View profile", since that's contextual (a match
 *  card wants it, your own profile obviously doesn't). */
function dvSquadAndMessageActionsHTML(handle, name) {
  const following = dvIsFollowing(handle);
  const mySquads = dvMySquads();
  const firstName = name.split(' ')[0];
  return `
    <button class="btn btn-sm ${following ? 'btn-ghost' : 'btn-primary'}" data-follow="${handle}">${following ? 'Following' : 'Follow'}</button>
    <button class="btn btn-sm btn-ghost" data-toggle-message="${handle}">Message</button>
    <button class="btn btn-sm btn-outline" data-toggle-squad-picker="${handle}">+ Squad</button>

    <div class="squad-picker" id="squad-picker-${handle}" style="display:none; width:100%;">
      <div class="mono muted" style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px;">Add to squad</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${mySquads.map((s) => `<button class="btn btn-sm btn-ghost" data-add-to-squad="${s.id}" data-add-member="${handle}">${s.name}</button>`).join('')}
        <button class="btn btn-sm btn-primary" data-new-squad-with="${handle}" data-new-squad-name="${firstName}">+ New squad with ${firstName}</button>
      </div>
    </div>

    <div class="message-panel" id="message-panel-${handle}" style="display:none; width:100%;">
      <div class="message-thread" id="message-thread-${handle}"></div>
      <form class="message-form" data-message-to="${handle}">
        <input type="text" class="message-input" placeholder="Say hi…" required minlength="1">
        <button class="btn btn-sm btn-primary" type="submit">Send</button>
      </form>
    </div>
  `;
}

function dvRenderMessageThread(handle) {
  const threadRoot = document.getElementById(`message-thread-${handle}`);
  if (!threadRoot) return;
  const msgs = dvMessages(handle);
  threadRoot.innerHTML = msgs.length
    ? msgs.map(function (m, i) { return `
      <div class="message-bubble ${m.from === 'you' ? 'message-bubble-you' : ''}">
        <span>${m.text}</span>
        <span class="mono message-bubble-time">${dvForumAgo(m.at)}</span>
        ${m.from === 'you' ? `<button class="msg-delete-btn" data-delete-msg="${handle}" data-msg-index="${i}" title="Delete message">&times;</button>` : ''}
      </div>`; }).join('')
    : `<p class="muted" style="font-size:12px;">No messages yet — this is a simulated inbox, so replies are canned, but the thread is real and saved.</p>`;
  threadRoot.scrollTop = threadRoot.scrollHeight;
}

/** Refreshes whichever squad list is on the current page, without
 *  either function needing to know the other exists. */
function dvRefreshSquadDisplays() {
  if (typeof dvRenderMySquads === 'function') dvRenderMySquads();
  if (typeof dvRenderProfileSquads === 'function') dvRenderProfileSquads();
  if (typeof dvRenderMatches === 'function') dvRenderMatches();
}

/** Pulls together everything we actually have about a squad member
 *  — real for you (your portfolio), mock-but-consistent for everyone
 *  else (their seeded projects and skills) — for display on squad
 *  cards. Deliberately doesn't invent a GitHub link or anything else
 *  we don't really have data for. */
function dvSquadMemberInfo(handle) {
  // BUG FIXED: this only ever matched the literal string "you", but
  // callers like the portfolio preview pass the account's REAL handle
  // (profile.overrides.username, or the username picked at signup) —
  // which is almost never the literal word "you". That mismatch meant
  // previewing your own, fully-filled-in portfolio looked up a handle
  // that didn't exist in DV_DEVS and came back "not found". Matching
  // against dvSelfHandle() too makes "is this me?" resolve correctly
  // everywhere, regardless of which handle a caller passed in.
  if (handle === 'you' || handle === dvSelfHandle()) {
    const overrides = DVStore.get('profile.overrides', {});
    const account = dvAuthAccount();
    const portfolio = DVStore.get('portfolio', null);
    return {
      handle: dvSelfHandle(),
      // BUG FIXED: missing account.name fallback meant this showed "You"
      // for a signed-up account until the profile was manually edited.
      name: overrides.name || (account && account.name) || 'You',
      // BUG FIXED: avatarSeed and bio used to be read from `overrides`
      // (the separate Profile/Settings page's data) instead of from
      // `portfolio` (what the Portfolio Builder's Avatar seed and Bio
      // fields actually save to). So typing a bio or changing your
      // avatar seed in the Portfolio Builder had no effect here — this
      // function was quietly reading a different, usually-empty field
      // the whole time, showing "No bio yet" and a stale avatar no
      // matter what you typed.
      avatarSeed: (portfolio && portfolio.avatarSeed) || overrides.avatarSeed || 'you-builder',
      bio: (portfolio && portfolio.bio) || overrides.bio || '',
      skills: portfolio ? portfolio.skills : [],
      // BUG FIXED: this used to also splice in every project you'd
      // published from the Submit a Project page, even ones never
      // added to the Portfolio Builder's own Projects section — so
      // your portfolio preview (and squad cards) could show a project
      // you never put there. It now shows exactly what's in the
      // Portfolio Builder's Projects list, nothing more.
      projects: portfolio ? portfolio.projects : [],
      points: dvPointsTotal(),
      isYou: true,
    };
  }
  const dev = DV_DEVS.find((d) => d.handle === handle);
  if (!dev) return null;
  const projects = DV_PROJECTS.filter((p) => p.author === handle).map((p) => ({ title: p.title, desc: p.desc, id: p.id }));
  return {
    handle: dev.handle,
    name: dev.name,
    avatarSeed: dev.avatarSeed,
    bio: dev.bio,
    skills: dev.skills,
    projects,
    points: dev.points,
    isYou: false,
  };
}

/* ---------- Simulated 1:1 messaging (shared) ----------
   Real developers can't actually reply, so a short canned response
   arrives after a delay — clearly a stand-in for a real inbox a
   backend would provide, not pretended to be a live person. */
const DV_CANNED_REPLIES = [
  'Hey! Always down to build something new.',
  'Sounds interesting — tell me more about what you\u2019re thinking?',
  'I\u2019m in. Let\u2019s figure out a hackathon to team up for.',
  'Nice, I\u2019ve been looking for someone to pair with.',
  'Let\u2019s do it — what\u2019s the plan?',
  'I could bring the backend if you\u2019ve got the frontend covered.',
];
function dvMessages(handle) {
  return DVStore.get(`messages.${handle}`, []);
}
function dvSaveMessages(handle, msgs) {
  DVStore.set(`messages.${handle}`, msgs);
}
function dvSendMessage(handle, text, onReply) {
  const msgs = dvMessages(handle);
  msgs.push({ from: 'you', text, at: Date.now() });
  dvSaveMessages(handle, msgs);
  dvAwardPoints(DV_POINT_VALUES.message, 'Sent a message');
  setTimeout(() => {
    const reply = DV_CANNED_REPLIES[Math.floor(Math.random() * DV_CANNED_REPLIES.length)];
    const msgs2 = dvMessages(handle);
    msgs2.push({ from: handle, text: reply, at: Date.now() });
    dvSaveMessages(handle, msgs2);
    if (onReply) onReply();
  }, 1100 + Math.random() * 900);
}

/* ---------- Points system ----------
   A real, transparent points ledger, not a decorative counter.
   Every entry is {amount, reason, at} pushed to points.log, so the
   leaderboard's "weekly"/"monthly" toggle can filter by real
   timestamps for you specifically (the mock developers only have a
   single static total, so their weekly/monthly figures stay an
   approximation — that limitation is called out on the Leaderboard
   page itself rather than hidden). */
const DV_POINT_VALUES = {
  like: 2,
  bookmark: 3,
  follow: 2,
  join: 5,
  register: 20,
  comment: 15,
  thread: 25,
  reply: 10,
  message: 3,
  squadFormed: 20,
  squadRegister: 30,
  codexEntry: 25,
  projectSubmit: 25,
  milestone: { welcome: 10, profileEdited: 15, firstSkill: 10, threeSkills: 15, firstLink: 10, firstProject: 15, bio: 10, portfolioComplete: 30, teamProfile: 10, accountCreated: 20 },
};

/* ---------- Tiers ----------
   The real payoff for the leaderboard: points aren't just a number,
   they unlock visible status. Your tier badge shows next to your
   name on your profile, in the forum, and on the leaderboard, and
   crossing into Legend unlocks an accent color nobody else can pick
   without earning it. */
const DV_TIERS = [
  { id: 'newcomer', name: 'Newcomer', min: 0, icon: '🌱' },
  { id: 'builder', name: 'Builder', min: 40, icon: '🔧' },
  { id: 'established', name: 'Established Builder', min: 120, icon: '⚡' },
  { id: 'veteran', name: 'Veteran Builder', min: 300, icon: '🛡️' },
  { id: 'legend', name: 'Legend', min: 600, icon: '👑' },
];

function dvCurrentTier(points) {
  let tier = DV_TIERS[0];
  for (const t of DV_TIERS) {
    if (points >= t.min) tier = t;
  }
  return tier;
}
function dvNextTier(points) {
  for (const t of DV_TIERS) {
    if (points < t.min) return t;
  }
  return null; // already at the top tier
}
function dvTierBadgeHTML(points) {
  const tier = dvCurrentTier(points);
  return `<span class="tier-badge" title="${tier.name}">${tier.icon} ${tier.name}</span>`;
}
/** The points behind a forum/comment author — live for you, the
 *  static mock total for everyone else — used to show a small tier
 *  icon next to names in comments and forum threads. */
function dvAuthorPoints(handle) {
  if (handle === 'you') return dvPointsTotal();
  const dev = DV_DEVS.find((d) => d.handle === handle);
  return dev ? dev.points : 0;
}
function dvTierIconHTML(handle) {
  const tier = dvCurrentTier(dvAuthorPoints(handle));
  return `<span title="${tier.name}">${tier.icon}</span>`;
}

function dvAwardPoints(amount, reason) {
  const beforePoints = dvPointsTotal();
  const beforeTier = dvCurrentTier(beforePoints);
  const log = DVStore.get('points.log', []);
  log.push({ amount, reason, at: Date.now() });
  DVStore.set('points.log', log);
  const afterPoints = dvPointsTotal();
  const afterTier = dvCurrentTier(afterPoints);
  
  if (afterTier.id !== beforeTier.id) {
    if (afterTier.id === 'legend') {
      dvToast(`${afterTier.icon} You're a Legend now!`);
    } else {
      dvToast(`${afterTier.icon} Tier up! You're now a ${afterTier.name}`);
    }
  }

  // Codex unlocks exactly at 200 points now
  if (beforePoints < 200 && afterPoints >= 200) {
    dvToast(`📚 The Codex just unlocked!`);
  }
  
  return amount;
}

/* ---------- The Codex ----------
   A knowledge base of honest "what actually went wrong and what it
   taught me" field notes. Anyone signed in can browse it, but only 
   developers who've earned 200 points can add to it, so the signal 
   stays worth reading instead of diluting. */
function dvCodexUnlocked() {
  return dvPointsTotal() >= 200;
}
function dvCodexEntries() {
  let entries = DVStore.get('codex.entries', null);
  if (entries === null) {
    entries = DV_CODEX_SEED.map((e, i) => {
      const copy = {};
      for (const key in e) copy[key] = e[key];
      copy.id = 'codex-seed-' + i;
      copy.createdAt = Date.now() - e.minutesAgo * 60000;
      delete copy.minutesAgo;
      return copy;
    });
    DVStore.set('codex.entries', entries);
  }
  return entries;
}
function dvSaveCodexEntries(entries) {
  DVStore.set('codex.entries', entries);
}
function dvAddCodexEntry(entry) {
  const entries = dvCodexEntries();
  entries.unshift({
    id: 'codex-' + Date.now(),
    author: 'you',
    createdAt: Date.now(),
    title: entry.title,
    category: entry.category,
    problem: entry.problem,
    tried: entry.tried,
    fix: entry.fix,
    lesson: entry.lesson,
  });
  dvSaveCodexEntries(entries);
  dvAwardPoints(DV_POINT_VALUES.codexEntry, 'Contributed to the Codex');
}
function dvCodexAuthorInfo(handle) {
  if (handle === 'you') {
    const overrides = DVStore.get('profile.overrides', {});
    const account = dvAuthAccount();
    return { name: overrides.name || (account && account.name) || 'You', avatarSeed: overrides.avatarSeed || 'you-builder', points: dvPointsTotal() };
  }
  const dev = DV_DEVS.find((d) => d.handle === handle);
  return dev ? { name: dev.name, avatarSeed: dev.avatarSeed, points: dev.points } : { name: handle, avatarSeed: handle, points: 0 };
}

/* ---------- User-submitted projects ----------
   Explore, Home, project search, and profiles all render from the
   SAME mock DV_PROJECTS array — there was never an actual path from
   "I built something" to "it shows up on the platform." This is
   that path: projects you submit live in LocalStorage and get
   merged into every place projects are displayed, exactly like the
   seeded ones, with a real author ("you"), real like/bookmark/
   comment support, and a real detail page. */
function dvUserProjects() {
  return DVStore.get('userProjects', []);
}
function dvSaveUserProjects(list) {
  DVStore.set('userProjects', list);
}
/** The full project catalog anywhere on the site should read from
 *  — your submissions first (freshest), then the seeded ones. */
function dvAllProjects() {
  return dvUserProjects().concat(DV_PROJECTS);
}
function dvFindProjectById(id) {
  return dvAllProjects().find((p) => p.id === id);
}
function dvAddUserProject(project) {
  const list = dvUserProjects();
  const entry = {
    id: 'user-' + Date.now(),
    title: project.title,
    desc: project.desc,
    tags: project.tags,
    difficulty: project.difficulty,
    category: project.category,
    githubUrl: project.githubUrl || null,
    features: project.features || [],
    timeline: project.timeline || [],
    author: 'you',
    gradient: Math.floor(Math.random() * 5),
    likes: 0,
    views: 0,
    createdAt: Date.now(),
  };
  entry.art = dvPickProjectArt(entry);
  list.unshift(entry);
  dvSaveUserProjects(list);
  dvAwardPoints(DV_POINT_VALUES.projectSubmit, `Published "${entry.title}" to Explore`);
  return entry;
}
/** Remove a user-submitted project by id. */
function dvDeleteUserProject(id) {
  const list = dvUserProjects();
  const filtered = list.filter(function (p) { return p.id !== id; });
  dvSaveUserProjects(filtered);
}
/** Patches a user-submitted project (currently used for the "Edit
 *  category" control on your own project's detail page) and saves
 *  it back to this account's storage. Only ever touches projects you
 *  actually own — seeded demo projects aren't in this list. */
function dvUpdateUserProject(id, patch) {
  const list = dvUserProjects();
  const index = list.findIndex(function (p) { return p.id === id; });
  if (index === -1) return null;
  list[index] = Object.assign({}, list[index], patch);
  dvSaveUserProjects(list);
  return list[index];
}
/** Same idea as dvCodexAuthorInfo/dvSquadMemberInfo — resolves a
 *  project's author to a real, live name/avatar whether that's you
 *  or one of the seeded developers, instead of literally showing
 *  the handle string "you" as someone's display name. */
function dvProjectAuthorInfo(handle) {
  if (handle === 'you') {
    const overrides = DVStore.get('profile.overrides', {});
    const account = dvAuthAccount();
    return { name: overrides.name || (account && account.name) || 'You', avatarSeed: overrides.avatarSeed || 'you-builder' };
  }
  const dev = DV_DEVS.find((d) => d.handle === handle);
  return dev ? { name: dev.name, avatarSeed: dev.avatarSeed } : { name: handle, avatarSeed: handle };
}

/** Pulls owner/repo out of a GitHub URL using plain string methods
 *  only (no regex) — accepts with or without a protocol/www, and
 *  strips a trailing .git or extra path segments. Returns null for
 *  anything that isn't recognizably a GitHub repo URL. */
function dvParseGithubRepoUrl(url) {
  let cleaned = (url || '').trim();
  if (cleaned.indexOf('https://') === 0) cleaned = cleaned.slice('https://'.length);
  else if (cleaned.indexOf('http://') === 0) cleaned = cleaned.slice('http://'.length);
  if (cleaned.indexOf('www.') === 0) cleaned = cleaned.slice('www.'.length);
  if (cleaned.indexOf('github.com/') !== 0) return null;
  cleaned = cleaned.slice('github.com/'.length);
  const parts = cleaned.split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  let repo = parts[1];
  if (repo.slice(-4) === '.git') repo = repo.slice(0, -4);
  return { owner: parts[0], repo: repo };
}

/** Sums the points log, optionally only entries at/after `sinceMs`. */
function dvPointsTotal(sinceMs) {
  const log = DVStore.get('points.log', []);
  return log.reduce((sum, entry) => (!sinceMs || entry.at >= sinceMs ? sum + entry.amount : sum), 0);
}

/** Awards points for a given id exactly once, ever, per bucket — so
 *  toggling a like on/off repeatedly can't farm points. Returns true
 *  the first time (and only the first time) it fires for that id. */
function dvAwardOnce(bucket, id, amount, reason) {
  const credited = DVStore.get(`points.credited.${bucket}`, []);
  if (credited.includes(id)) return false;
  credited.push(id);
  DVStore.set(`points.credited.${bucket}`, credited);
  dvAwardPoints(amount, reason);
  return true;
}

/* ---------- Active nav link ---------- */
function dvMarkActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(`.dock-link, .mobile-menu a`).forEach((a) => {
    if (a.dataset.page === page) a.classList.add('active');
  });
}

/* ---------- Page header stat panel ----------
   Fills the empty space beside interior-page titles with a small
   live-stats panel, built from the exact same arrays each page
   already renders from below — never invented numbers. */
function dvFormatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
/** Strips everything but digits out of a string like "$25,000",
 *  built with a for...of loop + string comparison instead of regex. */
function dvDigitsOnly(str) {
  let out = '';
  for (const ch of str) {
    if (ch >= '0' && ch <= '9') out += ch;
  }
  return out;
}
function dvPageHeaderStats(page) {
  if (page === 'communities') {
    const totalMembers = DV_COMMUNITIES.reduce((sum, c) => sum + c.members, 0);
    const totalOnline = DV_COMMUNITIES.reduce((sum, c) => sum + c.online, 0);
    return [
      { value: DV_COMMUNITIES.length, label: 'Communities' },
      { value: dvFormatCount(totalMembers), label: 'Total members' },
      { value: dvFormatCount(totalOnline), label: 'Online right now' },
    ];
  }
  if (page === 'hackathons') {
    const totalPrize = DV_HACKATHONS.reduce((sum, h) => sum + parseInt(dvDigitsOnly(h.prize), 10), 0);
    const totalParticipants = DV_HACKATHONS.reduce((sum, h) => sum + h.participants, 0);
    return [
      { value: DV_HACKATHONS.length, label: 'Running now' },
      { value: '$' + dvFormatCount(totalPrize), label: 'Total prize pool' },
      { value: dvFormatCount(totalParticipants), label: 'Builders competing' },
    ];
  }
  if (page === 'leaderboard') {
    const totalPoints = DV_DEVS.reduce((sum, d) => sum + d.points, 0);
    const topScore = DV_DEVS.reduce((max, d) => (d.points > max ? d.points : max), 0);
    return [
      { value: DV_DEVS.length, label: 'Ranked builders' },
      { value: dvFormatCount(topScore), label: 'Top score' },
      { value: dvFormatCount(totalPoints), label: 'Points on the board' },
    ];
  }
  if (page === 'codex') {
    const entries = dvCodexEntries();
    const categories = dvUniqueArray(entries.map((e) => e.category));
    const contributors = dvUniqueArray(entries.map((e) => e.author));
    return [
      { value: entries.length, label: 'Field notes' },
      { value: categories.length, label: 'Categories' },
      { value: contributors.length, label: 'Contributors' },
    ];
  }
  if (page === 'squads') {
    const allSkills = dvUniqueArray(DV_DEVS.reduce((acc, d) => acc.concat(d.skills), []));
    return [
      { value: DV_DEVS.length, label: 'Builders to match' },
      { value: allSkills.length, label: 'Skills tracked' },
      { value: dvMySquads().length, label: 'Your squads' },
    ];
  }
  if (page === 'portfolio' && !dvGetQueryParam('u')) {
    const data = dvPortfolioData();
    return [
      { value: data.skills.length, label: 'Skills listed' },
      { value: data.links.length, label: 'Links added' },
      { value: data.projects.length, label: 'Projects featured' },
    ];
  }
  if (page === 'submit-project') {
    const all = dvAllProjects();
    const categories = dvUniqueArray(all.map((p) => p.category));
    const authors = dvUniqueArray(all.map((p) => p.author));
    return [
      { value: all.length, label: 'Projects live' },
      { value: categories.length, label: 'Categories' },
      { value: authors.length, label: 'Builders shipping' },
    ];
  }
  if (page === 'settings') {
    return [
      { value: '✓', label: 'Saved locally, instantly' },
      { value: '✓', label: 'Synced across every page' },
      { value: '↺', label: 'Reset anytime, no account needed' },
    ];
  }
  return null;
}
function dvRenderPageHeaderStats() {
  const root = document.getElementById('page-header-stats');
  if (!root) return;
  const page = document.body.dataset.page;
  const stats = dvPageHeaderStats(page);
  if (!stats || !stats.length) {
    root.style.display = 'none';
    return;
  }
  root.innerHTML = stats.map((s) => `
    <div class="page-header-stat">
      <span class="phs-label">${s.label}</span>
      <span class="phs-value">${s.value}</span>
    </div>`).join('');
}

/* ---------- Bookmark / like buttons wiring (delegated) ---------- */
function dvWireInteractions(root = document) {
  root.addEventListener('click', (e) => {
    const themeBtn = e.target.closest('[data-theme-toggle]');
    if (themeBtn) dvToggleTheme();

    const likeBtn = e.target.closest('[data-like]');
    if (likeBtn) {
      const id = likeBtn.dataset.like;
      const active = DVStore.toggleInSet('likes', id);
      likeBtn.classList.toggle('liked', active);
      const countEl = likeBtn.querySelector('[data-like-count]');
      if (countEl) {
        const base = parseInt(countEl.dataset.base, 10);
        countEl.textContent = (active ? base + 1 : base).toLocaleString();
      }
      // BUG FIXED: the project detail page's Stats panel shows its own
      // separate likes number (not inside this button), so it used to
      // sit frozen at the seed value even after you liked/unliked right
      // above it. Anything tagged data-like-count-for="<id>" anywhere
      // on the page gets refreshed too, not just the button you clicked.
      document.querySelectorAll(`[data-like-count-for="${id}"]`).forEach((el) => {
        const base = parseInt(el.dataset.base, 10);
        el.textContent = (active ? base + 1 : base).toLocaleString();
      });
      if (active && dvAwardOnce('likes', id, DV_POINT_VALUES.like, 'Liked a project')) {
        dvToast(`Added to your likes (+${DV_POINT_VALUES.like} pts)`);
      } else {
        dvToast(active ? 'Added to your likes' : 'Removed from your likes');
      }
    }
    const bmBtn = e.target.closest('[data-bookmark]');
    if (bmBtn) {
      const id = bmBtn.dataset.bookmark;
      const active = DVStore.toggleInSet('bookmarks', id);
      bmBtn.classList.toggle('bookmarked', active);
      const label = bmBtn.querySelector('.dv-bookmark-label');
      if (label) label.textContent = active ? 'Saved' : 'Save';
      if (active && dvAwardOnce('bookmarks', id, DV_POINT_VALUES.bookmark, 'Bookmarked a project')) {
        dvToast(`Saved to bookmarks (+${DV_POINT_VALUES.bookmark} pts)`);
      } else {
        dvToast(active ? 'Saved to bookmarks' : 'Removed from bookmarks');
      }
    }
    const followBtn = e.target.closest('[data-follow]');
    if (followBtn) {
      const id = followBtn.dataset.follow;
      const active = DVStore.toggleInSet('following', id);
      followBtn.textContent = active ? 'Following' : 'Follow';
      followBtn.classList.toggle('btn-primary', !active);
      followBtn.classList.toggle('btn-ghost', active);
      if (active && dvAwardOnce('following', id, DV_POINT_VALUES.follow, `Followed ${id}`)) {
        dvToast(`Following ${id} (+${DV_POINT_VALUES.follow} pts)`);
      } else {
        dvToast(active ? `Following ${id}` : `Unfollowed ${id}`);
      }
    }
    const joinBtn = e.target.closest('[data-join]');
    if (joinBtn) {
      const id = joinBtn.dataset.join;
      const active = DVStore.toggleInSet('communities', id);
      joinBtn.textContent = active ? 'Joined' : 'Join';
      joinBtn.classList.toggle('btn-primary', !active);
      joinBtn.classList.toggle('btn-ghost', active);
      if (active && dvAwardOnce('communities', id, DV_POINT_VALUES.join, 'Joined a community')) {
        dvToast(`Joined community (+${DV_POINT_VALUES.join} pts)`);
      } else {
        dvToast(active ? 'Joined community' : 'Left community');
      }
    }
    const regBtn = e.target.closest('[data-register]');
    if (regBtn) {
      const id = regBtn.dataset.register;
      const active = DVStore.toggleInSet('hackathons', id);
      regBtn.textContent = active ? 'Registered ✓' : 'Register';
      regBtn.classList.toggle('btn-outline', active);
      if (active && dvAwardOnce('hackathons', id, DV_POINT_VALUES.register, 'Registered for a hackathon')) {
        dvToast(`Registered for hackathon (+${DV_POINT_VALUES.register} pts)`);
      } else {
        dvToast(active ? 'Registered for hackathon' : 'Registration cancelled');
      }
    }
    const shareBtn = e.target.closest('[data-share]');
    if (shareBtn) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
      dvToast('Link copied to clipboard');
    }

    const msgToggle = e.target.closest('[data-toggle-message]');
    if (msgToggle) {
      const handle = msgToggle.dataset.toggleMessage;
      const panel = document.getElementById(`message-panel-${handle}`);
      if (panel) {
        const opening = panel.style.display === 'none';
        panel.style.display = opening ? 'block' : 'none';
        if (opening) dvRenderMessageThread(handle);
      }
    }

    // Delete own message
    const msgDel = e.target.closest('[data-delete-msg]');
    if (msgDel) {
      const handle = msgDel.dataset.deleteMsg;
      const index = parseInt(msgDel.dataset.msgIndex, 10);
      const msgs = dvMessages(handle);
      if (index >= 0 && index < msgs.length && msgs[index].from === 'you') {
        msgs.splice(index, 1);
        dvSaveMessages(handle, msgs);
        dvRenderMessageThread(handle);
        dvToast('Message deleted');
      }
    }

    const squadPickerToggle = e.target.closest('[data-toggle-squad-picker]');
    if (squadPickerToggle) {
      const handle = squadPickerToggle.dataset.toggleSquadPicker;
      const panel = document.getElementById(`squad-picker-${handle}`);
      if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    const newSquadWith = e.target.closest('[data-new-squad-with]');
    if (newSquadWith) {
      const handle = newSquadWith.dataset.newSquadWith;
      const createForm = document.getElementById('squad-create-form');
      if (createForm) {
        // Already on the Squads page — populate the form right here.
        dvPendingSquadMember = handle;
        if (typeof dvRenderSquadMemberChips === 'function') dvRenderSquadMemberChips();
        createForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dvToast('Added — name your squad below');
      } else {
        // Anywhere else (e.g. viewing someone's profile) — send them
        // to Squads with this person already selected.
        window.location.href = 'squads.html?newSquadWith=' + encodeURIComponent(handle);
      }
    }

    const addToSquad = e.target.closest('[data-add-to-squad]');
    if (addToSquad) {
      const squadId = addToSquad.dataset.addToSquad;
      const memberHandle = addToSquad.dataset.addMember;
      const squads = dvSquads();
      const squad = squads.find((s) => s.id === squadId);
      if (squad) {
        if (squad.members.indexOf(memberHandle) === -1) {
          squad.members.push(memberHandle);
          dvSaveSquads(squads);
          dvToast(`Added to ${squad.name}`);
          dvRefreshSquadDisplays();
        } else {
          dvToast('Already in that squad');
        }
      }
    }

    const leaveSquad = e.target.closest('[data-leave-squad]');
    if (leaveSquad) {
      dvLeaveSquad(leaveSquad.dataset.leaveSquad);
      dvToast('Left the squad');
      dvRefreshSquadDisplays();
    }

    const registerSquad = e.target.closest('[data-register-squad]');
    if (registerSquad) {
      const squadId = registerSquad.dataset.registerSquad;
      const select = document.getElementById(`squad-hackathon-select-${squadId}`);
      if (select && select.value) {
        const awarded = dvRegisterSquadForHackathon(squadId, select.value);
        dvToast(awarded ? `Squad registered (+${DV_POINT_VALUES.squadRegister} pts)` : 'Squad already registered for that one');
        dvRefreshSquadDisplays();
      }
    }
  });

  root.addEventListener('submit', (e) => {
    const form = e.target.closest('.message-form');
    if (!form) return;
    e.preventDefault();
    const handle = form.dataset.messageTo;
    if (!dvValidateForm(form)) return;
    const input = form.querySelector('.message-input');
    const text = input.value.trim();
    form.reset();
    dvSendMessage(handle, text, () => dvRenderMessageThread(handle));
    dvRenderMessageThread(handle);
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  dvBuildChrome();
  dvBuildCommandPalette();
  dvBootSequence();
  dvParticles();
  dvMobileMenu();
  dvMarkActiveNav();
  dvRenderPageHeaderStats();
  dvAnimateCounters();
  dvReveal();
  dvWireInteractions();
  dvTickCountdowns();
  setInterval(dvTickCountdowns, 1000);

  // Single scroll/resize listener drives both the reveal and counter
  // animations for the whole page (registered once here, rather than
  // once per dvReveal()/dvAnimateCounters() call, so it never stacks).
  window.addEventListener('scroll', function () {
    dvCheckReveals();
    dvCheckCounters();
  });
  window.addEventListener('resize', function () {
    dvCheckReveals();
    dvCheckCounters();
  });
});
