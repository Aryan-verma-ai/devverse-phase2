/* =========================================================
   THE CODEX
   Locked until 200 points. Once unlocked: browse/search/filter
   every field note, and contribute your own.
   ========================================================= */

let dvCodexCategoryFilter = 'All';

function dvCodexInit() {
  const root = document.getElementById('codex-root');
  if (!root) return;

  if (!dvIsLoggedIn()) {
    dvToast('Sign in to view the Codex');
    window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
    return;
  }

  if (!dvCodexUnlocked()) {
    dvRenderCodexLocked(root);
    return;
  }

  dvRenderCodexUnlocked(root);
}

function dvRenderCodexLocked(root) {
  const points = dvPointsTotal();
  const required = 200;
  root.innerHTML = `
    <div class="glass reveal in codex-locked-panel" style="padding:60px 36px; text-align:center;">
      <div style="font-size:44px; margin-bottom:14px;">🔒</div>
      <h2 style="margin-bottom:10px;">The Codex is sealed.</h2>
      <p class="lede" style="margin:0 auto 26px; max-width:460px;">A living archive of real bugs, real mistakes, and real lessons — written only by developers who've proven it through sustained contribution. Reach 200 points to unlock it.</p>
      <div class="bar-track" style="max-width:360px; margin:0 auto 10px;"><div class="bar-fill" style="width:${Math.min(100, (points / required) * 100)}%"></div></div>
      <p class="mono muted" style="font-size:12.5px;">${points} / ${required} pts to unlock</p>
      <a href="leaderboard.html" class="btn btn-primary" style="margin-top:26px;">See how points work</a>
    </div>
  `;
  dvReveal(root);
}

function dvRenderCodexUnlocked(root) {
  const entries = dvCodexEntries();
  const categories = dvUniqueArray(entries.map((e) => e.category));

  root.innerHTML = `
    <div class="glass reveal in" style="padding:22px; margin-bottom:26px;">
      <div class="eyebrow" style="margin-bottom:6px;">👑 You're in</div>
      <p style="font-size:13.5px;">You've earned write access. Every entry here is a real (if illustrative) account of something that went wrong and what it taught — add your own below.</p>
    </div>

    <div class="glass reveal in" style="padding:18px 22px; margin-bottom:22px;">
      <div class="search-wrap" style="margin-bottom:14px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        <input type="text" id="codex-search" placeholder="Search the Codex…">
      </div>
      <div class="pc-tags" id="codex-category-filters"></div>
    </div>

    <div id="codex-entries" style="margin-bottom:40px;"></div>

    <form class="glass reveal in" id="codex-form" novalidate style="padding:26px;">
      <h3 style="margin-bottom:14px;">Add an entry</h3>
      <div class="grid grid-2">
        <div class="field">
          <label for="codex-title">Title</label>
          <input id="codex-title" required minlength="8" data-error-required="Give this entry a title." data-error-minlength="Titles need at least 8 characters.">
        </div>
        <div class="field">
          <label for="codex-category">Category</label>
          <select id="codex-category">
            ${['Debugging', 'Performance', 'Architecture', 'Incidents', 'Career', 'Solo Building', 'Security', 'Other'].map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="codex-problem">The problem</label>
        <textarea id="codex-problem" rows="2" required minlength="20" data-error-required="Describe what went wrong." data-error-minlength="Give it at least 20 characters of real context."></textarea>
      </div>
      <div class="field">
        <label for="codex-tried">What you tried that didn't work</label>
        <textarea id="codex-tried" rows="2" required minlength="10" data-error-required="What did you try first?" data-error-minlength="At least 10 characters."></textarea>
      </div>
      <div class="field">
        <label for="codex-fix">What actually fixed it</label>
        <textarea id="codex-fix" rows="2" required minlength="10" data-error-required="What was the real fix?" data-error-minlength="At least 10 characters."></textarea>
      </div>
      <div class="field">
        <label for="codex-lesson">The lesson</label>
        <textarea id="codex-lesson" rows="2" required minlength="10" data-error-required="What's the one-line takeaway?" data-error-minlength="At least 10 characters."></textarea>
      </div>
      <button class="btn btn-primary btn-sm" type="submit">Add to the Codex (+${DV_POINT_VALUES.codexEntry} pts)</button>
    </form>
  `;

  dvRenderCodexCategoryFilters(categories);
  dvRenderCodexEntries();

  document.getElementById('codex-search').addEventListener('input', dvRenderCodexEntries);

  document.getElementById('codex-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!dvValidateForm(e.target)) return;
    dvAddCodexEntry({
      title: document.getElementById('codex-title').value.trim(),
      category: document.getElementById('codex-category').value,
      problem: document.getElementById('codex-problem').value.trim(),
      tried: document.getElementById('codex-tried').value.trim(),
      fix: document.getElementById('codex-fix').value.trim(),
      lesson: document.getElementById('codex-lesson').value.trim(),
    });
    e.target.reset();
    dvToast(`Added to the Codex (+${DV_POINT_VALUES.codexEntry} pts)`);
    dvRenderCodexEntries();
  });

  dvReveal(root);
}

