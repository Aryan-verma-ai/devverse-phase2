/* =========================================================
   LEADERBOARDS
   ========================================================= */

let dvBoardMode = 'developers';
let dvBoardRange = 'weekly';

function dvLeaderboardInit() {
  const root = document.getElementById('leaderboard-list');
  if (!root) return;

  document.querySelectorAll('[data-board]').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-board]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    dvBoardMode = btn.dataset.board;
    dvRenderLeaderboard();
  }));
  document.querySelectorAll('[data-range]').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-range]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    dvBoardRange = btn.dataset.range;
    dvRenderLeaderboard();
  }));

  dvRenderLeaderboard();
}

function dvRenderLeaderboard() {
  const root = document.getElementById('leaderboard-list');
  const factor = dvBoardRange === 'weekly' ? 0.18 : 1;
  // BUG FIXED: this used to build a "You" row (name, avatar, tier
  // badge, points) and splice it into the ranked list unconditionally
  // — even for a visitor who has never signed up. Combined with a
  // separate bug where a "welcome" bonus was silently awarded to
  // guests before they ever created an account, a brand-new visitor
  // would open Leaderboard and see themselves already ranked with
  // real points, looking exactly like they were logged in when they
  // weren't. The "You" row (and the "Your points" panel below) now
  // only render when someone's actually signed in.
  const loggedIn = dvIsLoggedIn();

  if (dvBoardMode === 'developers') {
    const since = dvBoardRange === 'weekly' ? Date.now() - 7 * 86400000 : Date.now() - 30 * 86400000;
    const overrides = DVStore.get('profile.overrides', {});
    const account = dvAuthAccount();
    const you = loggedIn ? {
      handle: 'you',
      // BUG FIXED: missing account.name fallback showed "You" on the
      // leaderboard even for a signed-up account.
      name: overrides.name || (account && account.name) || 'You',
      avatarSeed: overrides.avatarSeed || 'you-builder',
      points: dvPointsTotal(since),
      allTimePoints: dvPointsTotal(),
      isYou: true,
    } : null;
    const list = [...DV_DEVS.map((d) => ({ ...d, points: Math.round(d.points * factor), allTimePoints: d.points })), ...(you ? [you] : [])].sort((a, b) => b.points - a.points);
    const max = Math.max(...list.map((d) => d.points), 1);
    root.innerHTML = list.map((d, i) => `
      <div class="rank-row ${i < 3 ? 'top' + (i + 1) : ''} ${d.isYou ? 'rank-row-you' : ''} reveal in">
        <div class="rank-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="rank-dev">
          <img src="${dvAvatar(d.avatarSeed, 40)}">
          <div>
            <div style="font-weight:600; font-size:14px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">${d.name}${d.isYou ? '<span class="chip chip-accent" style="font-size:10px; padding:2px 8px;">You</span>' : ''} ${dvTierBadgeHTML(d.allTimePoints)}</div>
            <div class="bar-track" style="width:140px; margin-top:6px;"><div class="bar-fill" style="width:${(d.points / max) * 100}%"></div></div>
          </div>
        </div>
        <div class="mono" style="font-size:13px; text-align:right;">${d.points.toLocaleString()} pts</div>
        <a href="profile.html${d.isYou ? '' : '?u=' + d.handle}" class="btn btn-sm btn-ghost">View</a>
      </div>`).join('');
  } else {
    const list = [...DV_PROJECTS].sort((a, b) => b.likes - a.likes);
    const max = list[0].likes;
    root.innerHTML = list.map((p, i) => `
      <div class="rank-row ${i < 3 ? 'top' + (i + 1) : ''} reveal in">
        <div class="rank-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="rank-dev">
          <div style="width:40px;height:40px;border-radius:10px;background:${DV_TECH_GRADIENTS[p.gradient]};"></div>
          <div>
            <div style="font-weight:600; font-size:14px;">${p.title}</div>
            <div class="bar-track" style="width:140px; margin-top:6px;"><div class="bar-fill" style="width:${(p.likes * factor / (max * factor)) * 100}%"></div></div>
          </div>
        </div>
        <div class="mono" style="font-size:13px; text-align:right;">${Math.round(p.likes * factor).toLocaleString()} likes</div>
        <a href="project.html?id=${p.id}" class="btn btn-sm btn-ghost">View</a>
      </div>`).join('');
  }

  dvRenderYourPoints();
}

function dvRenderYourPoints() {
  const totalEl = document.getElementById('your-points-total');
  const logEl = document.getElementById('your-points-log');
  if (!totalEl || !logEl) return;

  // BUG FIXED: same root issue as the "You" row above — this panel
  // rendered a real points total, tier badge, and event log for
  // whoever was browsing even while signed out, since nothing here
  // ever checked dvIsLoggedIn(). Guests now get a sign-in prompt
  // instead of a fabricated 0-or-more point history that isn't
  // actually tied to any account yet.
  if (!dvIsLoggedIn()) {
    totalEl.textContent = '—';
    logEl.innerHTML = `<p class="muted" style="font-size:13px;">Sign in to start earning points and see your rank here.</p>`;
    const tierRoot = document.getElementById('tier-panel');
    if (tierRoot) tierRoot.innerHTML = `<p class="muted" style="font-size:13px;">Sign in to track your tier progress.</p>`;
    return;
  }

  totalEl.textContent = dvPointsTotal().toLocaleString();

  const log = DVStore.get('points.log', []).slice().sort((a, b) => b.at - a.at).slice(0, 8);
  logEl.innerHTML = log.length
    ? log.map((entry) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--border);">
        <span style="font-size:13px;">${entry.reason}</span>
        <span style="display:flex; align-items:center; gap:10px;">
          <span class="mono" style="font-size:12px; color:var(--cyan);">+${entry.amount}</span>
          <span class="mono muted" style="font-size:11px;">${dvTimeAgo(Math.max(0, Math.floor((Date.now() - entry.at) / 60000)))}</span>
        </span>
      </div>`).join('')
    : `<p class="muted" style="font-size:13px;">No points earned yet — like a project, join a community, or post in a forum to start climbing the board.</p>`;

  dvRenderTierPanel();
}

function dvRenderTierPanel() {
  const root = document.getElementById('tier-panel');
  if (!root) return;
  const points = dvPointsTotal();
  const tier = dvCurrentTier(points);
  const next = dvNextTier(points);

  root.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:16px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:12px;">
        ${dvTierBadgeHTML(points)}
        <span class="mono muted" style="font-size:12.5px;">${points.toLocaleString()} pts</span>
      </div>
      ${next
        ? `<span class="muted mono" style="font-size:12px;">${next.min - points} pts to ${next.icon} ${next.name}</span>`
        : `<span class="muted mono" style="font-size:12px;">Top tier reached</span>`}
    </div>
    ${next ? `<div class="bar-track" style="margin-bottom:22px;"><div class="bar-fill" style="width:${Math.min(100, (points / next.min) * 100)}%"></div></div>` : '<div style="margin-bottom:22px;"></div>'}

    <div class="tier-track">
      ${DV_TIERS.map((t, i) => {
        const reached = points >= t.min;
        const isCurrent = t.id === tier.id;
        return `
        <div class="tier-step ${reached ? 'tier-step-reached' : ''} ${isCurrent ? 'tier-step-current' : ''}">
          <div class="tier-step-icon">${t.icon}</div>
          <div class="tier-step-name">${t.name}</div>
          <div class="tier-step-min mono">${t.min} pts</div>
          ${t.id === 'legend' ? `<div class="tier-step-perk">unlocks the Legend accent</div>` : ''}
        </div>`;
      }).join('')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvLeaderboardInit, 30));
