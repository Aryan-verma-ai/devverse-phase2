/* =========================================================
   SQUADS
   Two halves on one page: a compatibility matcher (unchanged
   algorithm from the original Team Finder, just renamed), and
   real squad formation/management — creating a team, messaging
   members, and registering a squad for hackathons together.
   Squad/messaging data access itself lives in app.js since the
   Profile page needs to display "your squads" too.
   ========================================================= */

const DV_SQUAD_FINDER_DEFAULT = { skills: [], categories: [], style: 'either' };

function dvSquadFinderProfile() {
  return DVStore.get('squadFinder.profile', DV_SQUAD_FINDER_DEFAULT);
}
function dvSquadFinderSave(profile) {
  DVStore.set('squadFinder.profile', profile);
  if (profile.skills.length >= 3 && dvAwardOnce('milestone', 'team-profile', DV_POINT_VALUES.milestone.teamProfile, 'Built your squad-matching profile')) {
    dvToast(`Profile saved (+${DV_POINT_VALUES.milestone.teamProfile} pts)`);
  }
}

/** Pulls the full set of skills that appear anywhere in DV_DEVS, so
 *  the selectable list always matches what real matching is based
 *  on rather than drifting out of sync with a separately hardcoded
 *  vocabulary. Built with plain nested loops — no Set. */
function dvAllDevSkills() {
  const skills = [];
  for (const d of DV_DEVS) {
    for (const s of d.skills) {
      if (skills.indexOf(s) === -1) skills.push(s);
    }
  }
  return skills;
}

/** Which project categories has this developer actually built in? */
function dvDevCategories(handle) {
  const cats = [];
  for (const p of DV_PROJECTS) {
    if (p.author === handle && cats.indexOf(p.category) === -1) cats.push(p.category);
  }
  return cats;
}

/** The core scoring algorithm. Everyone starts with a small baseline
 *  (you're both already building on the same platform), then earns
 *  points for shared skills (capped, so pure overlap can't dominate),
 *  points for skills they'd bring that you don't have (also capped),
 *  and a bonus if their work overlaps a category you said you're
 *  into. Weights shift based on `style` so "similar skill level" and
 *  "complementary skills" genuinely produce different rankings. */
function dvComputeMatches(profile) {
  const mySkills = profile.skills;
  const myCategories = profile.categories;
  const style = profile.style;

  const overlapWeight = style === 'similar' ? 18 : style === 'complement' ? 8 : 12;
  const complementWeight = style === 'complement' ? 18 : style === 'similar' ? 8 : 14;
  const categoryBonus = 20;
  const baseline = 10;
  const maxPossible = 2 * overlapWeight + 3 * complementWeight + categoryBonus + baseline;

  const matches = [];
  for (const dev of DV_DEVS) {
    const shared = [];
    const fresh = [];
    for (const skill of dev.skills) {
      if (mySkills.indexOf(skill) === -1) fresh.push(skill);
      else shared.push(skill);
    }

    const devCategories = dvDevCategories(dev.handle);
    let categoryMatch = null;
    for (const cat of devCategories) {
      if (myCategories.indexOf(cat) !== -1) { categoryMatch = cat; break; }
    }

    const rawScore =
      Math.min(shared.length, 2) * overlapWeight +
      Math.min(fresh.length, 3) * complementWeight +
      (categoryMatch ? categoryBonus : 0) +
      baseline;
    const percent = Math.min(100, Math.round((rawScore / maxPossible) * 100));

    let suggested = null;
    if (categoryMatch) {
      const catKey = categoryMatch.toLowerCase().split('/')[0];
      for (const h of DV_HACKATHONS) {
        if (h.tags[0].toLowerCase().indexOf(catKey) !== -1) { suggested = h; break; }
      }
    }
    if (!suggested) suggested = DV_HACKATHONS[0];

    matches.push({ dev, percent, shared, fresh, categoryMatch, suggested });
  }

  matches.sort((a, b) => b.percent - a.percent);
  return matches;
}

