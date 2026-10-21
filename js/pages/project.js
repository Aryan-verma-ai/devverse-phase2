/* =========================================================
   PROJECT DETAILS
   ========================================================= */

function dvProjectDetailInit() {
  const root = document.getElementById('project-detail');
  if (!root) return;
  const allProjects = dvAllProjects();
  const id = dvGetQueryParam('id') || allProjects[0].id;
  const p = dvFindProjectById(id) || allProjects[0];
  const authorInfo = dvProjectAuthorInfo(p.author);
  const authorName = authorInfo.name;
  const authorAvatarSeed = authorInfo.avatarSeed;
  const liked = DVStore.has('likes', p.id);
  const bookmarked = DVStore.has('bookmarks', p.id);
  const isOwn = p.author === 'you';
  const isUserProject = p.id.indexOf('user-') === 0;

  // Count this as a view of the project — the Stats panel below reads
  // it back via dvProjectViewCount() so it actually moves instead of
  // sitting frozen at the seed number forever.
  dvTrackProjectView(p.id);

  // Resolve the profile link — own projects link to own profile
  const profileHref = isOwn ? 'profile.html' : 'profile.html?u=' + p.author;
  const displayHandle = isOwn ? dvSelfHandle() : p.author;

  document.title = `${p.title} — DevVerse`;

  // --- Features: use project's own features array if available,
  // otherwise fall back to demo placeholders for seeded projects ---
  const defaultFeatures = ['Realtime sync engine', 'Offline-first caching', 'Zero-config setup', 'Accessible by default'];
  const features = (p.features && p.features.length) ? p.features : (isUserProject ? [] : defaultFeatures);

  // --- Timeline: use project's own timeline array if available,
  // otherwise fall back to demo placeholders for seeded projects.
  // For manually-typed user projects, timeline stays empty (it would
  // be populated via GitHub API fetch in Phase 2). ---
  const defaultTimeline = [
    { label: 'v1.0 released', when: '6 months ago' },
    { label: 'Core rewrite in ' + p.tags[0], when: '3 months ago' },
    { label: '1,000+ stars milestone', when: '3 weeks ago' },
  ];
  const timeline = (p.timeline && p.timeline.length) ? p.timeline : (isUserProject ? [] : defaultTimeline);

  // Build features HTML
  let featuresHTML = '';
  if (features.length) {
    featuresHTML = `
        <section class="reveal in">
          <div class="eyebrow">Features</div>
          <div class="grid grid-2">
            ${features.map(function (f) { return `
              <div class="glass" style="padding:16px; display:flex; gap:10px; align-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink:0;"><path d="M20 6L9 17l-5-5"/></svg>
                <span style="font-size:13.5px;">${f}</span>
              </div>`; }).join('')}
          </div>
        </section>`;
  }

  // Build timeline HTML
  let timelineHTML = '';
  if (timeline.length) {
    timelineHTML = `
        <section class="reveal in">
          <div class="eyebrow">Timeline</div>
          <div class="glass" style="padding:22px;">
            ${timeline.map(function (t) { return `
              <div style="display:flex; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--border);"><span style="font-size:13.5px;">${t.label}</span><span class="mono" style="font-size:12px; color:var(--text-tertiary);">${t.when}</span></div>`; }).join('')}
          </div>
        </section>`;
  }

  // Overview text — demo projects get an extra sentence
  const overviewExtra = isUserProject ? '' : ` This build focuses on real-world performance under load, a clean developer experience, and interface details most teams skip. It's actively maintained by ${authorName} and open for contributions.`;

  root.innerHTML = `
    <div class="glass reveal in" style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:36px;">
      <div style="height:280px; background:${DV_TECH_GRADIENTS[p.gradient]}; position:relative; display:flex; align-items:flex-end; padding:32px;">
        <div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 30%, rgba(7,8,12,0.75));"></div>
        <div style="position:relative; z-index:1;">
          <div id="category-display" style="display:flex; align-items:center; gap:8px;">
            <span class="chip" id="category-chip" style="background:rgba(7,8,12,0.5); border-color:rgba(255,255,255,0.2);">${p.category}</span>
            ${isOwn ? `<button class="btn btn-ghost btn-sm" id="edit-category-btn" type="button" style="padding:4px 10px; background:rgba(7,8,12,0.5);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Edit category</button>` : ''}
          </div>
          <h1 style="margin-top:12px; font-size:clamp(30px,4.4vw,52px);">${p.title}</h1>
        </div>
      </div>
      <div style="padding:26px 32px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:20px; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${dvAvatar(authorAvatarSeed, 44)}" style="width:44px;height:44px;border-radius:50%;">
          <div>
            <div style="font-weight:600; font-size:14px;">${authorName}</div>
            <a href="${profileHref}" class="mono" style="font-size:12px; color:var(--text-tertiary);">@${displayHandle}</a>
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost dv-like ${liked ? 'liked' : ''}" data-like="${p.id}" id="detail-like-btn" aria-label="Like this project">
            ${DV_ICON_HEART}
            <span data-like-count data-base="${p.likes}">${(liked ? p.likes + 1 : p.likes).toLocaleString()}</span>
          </button>
          <button class="btn btn-ghost dv-bookmark ${bookmarked ? 'bookmarked' : ''}" data-bookmark="${p.id}" id="detail-bookmark-btn" aria-label="Bookmark this project">
            ${DV_ICON_BOOKMARK}
            <span class="dv-bookmark-label">${bookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button class="btn btn-outline" data-share><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> Share</button>
          ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener" class="btn btn-outline"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55v-2c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.97.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.08.78 2.17v3.22c0 .3.21.65.8.55A11.51 11.51 0 0023.5 12c0-6.35-5.15-11.5-11.5-11.5z"/></svg> GitHub</a>` : ''}
          ${isOwn ? `<button class="btn btn-outline project-delete-btn" id="delete-project-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
        </div>
      </div>
    </div>

    <div class="detail-grid detail-grid--wide">
      <div style="display:flex; flex-direction:column; gap:36px;">
        <section class="reveal in">
          <div class="eyebrow">Overview</div>
          <p class="lede" style="max-width:none; font-size:16px;">${p.desc}${overviewExtra}</p>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Gallery</div>
          <div class="grid grid-3">
            ${[0, 1, 2].map(function (i) { return '<div class="glass" style="height:140px; border-radius:var(--radius-md); background:' + DV_TECH_GRADIENTS[(p.gradient + i) % 5] + '; opacity:' + (0.85 - i * 0.1) + ';"></div>'; }).join('')}
          </div>
        </section>

        ${featuresHTML}

        ${timelineHTML}

        <section class="reveal in" id="comments-section">
          <div class="eyebrow">Comments</div>
          <form id="comment-form" novalidate>
            <div class="field" style="margin-bottom:14px;">
              <textarea id="comment-input" name="comment" rows="3" placeholder="Share feedback on this project\u2026" required minlength="3" data-error-required="Write something before posting a comment." data-error-minlength="Comments need at least 3 characters."></textarea>
            </div>
            <button class="btn btn-primary btn-sm" type="submit">Post comment</button>
          </form>
          <div id="comment-list" style="margin-top:22px; display:flex; flex-direction:column; gap:14px;"></div>
        </section>
      </div>

      <aside class="sticky-panel" style="display:flex; flex-direction:column; gap:20px;">
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Tech stack</div>
          <div class="pc-tags">${p.tags.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('')}</div>
        </div>
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Stats</div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Difficulty</span><span style="font-size:13px; font-weight:600;">${p.difficulty}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Views</span><span style="font-size:13px; font-weight:600;">${dvProjectViewCount(p).toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Likes</span><span style="font-size:13px; font-weight:600;" data-like-count-for="${p.id}" data-base="${p.likes}">${(liked ? p.likes + 1 : p.likes).toLocaleString()}</span></div>
        </div>
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Contributors</div>
          <div style="display:flex; gap:-8px;">
            ${isOwn
              ? '<img src="' + dvAvatar(authorAvatarSeed, 36) + '" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--bg-elevated);" title="' + authorName + '">'
              : DV_DEVS.slice(0, 4).map(function (d) { return '<img src="' + dvAvatar(d.avatarSeed, 36) + '" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--bg-elevated); margin-left:-10px;" title="' + d.name + '">'; }).join('')}
          </div>
        </div>
      </aside>
    </div>

    <section class="section-tight reveal in">
      <div class="section-head"><h2>Related projects</h2></div>
      <div class="grid grid-3" id="related-projects"></div>
    </section>
  `;

  const sameCategory = allProjects.filter(function (x) { return x.category === p.category && x.id !== p.id; });
  let related = sameCategory.slice(0, 3);
  if (related.length < 3) {
    const usedIds = [p.id];
    for (let i = 0; i < related.length; i++) { usedIds.push(related[i].id); }
    const backfill = allProjects
      .filter(function (x) { return usedIds.indexOf(x.id) === -1; })
      .sort(function (a, b) { return b.likes - a.likes; })
      .slice(0, 3 - related.length);
    related = related.concat(backfill);
  }
  document.getElementById('related-projects').innerHTML = related.map(dvProjectCardHTML).join('');

  // Delete project handler
  if (isOwn) {
    document.getElementById('delete-project-btn').addEventListener('click', function () {
      if (confirm('Delete "' + p.title + '"? This cannot be undone.')) {
        dvDeleteUserProject(p.id);
        dvToast('Project deleted');
        window.location.href = 'explore.html';
      }
    });
    dvWireCategoryEditor(p, allProjects);
  }

  dvRenderComments(p.id);
  document.getElementById('comment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    dvPostComment(p.id);
  });
  document.getElementById('comment-input').addEventListener('input', function () {
    if (this.classList.contains('field-error')) dvClearFieldError(this);
  });
  dvReveal(root);
}

function dvRenderComments(projectId) {
  const listEl = document.getElementById('comment-list');
  const comments = DVStore.get(`comments.${projectId}`, []);
  if (!comments.length) {
    listEl.innerHTML = `<p class="muted" style="font-size:13px;">No comments yet \u2014 be the first to share feedback.</p>`;
    return;
  }
  listEl.innerHTML = comments.map(function (c, i) { return `
    <div style="display:flex; gap:12px; align-items:flex-start;">
      <img src="${dvAvatar(c.author, 36)}" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;">
      <div style="flex:1;">
        <div style="font-size:13px;"><b>${c.author}</b> ${dvTierIconHTML(c.author)} <span class="muted mono" style="font-size:11px;">${c.time}</span></div>
        <div style="font-size:13.5px; color:var(--text-secondary); margin-top:3px;">${c.text}</div>
      </div>
      ${c.author === 'you' ? `<button class="thread-delete-btn" data-delete-comment="${projectId}" data-comment-index="${i}" style="flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
    </div>`; }).join('');

  // Wire comment delete buttons
  listEl.querySelectorAll('[data-delete-comment]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const pId = this.dataset.deleteComment;
      const idx = parseInt(this.dataset.commentIndex, 10);
      const cmts = DVStore.get('comments.' + pId, []);
      if (idx >= 0 && idx < cmts.length && cmts[idx].author === 'you') {
        cmts.splice(idx, 1);
        DVStore.set('comments.' + pId, cmts);
        dvRenderComments(pId);
        dvToast('Comment deleted');
      }
    });
  });
}

