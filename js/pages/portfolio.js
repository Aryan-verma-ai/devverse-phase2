/* =========================================================
   PORTFOLIO BUILDER
   Two modes on one page:
   - Editor (default, when you're the signed-in owner): the form
     below, saved live to this browser.
   - Public view (portfolio.html?u=<handle>, or ?view=1 to preview
     your own): a read-only version of the same data. This is what
     gets linked from your profile page and from squad member cards,
     so teammates can actually look at someone's skills/projects
     before inviting them to a squad, instead of the page just
     sitting there unused.
   ========================================================= */

/* BUG FIXED HERE: the default (unsaved) portfolio used to ship with
   placeholder skills/links/projects/bio already filled in, purely so
   the live preview didn't look empty on a fresh visit. But
   dvCheckPortfolioMilestones() reads that same object to decide
   whether to award "added a link" / "added a project" / "wrote a
   bio" points — so the very first keystroke in ANY field triggered
   dvPortfolioSave(), which saw those placeholder values and handed
   out four milestones' worth of points before the person had
   actually added anything themselves. Defaults are empty now, so
   milestones only fire once real content exists. */
const DV_PORTFOLIO_DEFAULT = {
  name: 'Your Name',
  title: 'Full-stack Developer',
  bio: '',
  avatarSeed: 'portfolio-builder',
  accent: '#7c6fff',
  skills: [],
  links: [],
  projects: [],
};

function dvPortfolioData() {
  return DVStore.get('portfolio', DV_PORTFOLIO_DEFAULT);
}
function dvPortfolioSave(data) {
  DVStore.set('portfolio', data);
  dvCheckPortfolioMilestones(data);
  dvRenderPortfolioPreview();
}

/** One-time milestone rewards for portfolio progress. Guarded by
 *  dvAwardOnce so adding-then-removing-then-adding the same skill
 *  can't be used to farm points — each milestone can only ever fire
 *  once, no matter how the underlying arrays change afterward. */
function dvCheckPortfolioMilestones(d) {
  const mv = DV_POINT_VALUES.milestone;
  const fire = (key, condition, amount, reason) => {
    if (condition && dvAwardOnce('milestone', key, amount, reason)) {
      dvToast(`${reason} (+${amount} pts)`);
    }
  };
  fire('first-skill', d.skills.length >= 1, mv.firstSkill, 'Added your first skill');
  fire('three-skills', d.skills.length >= 3, mv.threeSkills, 'Built out your skill set');
  fire('first-link', d.links.length >= 1, mv.firstLink, 'Added a social link');
  fire('first-project', d.projects.length >= 1, mv.firstProject, 'Added a project to your portfolio');
  fire('wrote-bio', (d.bio || '').trim().length >= 20, mv.bio, 'Wrote a bio');
  fire('portfolio-complete', d.skills.length >= 3 && d.links.length >= 1 && d.projects.length >= 1 && (d.bio || '').trim().length >= 20, mv.portfolioComplete, 'Completed your portfolio');
}

function dvPortfolioInit() {
  const root = document.getElementById('portfolio-root');
  if (!root) return;

  if (!dvIsLoggedIn()) {
    dvToast('Sign in to view portfolios');
    window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
    return;
  }

  const selfHandle = dvSelfHandle();

  const requestedHandle = dvGetQueryParam('u');
  const forcePreview = dvGetQueryParam('view') === '1';
  const isOwnHandle = !requestedHandle || requestedHandle === 'you' || requestedHandle === selfHandle;

  if (!isOwnHandle || forcePreview) {
    dvRenderPublicPortfolio(root, requestedHandle || selfHandle, selfHandle);
    return;
  }

  dvRenderPortfolioEditor(root, selfHandle);
}

/* ---------- Public, read-only view ----------
   Reuses dvSquadMemberInfo() (already used to show squad member cards)
   as the single source of truth for "everything we actually have"
   about a builder — real portfolio data for you, seeded skills/
   projects for demo devs. Doesn't invent links or a title for demo
   devs we don't have that data for. */