function dvSquadsInit() {
  const root = document.getElementById('squads-root');
  if (!root) return;

  if (!dvIsLoggedIn()) {
    dvToast('Sign in to use Squads');
    window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
    return;
  }

  const profile = dvSquadFinderProfile();
  const allSkills = dvAllDevSkills();
  const allCategories = dvUniqueArray(DV_PROJECTS.map((p) => p.category));

  root.innerHTML = `
    <div class="glass reveal in" style="padding:26px; margin-bottom:26px;">
      <h3 style="margin-bottom:6px;">Your matching profile</h3>
      <p style="font-size:13px; margin-bottom:20px;">Pick what you bring and what you're into — this is saved locally and reused every time you visit.</p>

      <div style="margin-bottom:20px;">
        <div class="eyebrow" style="margin-bottom:10px;">Your skills</div>
        <div class="pc-tags" id="sq-skill-chips"></div>
      </div>

      <div style="margin-bottom:20px;">
        <div class="eyebrow" style="margin-bottom:10px;">Categories you're into</div>
        <div class="pc-tags" id="sq-category-chips"></div>
      </div>

      <div>
        <div class="eyebrow" style="margin-bottom:10px;">What are you looking for?</div>
        <div class="pill-toggle" id="sq-style-toggle">
          <button data-style="similar">Similar skill level</button>
          <button data-style="either">Either works</button>
          <button data-style="complement">Complementary skills</button>
        </div>
      </div>
    </div>

    <div class="glass reveal in" style="padding:20px; margin-bottom:26px;">
      <h3 style="margin-bottom:12px;">How matching works</h3>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
        <div style="display:flex; justify-content:space-between;"><span>Shared skill with you (up to 2 count)</span><span class="mono chip" id="sq-weight-overlap"></span></div>
        <div style="display:flex; justify-content:space-between;"><span>New skill they'd bring (up to 3 count)</span><span class="mono chip" id="sq-weight-complement"></span></div>
        <div style="display:flex; justify-content:space-between;"><span>Their work matches a category you're into</span><span class="mono chip">+20</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Baseline — you're both building on DevVerse</span><span class="mono chip">+10</span></div>
      </div>
      <p class="muted" style="font-size:11.5px; margin-top:12px;">Switching "what you're looking for" reweights every match live — it's not just cosmetic.</p>
    </div>

    <div class="eyebrow" style="margin-bottom:16px;">Your matches</div>
    <div id="sq-matches" style="margin-bottom:40px;"></div>

    <div class="eyebrow" style="margin-bottom:16px;">Your squads</div>
    <div id="sq-my-squads" style="margin-bottom:26px;"></div>

    <form class="glass reveal in" id="squad-create-form" novalidate style="padding:24px;">
      <h3 style="margin-bottom:6px;">Create a squad</h3>
      <p style="font-size:12.5px; margin-bottom:16px;">A squad can be just you, or you plus anyone from the matches above — any size works.</p>
      <div class="field">
        <label for="squad-name-input">Squad name</label>
        <input id="squad-name-input" required minlength="3" data-error-required="Give your squad a name." data-error-minlength="Names need at least 3 characters.">
      </div>
      <div class="field">
        <label for="squad-desc-input">Description</label>
        <textarea id="squad-desc-input" rows="2" required minlength="10" data-error-required="Describe what this squad is building or looking for." data-error-minlength="Write at least 10 characters."></textarea>
      </div>
      <div class="field">
        <label>Members</label>
        <div class="pc-tags" id="squad-member-chips"></div>
      </div>
      <button class="btn btn-primary btn-sm" type="submit">Create squad</button>
    </form>
  `;

  const pendingFromUrl = dvGetQueryParam('newSquadWith');
  if (pendingFromUrl) dvPendingSquadMember = pendingFromUrl;

  dvRenderSquadSkillChips(allSkills, profile);
  dvRenderSquadCategoryChips(allCategories, profile);
  dvRenderStyleToggle(profile);
  dvRenderMatches();
  dvRenderMySquads();
  dvRenderSquadMemberChips();

  if (pendingFromUrl) {
    const createForm = document.getElementById('squad-create-form');
    if (createForm) setTimeout(() => createForm.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
  }

  document.getElementById('squad-create-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!dvValidateForm(e.target)) return;
    const name = document.getElementById('squad-name-input').value.trim();
    const desc = document.getElementById('squad-desc-input').value.trim();
    const memberHandles = Array.prototype.slice.call(document.querySelectorAll('#squad-member-chips [data-squad-member].chip-accent')).map((el) => el.dataset.squadMember);
    dvCreateSquad(name, desc, memberHandles);
    dvToast(`${name} squad created (+${DV_POINT_VALUES.squadFormed} pts)`);
    e.target.reset();
    dvPendingSquadMember = null;
    dvRenderSquadMemberChips();
    dvRenderMySquads();
  });

  dvReveal(root);
}