function dvPostComment(projectId) {
  const input = document.getElementById('comment-input');
  const form = document.getElementById('comment-form');
  if (!dvValidateForm(form)) return;
  const text = input.value.trim();
  const comments = DVStore.get(`comments.${projectId}`, []);
  comments.unshift({ author: 'you', text, time: 'just now' });
  DVStore.set(`comments.${projectId}`, comments);
  form.reset();
  dvRenderComments(projectId);
  dvAwardPoints(DV_POINT_VALUES.comment, 'Posted a comment');
  dvToast(`Comment posted (+${DV_POINT_VALUES.comment} pts)`);
}

/** Wires the "Edit category" control on your own project's detail
 *  page: click swaps the badge for a <select> of every category
 *  already in use (plus a "+ New category" option that reveals a
 *  text input), Save persists it via dvUpdateUserProject() and
 *  updates the badge and the Related projects list in place, Cancel
 *  reverts to the plain badge without saving anything. */
function dvWireCategoryEditor(p, allProjects) {
  const editBtn = document.getElementById('edit-category-btn');
  if (!editBtn) return;
  const categories = dvUniqueArray(allProjects.map(function (x) { return x.category; }));
  editBtn.addEventListener('click', function () { dvOpenCategoryEditor(p, allProjects, categories); });
}

