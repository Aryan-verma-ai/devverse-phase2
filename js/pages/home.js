/* =========================================================
   HOME PAGE
   ========================================================= */

function dvTypeTerminal() {
  const el = document.getElementById('terminal-line');
  if (!el) return;
  const commands = ['devverse init --builder', 'devverse deploy legend.exe', 'devverse join hackathon aurora'];
  let cIndex = 0;

  function typeCommand(cmd, cb) {
    let i = 0;
    el.textContent = '';
    const iv = setInterval(() => {
      el.textContent = cmd.slice(0, i);
      i++;
      if (i > cmd.length) {
        clearInterval(iv);
        setTimeout(cb, 1100);
      }
    }, 42);
  }

  function loop() {
    typeCommand(commands[cIndex], () => {
      cIndex = (cIndex + 1) % commands.length;
      loop();
    });
  }
  loop();
}

function dvRenderTrendingProjects() {
  const root = document.getElementById('trending-projects');
  if (!root) return;
  const list = [...dvAllProjects()].sort((a, b) => b.likes - a.likes).slice(0, 6);
  root.innerHTML = list.map(dvProjectCardHTML).join('');
}

function dvRenderTopDevs() {
  const root = document.getElementById('top-devs');
  if (!root) return;
  const list = [...DV_DEVS].sort((a, b) => b.points - a.points).slice(0, 5);
  root.innerHTML = list.map((d) => `
    <a href="profile.html?u=${d.handle}" class="dev-card glass card-lift reveal">
      <div class="dev-avatar-ring"><img src="${dvAvatar(d.avatarSeed)}" alt="${d.name}"></div>
      <div class="dev-name">${d.name}</div>
      <div class="dev-handle">@${d.handle}</div>
      <div class="dev-meta">
        <div><b>${d.projects}</b>projects</div>
        <div><b>${(d.followers / 1000).toFixed(1)}k</b>followers</div>
      </div>
    </a>`).join('');
}

function dvRenderCategories() {
  const root = document.getElementById('category-tiles');
  if (!root) return;
  const cats = dvUniqueArray(dvAllProjects().map((p) => p.category)).map((c) => ({
    name: c,
    count: dvAllProjects().filter((p) => p.category === c).length,
  }));
  root.innerHTML = cats.map((c, i) => `
    <a href="explore.html?cat=${encodeURIComponent(c.name)}" class="tech-tile glass card-lift reveal">
      <div class="tt-icon">${['⬡', '◆', '●', '◈', '▲'][i % 5]}</div>
      <div class="tt-name">${c.name}</div>
      <div class="tt-count">${c.count} projects</div>
    </a>`).join('');
}

function dvRenderHackathonsPreview() {
  const root = document.getElementById('hackathons-preview');
  if (!root) return;
  root.innerHTML = DV_HACKATHONS.slice(0, 3).map((h) => `
    <a href="hackathons.html" class="glass card-lift reveal" style="padding:22px; display:flex; flex-direction:column; gap:12px;">
      <span class="chip chip-accent">${h.tags[0]}</span>
      <h3>${h.title}</h3>
      <p style="font-size:13.5px;">${h.desc}</p>
      <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-tertiary); font-family:var(--font-mono); padding-top:10px; border-top:1px solid var(--border);">
        <span>${h.prize} prize pool</span>
        <span>${h.participants.toLocaleString()} joined</span>
      </div>
    </a>`).join('');
}

function dvRenderTechShowcase() {
  const root = document.getElementById('tech-showcase');
  if (!root) return;
  root.innerHTML = DV_TECHS.map((t) => `
    <div class="tech-tile glass card-lift reveal">
      <div class="tt-icon">${t.icon}</div>
      <div class="tt-name">${t.name}</div>
      <div class="tt-count">${t.count.toLocaleString()} builders</div>
    </div>`).join('');
}