function dvRenderSquadSkillChips(allSkills, profile) {
  const root = document.getElementById('sq-skill-chips');
  root.innerHTML = allSkills.map((s) => `<button class="chip tf-toggle-chip ${profile.skills.indexOf(s) !== -1 ? 'chip-accent' : ''}" data-sq-skill="${s}">${s}</button>`).join('');
  root.querySelectorAll('[data-sq-skill]').forEach((btn) => btn.addEventListener('click', () => {
    const p = dvSquadFinderProfile();
    const skill = btn.dataset.sqSkill;
    const idx = p.skills.indexOf(skill);
    if (idx === -1) p.skills.push(skill);
    else p.skills.splice(idx, 1);
    dvSquadFinderSave(p);
    btn.classList.toggle('chip-accent');
    dvRenderMatches();
  }));
}

function dvRenderSquadCategoryChips(allCategories, profile) {
  const root = document.getElementById('sq-category-chips');
  root.innerHTML = allCategories.map((c) => `<button class="chip tf-toggle-chip ${profile.categories.indexOf(c) !== -1 ? 'chip-accent' : ''}" data-sq-category="${c}">${c}</button>`).join('');
  root.querySelectorAll('[data-sq-category]').forEach((btn) => btn.addEventListener('click', () => {
    const p = dvSquadFinderProfile();
    const cat = btn.dataset.sqCategory;
    const idx = p.categories.indexOf(cat);
    if (idx === -1) p.categories.push(cat);
    else p.categories.splice(idx, 1);
    dvSquadFinderSave(p);
    btn.classList.toggle('chip-accent');
    dvRenderMatches();
  }));
}

function dvRenderStyleToggle(profile) {
  const root = document.getElementById('sq-style-toggle');
  root.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.style === profile.style);
    btn.addEventListener('click', () => {
      const p = dvSquadFinderProfile();
      p.style = btn.dataset.style;
      dvSquadFinderSave(p);
      root.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      dvUpdateWeightLabels(p.style);
      dvRenderMatches();
    });
  });
  dvUpdateWeightLabels(profile.style);
}

function dvUpdateWeightLabels(style) {
  const overlapWeight = style === 'similar' ? 18 : style === 'complement' ? 8 : 12;
  const complementWeight = style === 'complement' ? 18 : style === 'similar' ? 8 : 14;
  document.getElementById('sq-weight-overlap').textContent = `+${overlapWeight}`;
  document.getElementById('sq-weight-complement').textContent = `+${complementWeight}`;
}

function dvRenderMatches() {
  const root = document.getElementById('sq-matches');
  const profile = dvSquadFinderProfile();

  if (profile.skills.length === 0) {
    root.innerHTML = `<p class="muted">Select a few skills above to see your matches.</p>`;
    return;
  }

  const matches = dvComputeMatches(profile);

  root.innerHTML = matches.map((m) => `
    <div class="glass card-lift reveal in tf-match-card" style="padding:22px; margin-bottom:16px;">
      <div style="display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap;">
        <img src="${dvAvatar(m.dev.avatarSeed, 60)}" style="width:56px;height:56px;border-radius:50%; flex-shrink:0;">
        <div style="flex:1; min-width:220px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap;">
            <div>
              <div style="font-weight:600; font-size:15.5px;">${m.dev.name}</div>
              <div class="mono muted" style="font-size:12px;">@${m.dev.handle}</div>
            </div>
            <div style="text-align:right;">
              <div class="mono" style="font-size:22px; font-weight:700; color:var(--accent);">${m.percent}%</div>
              <div class="mono muted" style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em;">compatible</div>
            </div>
          </div>
          <div class="bar-track" style="margin-top:10px;"><div class="bar-fill" style="width:${m.percent}%"></div></div>

          <div style="display:flex; flex-wrap:wrap; gap:18px; margin-top:16px;">
            <div style="min-width:150px;">
              <div class="mono muted" style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">You both know</div>
              ${m.shared.length ? `<div class="pc-tags">${m.shared.map((s) => `<span class="chip chip-accent">${s}</span>`).join('')}</div>` : `<p class="muted" style="font-size:12px;">Nothing in common yet.</p>`}
            </div>
            <div style="min-width:150px;">
              <div class="mono muted" style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">They'd bring</div>
              ${m.fresh.length ? `<div class="pc-tags">${m.fresh.map((s) => `<span class="chip">${s}</span>`).join('')}</div>` : `<p class="muted" style="font-size:12px;">—</p>`}
            </div>
          </div>

          ${m.categoryMatch ? `<p style="font-size:12.5px; margin-top:14px;">Builds in <b>${m.categoryMatch}</b> — a category you're into. Might be a fit for <a href="hackathon.html?id=${m.suggested.id}" style="color:var(--accent);">${m.suggested.title}</a>.</p>` : ''}

          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <a href="profile.html?u=${m.dev.handle}" class="btn btn-sm btn-ghost">View profile</a>
            ${dvSquadAndMessageActionsHTML(m.dev.handle, m.dev.name)}
          </div>
        </div>
      </div>
    </div>`).join('');

  dvReveal(root);
}

function dvRenderSquadMemberChips() {
  const root = document.getElementById('squad-member-chips');
  if (!root) return;
  root.innerHTML = `<span class="chip chip-accent">You</span>` + DV_DEVS.map((d) => `
    <button type="button" class="chip tf-toggle-chip ${d.handle === dvPendingSquadMember ? 'chip-accent' : ''}" data-squad-member="${d.handle}">${d.name}</button>`).join('');
  root.querySelectorAll('[data-squad-member]').forEach((btn) => btn.addEventListener('click', () => {
    btn.classList.toggle('chip-accent');
  }));
}

function dvRenderMySquads() {
  const root = document.getElementById('sq-my-squads');
  if (!root) return;
  const squads = dvMySquads();

  if (!squads.length) {
    root.innerHTML = `<p class="muted">You're not in a squad yet — create one below, or add someone to a new squad straight from your matches.</p>`;
    return;
  }

  root.innerHTML = squads.map((squad) => dvSquadCardHTML(squad)).join('');
  dvReveal(root);
}