function dvRenderPublicPortfolio(root, handle, selfHandle) {
  const eyebrow = document.getElementById('pf-page-eyebrow');
  const heading = document.getElementById('pf-page-title');
  const lede = document.getElementById('pf-page-lede');
  const info = dvSquadMemberInfo(handle);

  if (!info) {
    if (eyebrow) eyebrow.textContent = 'Portfolio';
    if (heading) heading.textContent = 'Not found';
    if (lede) lede.textContent = `There's no portfolio for "@${handle}" on DevVerse.`;
    root.innerHTML = `<div class="glass reveal in" style="padding:40px; text-align:center;"><p class="muted">Double-check the link, or explore other builders instead.</p><a href="explore.html" class="btn btn-ghost" style="margin-top:14px;">Back to Explore</a></div>`;
    dvReveal(root);
    return;
  }

  const isSelf = info.handle === selfHandle || info.isYou;
  const extra = info.isYou ? dvPortfolioData() : null;
  const accent = (extra && extra.accent) || '#7c6fff';
  const roleLine = extra && extra.title ? extra.title : null;
  const links = extra && extra.links ? extra.links : [];

  if (eyebrow) eyebrow.textContent = 'Public portfolio';
  if (heading) heading.textContent = info.name;
  if (lede) lede.textContent = isSelf
    ? 'This is exactly what squadmates and visitors see when they look you up.'
    : `A look at what @${info.handle} has built on DevVerse.`;

  root.innerHTML = `
    <div class="detail-grid detail-grid--even">
      <div class="sticky-panel">
        <div class="glass reveal in" style="padding:28px; border-radius:var(--radius-lg); background:radial-gradient(circle at 20% 0%, ${accent}22, transparent 60%), var(--bg-panel); border:1px solid var(--border);">
          <div style="display:flex; align-items:center; gap:14px;">
            <img src="${dvAvatar(info.avatarSeed, 76)}" style="width:64px;height:64px;border-radius:50%; border:2px solid ${accent};">
            <div>
              <div style="font-family:var(--font-display); font-size:19px; font-weight:700;">${info.name}</div>
              ${roleLine ? `<div class="mono" style="font-size:12.5px; color:${accent};">${roleLine}</div>` : `<div class="mono muted" style="font-size:12.5px;">@${info.handle}</div>`}
            </div>
          </div>
          <div style="margin-top:14px;">${dvTierBadgeHTML(info.points)}</div>
          <p style="margin-top:16px; font-size:13.5px;">${info.bio || 'No bio yet.'}</p>
          <div class="pc-tags" style="margin-top:14px;">${info.skills.length
            ? info.skills.map((s) => `<span class="chip" style="border-color:${accent}55;">${s}</span>`).join('')
            : `<span class="muted" style="font-size:12.5px;">No skills listed yet.</span>`}</div>
          ${links.length ? `<div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">${links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="chip chip-link mono">${l.label} ↗</a>`).join('')}</div>` : ''}
          <div style="display:flex; gap:10px; margin-top:22px; flex-wrap:wrap;">
            <a href="profile.html${info.isYou ? '' : '?u=' + info.handle}" class="btn btn-ghost btn-sm">Full profile</a>
            <button class="btn btn-outline btn-sm" id="pf-copy-link">Copy link</button>
            ${isSelf ? `<a href="portfolio.html" class="btn btn-primary btn-sm">Edit your portfolio</a>` : ''}
          </div>
        </div>
      </div>

      <div>
        <div class="eyebrow" style="margin-bottom:14px;">Projects</div>
        ${info.projects.length
          ? `<div style="display:flex; flex-direction:column; gap:10px;">${info.projects.map((p) => `<div class="glass" style="padding:14px 16px;"><div style="font-size:13.5px; font-weight:600;">${p.title}</div><div class="muted" style="font-size:12px; margin-top:2px;">${p.desc || ''}</div></div>`).join('')}</div>`
          : `<p class="muted">No projects listed yet.</p>`}
        <div class="mono muted" style="margin-top:26px; padding:18px 20px; border-radius:var(--radius-md); background:var(--surface); border:1px solid var(--border); font-size:12px;">
          ${isSelf
            ? 'This is the page a squad invite or your profile links to \u2014 keep it current before a hackathon. Heads up: there\u2019s no real backend behind DevVerse, so this link only shows your real data when opened in this same browser/account.'
            : `Recruiting for a hackathon squad? Head to the Squads page to invite @${info.handle} directly.`}
        </div>
      </div>
    </div>`;

  const copyBtn = document.getElementById('pf-copy-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const url = window.location.origin + window.location.pathname + '?u=' + encodeURIComponent(info.handle);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      }
      dvToast('Portfolio link copied');
    });
  }

  dvReveal(root);
}

/* ---------- Editor ---------- */
function dvPortfolioEditorHTML() {
  return `
    <div style="display:inline-flex; flex-wrap:wrap; align-items:center; gap:14px; max-width:100%; margin-bottom:20px; padding:14px 20px;" class="glass">
      <p style="font-size:12.5px; margin:0; max-width:46ch;" class="muted">Share this so squadmates and visitors can see your work \u2014 note this demo has no shared backend, so the link only shows your real data in this same browser/account.</p>
      <div style="display:flex; gap:10px; flex-shrink:0;">
        <button class="btn btn-outline btn-sm" id="pf-copy-link-editor" type="button">Copy link</button>
        <a class="btn btn-ghost btn-sm" id="pf-preview-link" href="portfolio.html?view=1">Preview as visitors see it</a>
      </div>
    </div>
    <div class="detail-grid detail-grid--even">

      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="glass" style="padding:22px;">
          <h3 style="margin-bottom:16px;">Basics</h3>
          <div class="field"><label for="pf-name">Name</label><input id="pf-name" required minlength="2" data-error-required="Your portfolio needs a name." data-error-minlength="Name should be at least 2 characters."></div>
          <div class="field"><label for="pf-title">Title / role</label><input id="pf-title" placeholder="e.g. Full-stack Developer"></div>
          <div class="field"><label for="pf-bio">Bio</label><textarea id="pf-bio" rows="3" placeholder="A couple of sentences about what you build and what you're into."></textarea></div>
          <div class="grid grid-2">
            <div class="field"><label for="pf-avatar">Avatar seed</label><input id="pf-avatar"></div>
            <div class="field"><label for="pf-accent">Accent color</label><input type="color" id="pf-accent"></div>
          </div>
          <div class="field">
            <label for="pf-avatar-file">Upload profile image (preview only — no server to store uploads yet)</label>
            <input type="file" id="pf-avatar-file" accept="image/*">
          </div>
        </div>

        <form class="glass" style="padding:22px;" id="pf-skill-form" novalidate>
          <h3 style="margin-bottom:16px;">Skills</h3>
          <div class="pc-tags" id="pf-skills" style="margin-bottom:14px;"></div>
          <div style="display:flex; gap:10px; align-items:flex-start;">
            <div class="field" style="flex:1; margin-bottom:0;">
              <input id="pf-skill-input" placeholder="e.g. TypeScript" required minlength="2" data-error-required="Enter a skill before adding it." data-error-minlength="Skill names need at least 2 characters.">
            </div>
            <button class="btn btn-primary btn-sm" type="submit">Add</button>
          </div>
        </form>

        <form class="glass" style="padding:22px;" id="pf-link-form" novalidate>
          <h3 style="margin-bottom:16px;">Social links</h3>
          <div id="pf-links-list" style="margin-bottom:14px;"></div>
          <div class="grid grid-2" style="margin-bottom:4px; align-items:start;">
            <div class="field">
              <input id="pf-link-label" placeholder="Label (e.g. GitHub)" required data-error-required="Give this link a label.">
            </div>
            <div class="field">
              <input id="pf-link-url" type="url" placeholder="https://…" required data-error-required="Add the URL for this link.">
            </div>
          </div>
          <button class="btn btn-primary btn-sm" type="submit">Add link</button>
        </form>

        <form class="glass" style="padding:22px;" id="pf-project-form" novalidate>
          <h3 style="margin-bottom:16px;">Projects</h3>
          <div id="pf-projects-list" style="margin-bottom:14px;"></div>
          <div class="field"><label for="pf-project-title">Title</label><input id="pf-project-title" required minlength="3" data-error-required="Give your project a title." data-error-minlength="Title should be at least 3 characters."></div>
          <div class="field"><label for="pf-project-desc">Description</label><textarea id="pf-project-desc" rows="2"></textarea></div>
          <button class="btn btn-primary btn-sm" type="submit">Add project</button>
        </form>
      </div>

      <div class="sticky-panel">
        <div class="eyebrow">Live preview</div>
        <div id="pf-preview"></div>
      </div>
    </div>`;
}

function dvRenderPortfolioEditor(root, selfHandle) {
  const eyebrow = document.getElementById('pf-page-eyebrow');
  const heading = document.getElementById('pf-page-title');
  const lede = document.getElementById('pf-page-lede');
  if (eyebrow) eyebrow.textContent = 'Build your legend';
  if (heading) heading.textContent = 'Portfolio Builder';
  if (lede) lede.textContent = 'Everything you enter here is saved to this browser and reflected instantly in the live preview \u2014 and it\u2019s what shows up when squadmates or visitors check out your work.';

  root.innerHTML = dvPortfolioEditorHTML();

  const data = dvPortfolioData();

  document.getElementById('pf-name').value = data.name;
  document.getElementById('pf-title').value = data.title;
  document.getElementById('pf-bio').value = data.bio;
  document.getElementById('pf-avatar').value = data.avatarSeed;
  document.getElementById('pf-accent').value = data.accent;

  document.getElementById('pf-preview-link').href = 'portfolio.html?u=' + encodeURIComponent(selfHandle) + '&view=1';
  document.getElementById('pf-copy-link-editor').addEventListener('click', function () {
    const url = window.location.origin + window.location.pathname + '?u=' + encodeURIComponent(selfHandle);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    }
    dvToast('Portfolio link copied');
  });

  document.getElementById('pf-name').addEventListener('blur', function () {
    dvClearFieldError(this);
    if (!this.checkValidity()) dvShowFieldError(this, dvFieldMessage(this));
  });
  ['pf-name', 'pf-title', 'pf-bio', 'pf-avatar', 'pf-accent'].forEach((id) => {
    document.getElementById(id).addEventListener('input', function () {
      if (this.classList.contains('field-error')) dvClearFieldError(this);
      dvPortfolioSyncBasics();
    });
  });

  dvRenderSkillChips();
  document.getElementById('pf-skill-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('pf-skill-input');
    if (!dvValidateForm(e.target)) return;
    const d = dvPortfolioData();
    d.skills.push(input.value.trim());
    dvPortfolioSave(d);
    e.target.reset();
    dvRenderSkillChips();
  });

  dvRenderLinks();
  document.getElementById('pf-link-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!dvValidateForm(e.target)) return;
    const label = document.getElementById('pf-link-label').value.trim();
    let url = document.getElementById('pf-link-url').value.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const d = dvPortfolioData();
    d.links.push({ label, url });
    dvPortfolioSave(d);
    e.target.reset();
    dvRenderLinks();
  });

  dvRenderPortfolioProjects();
  document.getElementById('pf-project-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!dvValidateForm(e.target)) return;
    const title = document.getElementById('pf-project-title').value.trim();
    const desc = document.getElementById('pf-project-desc').value.trim();
    const d = dvPortfolioData();
    d.projects.push({ title, desc });
    dvPortfolioSave(d);
    e.target.reset();
    dvRenderPortfolioProjects();
  });

  document.getElementById('pf-avatar-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    dvToast(`Selected "${file.name}" — using generated avatar preview (no backend to store uploads yet)`);
  });

  dvRenderPortfolioPreview();
  dvReveal(root);
}

function dvPortfolioSyncBasics() {
  const d = dvPortfolioData();
  d.name = document.getElementById('pf-name').value || DV_PORTFOLIO_DEFAULT.name;
  d.title = document.getElementById('pf-title').value;
  d.bio = document.getElementById('pf-bio').value;
  d.avatarSeed = document.getElementById('pf-avatar').value || 'portfolio-builder';
  d.accent = document.getElementById('pf-accent').value;
  dvPortfolioSave(d);
}

function dvRenderSkillChips() {
  const root = document.getElementById('pf-skills');
  if (!root) return;
  const d = dvPortfolioData();
  root.innerHTML = d.skills.map((s, i) => `<span class="chip chip-accent">${s} <button data-remove-skill="${i}" style="background:none;border:none;color:inherit;cursor:pointer;margin-left:4px;">×</button></span>`).join('');
  root.querySelectorAll('[data-remove-skill]').forEach((btn) => btn.addEventListener('click', () => {
    const d2 = dvPortfolioData();
    d2.skills.splice(parseInt(btn.dataset.removeSkill, 10), 1);
    dvPortfolioSave(d2);
    dvRenderSkillChips();
  }));
}

function dvRenderLinks() {
  const root = document.getElementById('pf-links-list');
  if (!root) return;
  const d = dvPortfolioData();
  root.innerHTML = d.links.length
    ? d.links.map((l, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--border); font-size:13.5px; gap:10px;">
        <span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><b>${l.label}</b> <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="muted mono" style="font-size:11.5px;">${l.url}</a></span>
        <button class="btn btn-sm btn-ghost" data-remove-link="${i}" style="flex-shrink:0;">Remove</button>
      </div>`).join('')
    : `<p class="muted" style="font-size:12.5px;">No links added yet.</p>`;
  root.querySelectorAll('[data-remove-link]').forEach((btn) => btn.addEventListener('click', () => {
    const d2 = dvPortfolioData();
    d2.links.splice(parseInt(btn.dataset.removeLink, 10), 1);
    dvPortfolioSave(d2);
    dvRenderLinks();
  }));
}

