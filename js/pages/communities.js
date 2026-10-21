/* =========================================================
   COMMUNITIES
   ========================================================= */

function dvCommunitiesInit() {
  const root = document.getElementById('communities-grid');
  if (!root) return;
  root.innerHTML = DV_COMMUNITIES.map((c) => {
    const joined = DVStore.has('communities', c.id);
    return `
    <div class="glass card-lift reveal" style="padding:22px; display:flex; flex-direction:column; gap:14px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="width:48px;height:48px;border-radius:14px;background:${DV_TECH_GRADIENTS[c.gradient]};"></div>
        <span class="chip"><span class="mono">${c.online}</span> online</span>
      </div>
      <a href="community.html?id=${c.id}" style="text-decoration:none;">
        <h3>${c.name}</h3>
        <p style="font-size:13.5px; margin-top:6px;">${c.desc}</p>
      </a>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border);">
        <span class="mono" style="font-size:12px; color:var(--text-tertiary);">${c.members.toLocaleString()} members</span>
        <div style="display:flex; gap:8px;">
          <a href="community.html?id=${c.id}" class="btn btn-sm btn-outline">Open forum</a>
          <button class="btn btn-sm ${joined ? 'btn-ghost' : 'btn-primary'}" data-join="${c.id}">${joined ? 'Joined' : 'Join'}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  const discussions = document.getElementById('discussion-previews');
  if (discussions) {
    // Pull real, current threads out of every community's forum instead of
    // a separate hardcoded list, so this preview reflects what's actually
    // on the boards (including anything you've posted yourself).
    const allThreads = dvAllForumThreads();
    const latest = allThreads.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    discussions.innerHTML = latest.length
      ? latest.map((t) => `
        <a href="community.html?id=${t.communityId}" class="glass reveal" style="padding:16px 18px; display:flex; justify-content:space-between; align-items:center; gap:14px; text-decoration:none;">
          <div><div style="font-size:13.5px; font-weight:600;">${t.title}</div><div class="mono muted" style="font-size:11.5px; margin-top:3px;">${t.communityName} · ${dvForumAgo(t.createdAt)}</div></div>
          <span class="chip">${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</span>
        </a>`).join('')
      : `<p class="muted">No threads yet.</p>`;
  }

  dvReveal(root);
  if (discussions) dvReveal(discussions);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvCommunitiesInit, 30));