function dvSquadCardHTML(squad) {
  const members = squad.members.map(dvSquadMemberInfo).filter(Boolean);
  const registered = squad.registeredHackathons.map((id) => DV_HACKATHONS.find((h) => h.id === id)).filter(Boolean);
  const availableHackathons = DV_HACKATHONS.filter((h) => squad.registeredHackathons.indexOf(h.id) === -1);

  return `
  <div class="glass reveal in squad-card" style="padding:24px; margin-bottom:20px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap;">
      <div>
        <h3>${squad.name}</h3>
        <p style="font-size:13px; margin-top:4px;">${squad.description}</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="chip">${members.length}-person squad</span>
        <button class="btn btn-sm btn-ghost" data-leave-squad="${squad.id}" style="color:var(--coral);">Leave</button>
      </div>
    </div>

    <div class="squad-members" style="margin-top:18px;">
      ${members.map((m) => `
        <div class="squad-member-card">
          <img src="${dvAvatar(m.avatarSeed, 44)}" style="width:40px;height:40px;border-radius:50%;">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <a href="profile.html${m.isYou ? '' : '?u=' + m.handle}" style="font-size:13.5px; font-weight:600; color:var(--text-primary);">${m.name}</a>
              ${dvTierBadgeHTML(m.points)}
            </div>
            <div class="mono muted" style="font-size:11px; margin:4px 0;">${m.skills.slice(0, 3).join(', ') || 'No skills listed'}</div>
            <div style="font-size:11.5px; color:var(--text-tertiary);">${m.projects.length ? `${m.projects.length} project${m.projects.length === 1 ? '' : 's'}: ${m.projects.map((p) => p.title).join(', ')}` : 'No projects yet'}</div>
          </div>
          <a href="portfolio.html${m.isYou ? '' : '?u=' + m.handle}" class="chip chip-link" style="flex-shrink:0;" title="See ${m.name}'s full portfolio before the next hackathon">Portfolio</a>
        </div>`).join('')}
    </div>

    <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border);">
      <div class="eyebrow" style="margin-bottom:10px;">Registered hackathons</div>
      ${registered.length
        ? `<div class="pc-tags" style="margin-bottom:14px;">${registered.map((h) => `<a href="hackathon.html?id=${h.id}" class="chip chip-link">${h.title}</a>`).join('')}</div>`
        : `<p class="muted" style="font-size:12.5px; margin-bottom:14px;">Not registered for anything yet.</p>`}
      ${availableHackathons.length ? `
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        <select id="squad-hackathon-select-${squad.id}" class="select-compact">
          ${availableHackathons.map((h) => `<option value="${h.id}">${h.title}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary" data-register-squad="${squad.id}">Register squad</button>
      </div>` : `<p class="muted" style="font-size:12px;">Registered for every current hackathon.</p>`}
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSquadsInit, 30));