function dvOpenCategoryEditor(p, allProjects, categories) {
  const display = document.getElementById('category-display');
  display.innerHTML = `
    <form id="category-edit-form" novalidate style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
      <select id="category-edit-select">
        ${categories.map(function (c) { return `<option value="${c}" ${c === p.category ? 'selected' : ''}>${c}</option>`; }).join('')}
        <option value="__custom__">+ New category…</option>
      </select>
      <input id="category-edit-custom" placeholder="New category name" style="display:none; width:170px;" minlength="2" data-error-required="Enter a category name." data-error-minlength="Category names need at least 2 characters.">
      <button class="btn btn-primary btn-sm" type="submit">Save</button>
      <button class="btn btn-ghost btn-sm" id="category-edit-cancel" type="button">Cancel</button>
    </form>`;

  const select = document.getElementById('category-edit-select');
  const customInput = document.getElementById('category-edit-custom');
  select.addEventListener('change', function () {
    const isCustom = select.value === '__custom__';
    customInput.style.display = isCustom ? 'inline-block' : 'none';
    customInput.required = isCustom;
    if (isCustom) customInput.focus();
  });

  document.getElementById('category-edit-cancel').addEventListener('click', function () {
    dvRestoreCategoryBadge(p, allProjects, categories);
  });

  document.getElementById('category-edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (select.value === '__custom__' && !dvValidateForm(e.target)) return;
    const chosen = select.value === '__custom__' ? customInput.value.trim() : select.value;
    if (!chosen) return;

    p.category = chosen;
    dvUpdateUserProject(p.id, { category: chosen });
    if (categories.indexOf(chosen) === -1) categories.push(chosen);
    dvRestoreCategoryBadge(p, allProjects, categories);
    dvToast('Category updated');

    // Related projects are picked by category, so refresh that
    // section too instead of leaving it showing the old grouping.
    const sameCategory = allProjects.filter(function (x) { return x.category === chosen && x.id !== p.id; });
    let related = sameCategory.slice(0, 3);
    if (related.length < 3) {
      const usedIds = [p.id].concat(related.map(function (r) { return r.id; }));
      const backfill = allProjects
        .filter(function (x) { return usedIds.indexOf(x.id) === -1; })
        .sort(function (a, b) { return b.likes - a.likes; })
        .slice(0, 3 - related.length);
      related = related.concat(backfill);
    }
    document.getElementById('related-projects').innerHTML = related.map(dvProjectCardHTML).join('');
  });
}

/** Swaps the category editor form back out for the plain badge +
 *  Edit button, showing whatever category is currently set. */
function dvRestoreCategoryBadge(p, allProjects, categories) {
  const display = document.getElementById('category-display');
  display.innerHTML = `
    <span class="chip" id="category-chip" style="background:rgba(7,8,12,0.5); border-color:rgba(255,255,255,0.2);">${p.category}</span>
    <button class="btn btn-ghost btn-sm" id="edit-category-btn" type="button" style="padding:4px 10px; background:rgba(7,8,12,0.5);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Edit category</button>`;
  document.getElementById('edit-category-btn').addEventListener('click', function () {
    dvOpenCategoryEditor(p, allProjects, categories);
  });
}

document.addEventListener('DOMContentLoaded', function () { setTimeout(dvProjectDetailInit, 30); });
