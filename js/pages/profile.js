/* =========================================================
   DEVELOPER PROFILE
   ========================================================= */

function dvProfileInit() {
  const root = document.getElementById('profile-root');
  if (!root) return;

  if (!dvIsLoggedIn()) {
    dvToast('Sign in to view profiles');
    window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
    return;
  }

  const handle = dvGetQueryParam('u');
  const base = DV_DEVS.find((d) => d.handle === handle) || DV_DEVS[0];

  const overrides = DVStore.get('profile.overrides', {});
  const account = dvAuthAccount();
  const selfUsername = dvSelfHandle();
  const isSelf = !handle || handle === 'you' || handle === selfUsername;
  const realPoints = dvPointsTotal();
  const portfolioData = DVStore.get('portfolio', null);
  const userSkills = portfolioData && portfolioData.skills && portfolioData.skills.length ? portfolioData.skills : base.skills;

  // BUG FIXED: name was missing the account.name fallback that username
  // (just above) already had — a signed-up account with no manual profile
  // edit yet showed the literal placeholder "You" here instead of the
  // name entered at signup.
  const data = isSelf
    ? { ...base, handle: selfUsername, name: overrides.name || (account && account.name) || 'You', bio: overrides.bio || base.bio, avatarSeed: overrides.avatarSeed || 'you-builder', points: realPoints, skills: userSkills }
    : base;

  const tier = dvCurrentTier(data.points);
  const next = dvNextTier(data.points);

  const myProjects = isSelf ? dvAllProjects().filter(function (p) { return p.author === 'you'; }) : dvAllProjects().filter(function (p) { return p.author === data.handle; });
  const statProjects = isSelf ? myProjects.length : data.projects;
  const statFollowers = isSelf ? 0 : data.followers;
  const statFollowing = isSelf ? DVStore.get('following', []).length : Math.floor(data.followers / 4);

  // One-time username change: unlocks once the account reaches Legend
  // tier's point threshold (same 600-pt bar dvLegendUnlocked() in
  // settings.js already uses for the Legend accent), and can only be
  // used once per account.
  const usernameChangeThreshold = DV_TIERS[DV_TIERS.length - 1].min;
  const usernameChangeUsed = DVStore.get('profile.usernameChangeUsed', false);
  const usernameChangeEligible = realPoints >= usernameChangeThreshold;
  let usernameFieldHTML;
  if (usernameChangeUsed) {
    usernameFieldHTML = `
      <div class="field">
        <label>Username</label>
        <input value="@${selfUsername}" disabled>
        <p class="muted" style="font-size:11.5px; margin-top:6px;">You've already used your one-time username change.</p>
      </div>`;
  } else if (!usernameChangeEligible) {
    usernameFieldHTML = `
      <div class="field">
        <label>Username</label>
        <input value="@${selfUsername}" disabled>
        <p class="muted" style="font-size:11.5px; margin-top:6px;">Locked — reach ${usernameChangeThreshold} pts to unlock a one-time username change. You have ${realPoints}.</p>
      </div>`;
  } else {
    usernameFieldHTML = `
      <div class="field">
        <label>Username</label>
        <input id="edit-username" value="${selfUsername}" minlength="3" maxlength="20" pattern="[a-zA-Z0-9_\-]+" data-error-required="Enter a username." data-error-minlength="Username must be at least 3 characters." data-error-pattern="Only letters, numbers, hyphens and underscores.">
        <p class="muted" style="font-size:11.5px; margin-top:6px;">You can change your username once — choose carefully, this can't be undone.</p>
      </div>`;
  }

  root.innerHTML = `
    <div class="glass reveal in" style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:-52px;">
      <div style="height:200px; background:linear-gradient(120deg, var(--violet), var(--cyan) 60%, var(--coral));"></div>
    </div>
    <div style="display:flex; align-items:flex-end; gap:20px; padding:0 12px; position:relative; z-index:1; flex-wrap:wrap;">
      <div class="dev-avatar-ring" style="width:110px; height:110px; margin:0;"><img src="${dvAvatar(data.avatarSeed, 130)}"></div>
      <div style="flex:1; padding-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <h2 id="profile-name">${data.name}</h2>
          ${dvTierBadgeHTML(data.points)}
        </div>
        <div class="mono muted">@${data.handle}</div>
      </div>
      <div style="padding-bottom:14px; display:flex; gap:10px;">
        <a class="btn btn-outline" href="portfolio.html${isSelf ? '' : '?u=' + data.handle}">${isSelf ? 'View your portfolio' : 'View portfolio'}</a>
        ${isSelf ? `<button class="btn btn-ghost" id="edit-profile-btn">Edit profile</button>` : ''}
      </div>
    </div>

    <div id="edit-panel" class="glass reveal in" style="display:none; padding:22px; margin:24px 0;">
      <div class="grid grid-2">
        <div class="field"><label>Display name</label><input id="edit-name" value="${data.name}"></div>
        <div class="field"><label>Avatar seed</label><input id="edit-avatar" value="${data.avatarSeed}"></div>
      </div>
      ${usernameFieldHTML}
      <div class="field"><label>Bio</label><textarea id="edit-bio" rows="3">${data.bio}</textarea></div>
      <button class="btn btn-primary btn-sm" id="save-profile-btn">Save changes</button>
    </div>

    <p style="max-width:560px; margin:24px 0 0;" id="profile-bio">${data.bio}</p>

    <div class="glass reveal in" style="padding:16px 20px; margin-top:20px; display:inline-flex; gap:10px; flex-wrap:wrap; width:fit-content;">
      ${!isSelf ? dvSquadAndMessageActionsHTML(data.handle, data.name) : `<button class="btn btn-primary btn-sm" disabled title="Others can click this to follow you">Follow</button>`}
    </div>

    ${isSelf ? `
    <div class="glass reveal in" style="padding:18px 22px; margin-top:24px;">
      <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
        <span>${tier.icon} <b>${tier.name}</b></span>
        <span class="muted">${next ? `${data.points} / ${next.min} pts to ${next.name}` : `${data.points} pts — top tier reached`}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${next ? Math.min(100, (data.points / next.min) * 100) : 100}%"></div></div>
    </div>` : ''}

    <div class="grid grid-4" style="margin-top:30px;">
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" data-count="${statProjects}">0</div><div class="stat-label">Projects</div></div>
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" data-count="${statFollowers}">0</div><div class="stat-label">Followers</div></div>
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" data-count="${statFollowing}">0</div><div class="stat-label">Following</div></div>
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" data-count="${data.points}">0</div><div class="stat-label">Points</div></div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Skills</div>
      <div class="pc-tags">${data.skills.map((s) => `<span class="chip chip-accent">${s}</span>`).join('')}</div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Badges</div>
      <div class="grid grid-4">
        ${DV_BADGES.map(function (b) {
          // Demo devs other than you don't have real trackable
          // activity to check against, so their badges stay shown as
          // earned (they're seeded personas); your own profile shows
          // exactly what you've actually done.
          const earned = isSelf ? dvBadgeEarned(b.name) : true;
          return `<div class="glass card-lift" title="${b.description}" style="padding:18px; text-align:center; ${earned ? '' : 'opacity:0.4; filter:grayscale(1);'}">
            <div style="font-size:26px;">${b.icon}</div>
            <div style="font-size:12.5px; font-weight:600; margin-top:8px;">${b.name}</div>
            ${earned ? '' : '<div style="font-size:11px; margin-top:4px;" class="muted">Locked</div>'}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Contribution activity</div>
      <div class="glass" style="padding:20px;"><div class="heatmap" id="heatmap"></div></div>
    </div>

    <div class="detail-grid detail-grid--profile section-tight">
      <div>
        <div class="eyebrow">Projects</div>
        <div class="grid grid-2" id="profile-projects"></div>
      </div>
      <div>
        <div class="eyebrow">Activity timeline</div>
        <div class="glass feed" id="profile-timeline" style="padding:8px 14px;"></div>
      </div>
    </div>

    ${isSelf ? `
    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Your squads</div>
      <div id="profile-squads"></div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Your library</div>
      <div class="pill-toggle" id="library-toggle" style="margin-bottom:20px;">
        <button data-lib="bookmarks" class="active">Bookmarked</button>
        <button data-lib="likes">Liked</button>
      </div>
      <div id="library-container"></div>
    </div>` : ''}
  `;

  document.getElementById('profile-projects').innerHTML = myProjects.slice(0, 4).map(dvProjectCardHTML).join('') || (isSelf ? `<p class="muted">No published projects yet \u2014 <a href="submit-project.html" style="color:var(--accent);">submit one</a>.</p>` : `<p class="muted">No published projects yet.</p>`);

  const heat = document.getElementById('heatmap');
  for (let i = 0; i < 182; i++) {
    const v = Math.random();
    const level = v > 0.85 ? 3 : v > 0.65 ? 2 : v > 0.4 ? 1 : 0;
    const colors = ['var(--surface)', 'var(--accent-soft, rgba(124,111,255,.25))', 'color-mix(in srgb, var(--accent) 55%, var(--surface))', 'var(--accent)'];
    heat.innerHTML += `<i style="background:${colors[level]}" title="${level} contributions"></i>`;
  }

  const timeline = document.getElementById('profile-timeline');
  let timelineHTML = '';

  const userCommits = [];
  myProjects.forEach(function (p) {
    if (p.timeline && p.timeline.length) {
      p.timeline.forEach(function (t) {
        userCommits.push({ project: p.title, label: t.label, when: t.when });
      });
    }
  });

  if (userCommits.length > 0) {
    userCommits.slice(0, 5).forEach(function (c) {
      timelineHTML += `<div class="feed-item"><img src="${dvAvatar(data.avatarSeed, 34)}"><div><div class="feed-text"><b>${data.name}</b> pushed a commit to <b>${c.project}</b>: ${c.label}</div><div class="feed-time">${c.when}</div></div></div>`;
    });
  } else {
    for (let i = 0; i < 5; i++) {
      const tpl = DV_ACTIVITY_TEMPLATES[i % DV_ACTIVITY_TEMPLATES.length];
      const proj = DV_PROJECTS[Math.floor(Math.random() * DV_PROJECTS.length)].title;
      timelineHTML += `<div class="feed-item"><img src="${dvAvatar(data.avatarSeed, 34)}"><div><div class="feed-text">${tpl(data.name, proj)}</div><div class="feed-time">${dvTimeAgo((i + 1) * 190)}</div></div></div>`;
    }
  }
  timeline.innerHTML = timelineHTML;

  if (isSelf) {
    dvRenderProfileSquads();
    dvRenderLibrary('bookmarks');
    document.querySelectorAll('[data-lib]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lib]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        dvRenderLibrary(btn.dataset.lib);
      });
    });

    document.getElementById('edit-profile-btn').addEventListener('click', () => {
      document.getElementById('edit-panel').style.display = 'block';
    });
    document.getElementById('save-profile-btn').addEventListener('click', () => {
      // One-time username change: only touched when the field is actually
      // present (i.e. unlocked and not used yet) and the value was changed.
      const usernameInput = document.getElementById('edit-username');
      if (usernameInput) {
        dvClearFieldError(usernameInput);
        const newUsername = usernameInput.value.trim().toLowerCase();
        if (newUsername !== selfUsername) {
          if (!usernameInput.checkValidity()) {
            dvShowFieldError(usernameInput, dvFieldMessage(usernameInput));
            usernameInput.focus();
            return;
          }
          const existing = dvFindAccountByUsername(newUsername);
          if (existing && existing.email !== (account && account.email)) {
            dvShowFieldError(usernameInput, 'That username is already taken. Try another one.');
            usernameInput.focus();
            return;
          }
          // Update the account record itself (so future signups/logins see
          // the new username), not just the display override.
          if (account) {
            const accounts = DVStore.get('auth.accounts', []);
            const idx = accounts.findIndex((a) => a.email === account.email);
            if (idx !== -1) {
              accounts[idx].username = newUsername;
              DVStore.set('auth.accounts', accounts);
            }
          }
          DVStore.set('profile.overrides', { ...DVStore.get('profile.overrides', {}), username: newUsername });
          DVStore.set('profile.usernameChangeUsed', true);
          dvToast('Username changed — that was your one-time change.');
        }
      }

      // BUG FIXED: this used to replace the whole profile.overrides object,
      // silently dropping the "username" field that signup had put there
      // (Object.assign/spread merges it with what's already stored instead
      // of throwing it away).
      DVStore.set('profile.overrides', {
        ...DVStore.get('profile.overrides', {}),
        name: document.getElementById('edit-name').value.trim() || 'You',
        bio: document.getElementById('edit-bio').value.trim(),
        avatarSeed: document.getElementById('edit-avatar').value.trim() || 'you-builder',
      });
      if (dvAwardOnce('milestone', 'profile-edited', DV_POINT_VALUES.milestone.profileEdited, 'Customized your profile')) {
        dvToast(`Profile saved (+${DV_POINT_VALUES.milestone.profileEdited} pts)`);
      } else {
        dvToast('Profile saved');
      }
      dvProfileInit();
    });
  }

  setTimeout(() => { dvAnimateCounters(root); dvReveal(root); }, 30);
}

function dvRenderProfileSquads() {
  const root = document.getElementById('profile-squads');
  if (!root) return;
  const squads = dvMySquads();
  if (!squads.length) {
    root.innerHTML = `<p class="muted">You're not part of a squad yet — head to <a href="squads.html" style="color:var(--accent);">Squads</a> to form one.</p>`;
    return;
  }
  root.innerHTML = squads.map((squad) => {
    const members = squad.members.map(dvSquadMemberInfo).filter(Boolean);
    const registered = squad.registeredHackathons.map((id) => DV_HACKATHONS.find((h) => h.id === id)).filter(Boolean);
    return `
    <div class="glass reveal in" style="padding:20px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div>
          <div style="font-weight:600; font-size:15px;">${squad.name}</div>
          <p style="font-size:12.5px; margin-top:4px;">${squad.description}</p>
        </div>
        <a href="squads.html" class="btn btn-sm btn-ghost">Manage</a>
      </div>
      <div style="display:flex; gap:-6px; margin-top:14px;">
        ${members.map((m) => `<a href="profile.html${m.isYou ? '' : '?u=' + m.handle}" title="${m.name}"><img src="${dvAvatar(m.avatarSeed, 36)}" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--bg-elevated); margin-left:-8px;"></a>`).join('')}
      </div>
      ${registered.length ? `<div class="pc-tags" style="margin-top:14px;">${registered.map((h) => `<a href="hackathon.html?id=${h.id}" class="chip chip-link">${h.title}</a>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
  dvReveal(root);
}

function dvRenderLibrary(kind) {
  const container = document.getElementById('library-container');
  if (!container) return;
  const ids = DVStore.get(kind, []);

  // Bookmarks can hold both project ids and hackathon ids (stored with
  // a "hack-" prefix — see hackathons.js / hackathon.js). Likes are
  // project-only for now, since there's no "like a hackathon" action.
  const projectIds = ids.filter((id) => !id.startsWith('hack-'));
  const hackathonIds = ids.filter((id) => id.startsWith('hack-')).map((id) => id.slice(5));
  const projects = dvAllProjects().filter((p) => projectIds.includes(p.id));
  const hackathons = kind === 'bookmarks' ? DV_HACKATHONS.filter((h) => hackathonIds.includes(h.id)) : [];

  if (!projects.length && !hackathons.length) {
    container.innerHTML = `<p class="muted">No ${kind === 'bookmarks' ? 'bookmarked' : 'liked'} projects yet — head to <a href="explore.html" style="color:var(--accent);">Explore</a> and save a few.</p>`;
    return;
  }

  let html = '';
  html += `<div style="margin-bottom:${hackathons.length ? '28px' : '0'};">
    <div class="mono muted" style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Projects (${projects.length})</div>
    ${projects.length ? `<div class="grid grid-3">${projects.map(dvProjectCardHTML).join('')}</div>` : `<p class="muted" style="font-size:13px;">None yet.</p>`}
  </div>`;
  if (kind === 'bookmarks') {
    html += `<div>
      <div class="mono muted" style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Hackathons (${hackathons.length})</div>
      ${hackathons.length ? `<div class="grid grid-3">${hackathons.map(dvHackathonCardHTML).join('')}</div>` : `<p class="muted" style="font-size:13px;">None yet.</p>`}
    </div>`;
  }
  container.innerHTML = html;
  dvReveal(container);
  dvTickCountdowns();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvProfileInit, 30));
