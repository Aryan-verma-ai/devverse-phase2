/* =========================================================
   SETTINGS
   ========================================================= */

function dvLegendUnlocked() {
  return dvPointsTotal() >= DV_TIERS[DV_TIERS.length - 1].min;
}

function dvRenderLegendSwatchState() {
  const swatch = document.getElementById('legend-swatch');
  const note = document.getElementById('legend-swatch-note');
  const unlocked = dvLegendUnlocked();
  const legendTier = DV_TIERS[DV_TIERS.length - 1];
  swatch.classList.toggle('locked-swatch', !unlocked);
  note.textContent = unlocked
    ? `${legendTier.icon} Legend accent unlocked — you earned it.`
    : `${legendTier.icon} Legend accent locks at ${legendTier.min} pts. You have ${dvPointsTotal()}.`;
}

function dvRenderAccountPanel() {
  const root = document.getElementById('account-panel');
  if (!root) return;
  const account = dvAuthAccount();
  const loggedIn = dvIsLoggedIn();

  if (loggedIn && account) {
    root.innerHTML = `
      <h3 style="margin-bottom:6px;">Account</h3>
      <p style="font-size:13px; margin-bottom:16px;">Signed in as <b>${account.name}</b>${account.username ? ' (@' + account.username + ')' : ''} (${account.email}) — this is a simulated local account stored only in this browser.</p>
      <button class="btn btn-outline" id="settings-signout-btn">Sign out</button>
    `;
    document.getElementById('settings-signout-btn').addEventListener('click', dvAuthSignOut);
  } else {
    root.innerHTML = `
      <h3 style="margin-bottom:6px;">Account</h3>
      <p style="font-size:13px; margin-bottom:16px;">You're not signed in. Most of DevVerse works without an account, but viewing any profile — including your own — requires signing in.</p>
      <div style="display:flex; gap:10px;">
        <a href="login.html" class="btn btn-ghost btn-sm">Sign in</a>
        <a href="signup.html" class="btn btn-primary btn-sm">Create account</a>
      </div>
    `;
  }
}

function dvSettingsInit() {
  const root = document.getElementById('settings-root');
  if (!root) return;

  dvRenderAccountPanel();
  const accent = DVStore.get('settings.accent', 'violet');
  const motion = DVStore.get('settings.motion', 'on');
  const theme = DVStore.get('settings.theme', 'dark');

  document.querySelectorAll('[data-set-theme]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.setTheme === theme);
    btn.addEventListener('click', () => {
      DVStore.set('settings.theme', btn.dataset.setTheme);
      document.documentElement.setAttribute('data-theme', btn.dataset.setTheme);
      dvUpdateThemeIcon();
      document.querySelectorAll('[data-set-theme]').forEach((b) => b.classList.toggle('active', b === btn));
      dvToast(`Switched to ${btn.dataset.setTheme} mode`);
    });
  });

  document.querySelectorAll('[data-set-accent]').forEach((btn) => {
    btn.classList.toggle('active-swatch', btn.dataset.setAccent === accent);
    btn.addEventListener('click', () => {
      if (btn.dataset.setAccent === 'legend' && !dvLegendUnlocked()) {
        const legendMin = DV_TIERS[DV_TIERS.length - 1].min;
        dvToast(`Locked — reach Legend tier (${legendMin} pts) to unlock. You have ${dvPointsTotal()}.`);
        return;
      }
      DVStore.set('settings.accent', btn.dataset.setAccent);
      document.documentElement.setAttribute('data-accent', btn.dataset.setAccent);
      document.querySelectorAll('[data-set-accent]').forEach((b) => b.classList.remove('active-swatch'));
      btn.classList.add('active-swatch');
      dvToast('Accent color updated');
    });
  });
  dvRenderLegendSwatchState();

  const motionToggle = document.getElementById('motion-toggle');
  motionToggle.checked = motion === 'on';
  motionToggle.addEventListener('change', () => {
    const val = motionToggle.checked ? 'on' : 'off';
    DVStore.set('settings.motion', val);
    document.documentElement.setAttribute('data-motion', val);
    dvToast(`Animations ${val === 'on' ? 'enabled' : 'disabled'}`);
  });

  document.getElementById('reset-app-btn').addEventListener('click', () => {
    if (confirm('This clears all local DevVerse data — likes, bookmarks, profile edits, portfolio, and settings. Continue?')) {
      DVStore.resetAll();
      dvToast('Application reset — reloading…');
      setTimeout(() => window.location.reload(), 900);
    }
  });

  const stats = document.getElementById('storage-stats');
  // BUG FIXED: this used to read the raw global localStorage key directly
  // (bypassing DVStore), which mixed every account's data together and,
  // since the account-scoping fix, would show 0 for everything because the
  // global key now holds only auth info. Go through DVStore so these
  // counts reflect the signed-in account's own bucket, same as the rest
  // of the app.
  stats.innerHTML = `
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Total points earned</span><span class="mono">${dvPointsTotal().toLocaleString()}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Likes saved</span><span class="mono">${DVStore.get('likes', []).length}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Bookmarks saved</span><span class="mono">${DVStore.get('bookmarks', []).length}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Communities joined</span><span class="mono">${DVStore.get('communities', []).length}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Hackathons registered</span><span class="mono">${DVStore.get('hackathons', []).length}</span></div>
  `;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSettingsInit, 30));