function dvRenderPortfolioProjects() {
  const root = document.getElementById('pf-projects-list');
  if (!root) return;
  const d = dvPortfolioData();
  root.innerHTML = d.projects.map((p, i) => `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:9px 0; border-bottom:1px solid var(--border);">
      <div><div style="font-size:13.5px; font-weight:600;">${p.title}</div><div class="muted" style="font-size:12px;">${p.desc || ''}</div></div>
      <button class="btn btn-sm btn-ghost" data-remove-project="${i}">Remove</button>
    </div>`).join('');
  root.querySelectorAll('[data-remove-project]').forEach((btn) => btn.addEventListener('click', () => {
    const d2 = dvPortfolioData();
    d2.projects.splice(parseInt(btn.dataset.removeProject, 10), 1);
    dvPortfolioSave(d2);
    dvRenderPortfolioProjects();
  }));
}

function dvRenderPortfolioPreview() {
  const root = document.getElementById('pf-preview');
  if (!root) return;
  const d = dvPortfolioData();
  root.innerHTML = `
    <div style="padding:28px; border-radius:var(--radius-lg); background:radial-gradient(circle at 20% 0%, ${d.accent}22, transparent 60%), var(--bg-panel); border:1px solid var(--border);">
      <div style="display:flex; align-items:center; gap:14px;">
        <img src="${dvAvatar(d.avatarSeed, 76)}" style="width:64px;height:64px;border-radius:50%; border:2px solid ${d.accent};">
        <div>
          <div style="font-family:var(--font-display); font-size:19px; font-weight:700;">${d.name}</div>
          <div class="mono" style="font-size:12.5px; color:${d.accent};">${d.title}</div>
        </div>
      </div>
      <p style="margin-top:16px; font-size:13.5px;">${d.bio || '<span class="muted">Add a short bio so visitors know what you build.</span>'}</p>
      <div class="pc-tags" style="margin-top:14px;">${d.skills.length ? d.skills.map((s) => `<span class="chip" style="border-color:${d.accent}55;">${s}</span>`).join('') : '<span class="muted" style="font-size:12.5px;">No skills yet — add your first one on the left.</span>'}</div>
      <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
        ${d.links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="chip chip-link mono">${l.label} ↗</a>`).join('')}
      </div>
      <div style="margin-top:20px; display:flex; flex-direction:column; gap:10px;">
        ${d.projects.map((p) => `<div style="padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--border);"><div style="font-size:13px; font-weight:600;">${p.title}</div><div class="muted" style="font-size:12px; margin-top:2px;">${p.desc || ''}</div></div>`).join('')}
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvPortfolioInit, 30));
