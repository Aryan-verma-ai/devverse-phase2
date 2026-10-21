/* =========================================================
   SUBMIT A PROJECT
   Two ways in: paste a public GitHub repo URL and fetch its real
   name/description/language via the GitHub API to pre-fill the
   form, or just fill it in by hand. Either way, the person reviews
   and can edit everything before it actually goes live on Explore.
   ========================================================= */

function dvSubmitProjectInit() {
  const root = document.getElementById('submit-project-root');
  if (!root) return;

  if (!dvIsLoggedIn()) {
    dvToast('Sign in to submit a project');
    window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
    return;
  }

  const categories = dvUniqueArray(DV_PROJECTS.map((p) => p.category));

  root.innerHTML = `
    <div class="glass reveal in" style="padding:24px; margin-bottom:26px;">
      <h3 style="margin-bottom:6px;">Start from a GitHub repo (optional)</h3>
      <p style="font-size:13px; margin-bottom:16px;">Paste a public repo URL and we'll pull its name, description, and primary language from GitHub's real API to save you typing — you can still edit everything before publishing.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <input type="text" id="gh-url-input" placeholder="https://github.com/owner/repo" style="flex:1; min-width:220px;">
        <button class="btn btn-outline" id="gh-fetch-btn" type="button">Fetch from GitHub</button>
      </div>
      <p class="mono muted" id="gh-fetch-status" style="font-size:12px; margin-top:10px;"></p>
    </div>

    <form class="glass reveal in" id="submit-project-form" novalidate style="padding:26px; margin-bottom:30px;">
      <h3 style="margin-bottom:16px;">Project details</h3>
      <div class="field">
        <label for="sp-title">Title</label>
        <input id="sp-title" required minlength="3" data-error-required="Give your project a title." data-error-minlength="Titles need at least 3 characters.">
      </div>
      <div class="field">
        <label for="sp-desc">Description</label>
        <textarea id="sp-desc" rows="3" required minlength="20" data-error-required="Describe what it does." data-error-minlength="Give it at least 20 characters — what does it do, and why?"></textarea>
      </div>
      <div class="grid grid-2">
        <div class="field">
          <label for="sp-category">Category</label>
          <select id="sp-category">
            ${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="sp-difficulty">Difficulty</label>
          <select id="sp-difficulty">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate" selected>Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="sp-tags">Tech stack / tags</label>
        <input id="sp-tags" placeholder="React, TypeScript, Node.js" required minlength="1" data-error-required="List at least one tag — comma-separated.">
      </div>
      <div class="field">
        <label for="sp-features">Key features (comma-separated)</label>
        <input id="sp-features" placeholder="Dark mode, Offline support, Real-time sync">
      </div>
      <div class="field">
        <label for="sp-github">GitHub URL (optional)</label>
        <input id="sp-github" type="url" placeholder="https://github.com/owner/repo">
      </div>
      <button class="btn btn-primary" type="submit" style="width:100%; margin-top:6px;">Publish to Explore (+${DV_POINT_VALUES.projectSubmit} pts)</button>
    </form>

    <div class="eyebrow" style="margin-bottom:16px;">Your published projects</div>
    <div id="my-published-projects"></div>
  `;

  document.getElementById('gh-fetch-btn').addEventListener('click', dvFetchGithubForSubmit);
  document.getElementById('submit-project-form').addEventListener('submit', dvHandleProjectSubmit);
  dvRenderMyPublishedProjects();
  dvReveal(root);
}

// Holds GitHub-fetched timeline entries until the form is submitted.
let dvGithubTimeline = [];

function dvFetchGithubForSubmit() {
  const urlInput = document.getElementById('gh-url-input');
  const status = document.getElementById('gh-fetch-status');
  const parsed = dvParseGithubRepoUrl(urlInput.value);
  if (!parsed) {
    status.textContent = 'That doesn\u2019t look like a GitHub repo URL \u2014 try https://github.com/owner/repo, or just fill the form in by hand.';
    return;
  }
  status.textContent = 'Fetching from GitHub\u2026';
  dvGithubTimeline = [];

  fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
    .then(function (res) {
      if (!res.ok) throw new Error('not found or private');
      return res.json();
    })
    .then(function (repo) {
      document.getElementById('sp-title').value = repo.name || parsed.repo;
      document.getElementById('sp-desc').value = repo.description || '';
      document.getElementById('sp-tags').value = repo.language || '';
      document.getElementById('sp-github').value = repo.html_url || urlInput.value.trim();
      status.textContent = `Pulled ${repo.full_name} \u2014 ${repo.stargazers_count.toLocaleString()} stars. Fetching recent commits\u2026`;

      // Fetch the 5 most recent commits for the timeline
      return fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=5`);
    })
    .then(function (res) {
      if (!res.ok) throw new Error('commits fetch failed');
      return res.json();
    })
    .then(function (commits) {
      dvGithubTimeline = [];
      for (let i = 0; i < commits.length; i++) {
        const c = commits[i];
        const msg = c.commit.message.split('\n')[0]; // first line only
        const date = c.commit.author.date;
        // Format as relative time from the date string
        const msAgo = Date.now() - new Date(date).getTime();
        const daysAgo = Math.floor(msAgo / 86400000);
        let when = 'just now';
        if (daysAgo > 365) { when = Math.floor(daysAgo / 365) + ' year' + (Math.floor(daysAgo / 365) > 1 ? 's' : '') + ' ago'; }
        else if (daysAgo > 30) { when = Math.floor(daysAgo / 30) + ' month' + (Math.floor(daysAgo / 30) > 1 ? 's' : '') + ' ago'; }
        else if (daysAgo > 7) { when = Math.floor(daysAgo / 7) + ' week' + (Math.floor(daysAgo / 7) > 1 ? 's' : '') + ' ago'; }
        else if (daysAgo > 0) { when = daysAgo + ' day' + (daysAgo > 1 ? 's' : '') + ' ago'; }
        dvGithubTimeline.push({ label: msg, when: when });
      }
      const prev = status.textContent.split('.')[0];
      status.textContent = prev + '. Pulled ' + commits.length + ' recent commits for timeline. Review the fields below before publishing.';
    })
    .catch(function () {
      status.textContent = 'Couldn\u2019t fetch that repo (private, renamed, or GitHub rate-limited us) \u2014 no problem, just fill in the fields below by hand.';
    });
}

function dvHandleProjectSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!dvValidateForm(form)) return;

  const tagsRaw = document.getElementById('sp-tags').value;
  const tags = tagsRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean);

  const featuresRaw = document.getElementById('sp-features').value;
  const features = featuresRaw.split(',').map(function (f) { return f.trim(); }).filter(Boolean);

  const entry = dvAddUserProject({
    title: document.getElementById('sp-title').value.trim(),
    desc: document.getElementById('sp-desc').value.trim(),
    category: document.getElementById('sp-category').value,
    difficulty: document.getElementById('sp-difficulty').value,
    tags: tags,
    features: features,
    timeline: dvGithubTimeline,
    githubUrl: document.getElementById('sp-github').value.trim(),
  });

  dvToast(`Published "${entry.title}" (+${DV_POINT_VALUES.projectSubmit} pts)`);
  window.location.href = `project.html?id=${entry.id}`;
}

function dvRenderMyPublishedProjects() {
  const root = document.getElementById('my-published-projects');
  const mine = dvUserProjects();
  root.innerHTML = mine.length
    ? `<div class="grid grid-3">${mine.map(dvProjectCardHTML).join('')}</div>`
    : `<p class="muted">Nothing published yet — the form above is where it starts.</p>`;
  dvReveal(root);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSubmitProjectInit, 30));