function dvRenderCommunityHighlights() {
  const root = document.getElementById('community-highlights');
  if (!root) return;
  const list = [...DV_COMMUNITIES].sort((a, b) => b.online - a.online).slice(0, 3);
  root.innerHTML = list.map((c) => `
    <a href="communities.html" class="glass card-lift reveal" style="padding:20px; display:flex; gap:14px; align-items:center;">
      <div style="width:46px;height:46px;border-radius:13px;background:${DV_TECH_GRADIENTS[c.gradient]};flex-shrink:0;"></div>
      <div>
        <div style="font-weight:600;">${c.name}</div>
        <div class="mono" style="font-size:12px;color:var(--text-tertiary);">${c.online} online now</div>
      </div>
    </a>`).join('');
}

function dvLiveActivity() {
  const root = document.getElementById('activity-feed');
  if (!root) return;
  const devs = DV_DEVS.map((d) => d.handle);
  const projects = DV_PROJECTS.map((p) => p.title);

  function makeItem(minutesAgo) {
    const tpl = DV_ACTIVITY_TEMPLATES[Math.floor(Math.random() * DV_ACTIVITY_TEMPLATES.length)];
    const dev = devs[Math.floor(Math.random() * devs.length)];
    const proj = projects[Math.floor(Math.random() * projects.length)];
    const li = document.createElement('div');
    li.className = 'feed-item';
    li.innerHTML = `
      <img src="${dvAvatar(dev, 40)}" alt="">
      <div>
        <div class="feed-text">${tpl(dev, proj)}</div>
        <div class="feed-time">${dvTimeAgo(minutesAgo)}</div>
      </div>`;
    return li;
  }

  for (let i = 0; i < 6; i++) root.appendChild(makeItem(i * 3 + 1));

  setInterval(() => {
    const item = makeItem(0);
    root.prepend(item);
    while (root.children.length > 7) root.removeChild(root.lastChild);
  }, 4200);
}

document.addEventListener('DOMContentLoaded', () => {
  dvTypeTerminal();
  dvRenderTrendingProjects();
  dvRenderTopDevs();
  dvRenderCategories();
  dvRenderHackathonsPreview();
  dvRenderTechShowcase();
  dvRenderCommunityHighlights();
  dvLiveActivity();
  setTimeout(() => {
    dvAnimateCounters();
    dvReveal();
  }, 50);
  dvFetchGitHubTrending();
});

/* ---------- GitHub Fetch API demo with graceful fallback ---------- */
function dvFetchGitHubTrending() {
  const root = document.getElementById('gh-trending');
  if (!root) return;
  fetch('https://api.github.com/search/repositories?q=stars:%3E10000&sort=stars&order=desc&per_page=5')
    .then((res) => {
      if (!res.ok) throw new Error('rate limited');
      return res.json();
    })
    .then((data) => {
      root.innerHTML = data.items.map((repo) => `
      <a href="${repo.html_url}" target="_blank" rel="noopener" class="glass card-lift reveal" style="padding:16px; display:flex; gap:12px; align-items:center;">
        <img src="${repo.owner.avatar_url}" alt="" style="width:38px;height:38px;border-radius:10px;">
        <div style="overflow:hidden;">
          <div style="font-weight:600; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${repo.full_name}</div>
          <div class="mono" style="font-size:11.5px; color:var(--text-tertiary);">★ ${repo.stargazers_count.toLocaleString()}</div>
        </div>
      </a>`).join('');
      dvReveal(root);
    })
    .catch((e) => {
      root.innerHTML = DV_PROJECTS.slice(0, 5).map((p) => `
      <div class="glass reveal" style="padding:16px; display:flex; gap:12px; align-items:center;">
        <div style="width:38px;height:38px;border-radius:10px;background:${DV_TECH_GRADIENTS[p.gradient]};"></div>
        <div>
          <div style="font-weight:600; font-size:13.5px;">${p.title}</div>
          <div class="mono" style="font-size:11.5px; color:var(--text-tertiary);">★ ${p.likes.toLocaleString()} · local cache</div>
        </div>
      </div>`).join('');
      dvReveal(root);
    });
}