function dvRenderCodexCategoryFilters(categories) {
  const root = document.getElementById('codex-category-filters');
  const all = ['All'].concat(categories);
  root.innerHTML = all.map((c) => `<button class="chip ${c === dvCodexCategoryFilter ? 'chip-accent' : ''}" data-codex-cat="${c}">${c}</button>`).join('');
  root.querySelectorAll('[data-codex-cat]').forEach((btn) => btn.addEventListener('click', () => {
    dvCodexCategoryFilter = btn.dataset.codexCat;
    root.querySelectorAll('[data-codex-cat]').forEach((b) => b.classList.toggle('chip-accent', b === btn));
    dvRenderCodexEntries();
  }));
}

function dvRenderCodexEntries() {
  const root = document.getElementById('codex-entries');
  const searchInput = document.getElementById('codex-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const entries = dvCodexEntries().slice().sort((a, b) => b.createdAt - a.createdAt);

  const filtered = entries.filter((e) => {
    const matchCategory = dvCodexCategoryFilter === 'All' || e.category === dvCodexCategoryFilter;
    const matchQuery = !query ||
      e.title.toLowerCase().indexOf(query) !== -1 ||
      e.problem.toLowerCase().indexOf(query) !== -1 ||
      e.lesson.toLowerCase().indexOf(query) !== -1;
    return matchCategory && matchQuery;
  });

  if (!filtered.length) {
    root.innerHTML = `<p class="muted">No entries match — try a different search or category.</p>`;
    return;
  }

  root.innerHTML = filtered.map((e) => {
    const author = dvCodexAuthorInfo(e.author);
    return `
    <div class="glass reveal in codex-entry" data-codex-entry="${e.id}">
      <button class="codex-entry-toggle" data-toggle-codex="${e.id}">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="chip chip-accent" style="font-size:10.5px;">${e.category}</span>
            <span class="mono muted" style="font-size:11px;">${dvForumAgo(e.createdAt)}</span>
          </div>
          <div style="font-size:15px; font-weight:600; margin-top:8px;">${e.title}</div>
        </div>
        <img src="${dvAvatar(author.avatarSeed, 32)}" style="width:28px;height:28px;border-radius:50%; flex-shrink:0;" title="${author.name}">
      </button>
      <div class="codex-entry-body" id="codex-body-${e.id}" style="display:none;">
        <div class="codex-field"><div class="codex-field-label">The problem</div><p>${e.problem}</p></div>
        <div class="codex-field"><div class="codex-field-label">What didn't work</div><p>${e.tried}</p></div>
        <div class="codex-field"><div class="codex-field-label">What actually fixed it</div><p>${e.fix}</p></div>
        <div class="codex-field codex-field-lesson"><div class="codex-field-label">The lesson</div><p>${e.lesson}</p></div>
        <div class="mono muted" style="font-size:11px; margin-top:12px;">— ${author.name}</div>
      </div>
    </div>`;
  }).join('');

  dvReveal(root);
}

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle-codex]');
  if (!toggle) return;
  const id = toggle.dataset.toggleCodex;
  const body = document.getElementById(`codex-body-${id}`);
  if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('DOMContentLoaded', () => setTimeout(dvCodexInit, 30));
