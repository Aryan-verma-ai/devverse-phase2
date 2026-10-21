/* =========================================================
   COMMUNITY FORUM
   Public-feeling discussion board per community. Everything is
   real client-side logic (DOM, events, forms, validation,
   arrays/objects, JSON, LocalStorage) — but it's still local to
   this browser only, since there's no backend to sync
   threads between different people. That's called out in the UI.
   The data-access helpers (dvForumThreads, dvForumAgo, etc.) live
   in app.js since the Communities index page needs them too.
   ========================================================= */

let dvForumCommunity = null;

function dvCommunityInit() {
  const root = document.getElementById('community-root');
  if (!root) return;
  const id = dvGetQueryParam('id') || DV_COMMUNITIES[0].id;
  const c = DV_COMMUNITIES.find((x) => x.id === id) || DV_COMMUNITIES[0];
  dvForumCommunity = c.id;
  document.title = `${c.name} — DevVerse`;

  const joined = DVStore.has('communities', c.id);

  root.innerHTML = `
    <div class="glass reveal in" style="padding:26px; display:flex; flex-wrap:wrap; gap:20px; justify-content:space-between; align-items:center; margin-bottom:28px;">
      <div style="display:flex; gap:16px; align-items:center;">
        <div style="width:56px;height:56px;border-radius:16px;background:${DV_TECH_GRADIENTS[c.gradient]}; flex-shrink:0;"></div>
        <div>
          <h1 style="font-size:26px;">${c.name}</h1>
          <p style="margin-top:4px; font-size:13.5px;">${c.desc}</p>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px;">
        <span class="chip"><span class="mono">${c.online}</span> online</span>
        <span class="mono muted" style="font-size:12.5px;">${c.members.toLocaleString()} members</span>
        <button class="btn ${joined ? 'btn-ghost' : 'btn-primary'}" data-join="${c.id}" id="community-join-btn">${joined ? 'Joined' : 'Join'}</button>
      </div>
    </div>

    <div class="glass reveal in" style="padding:6px 22px; margin-bottom:10px; display:flex; align-items:center; gap:10px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>
      <p style="font-size:12px; padding:12px 0;">This board is local to your browser — a real backend would sync it across everyone. For now, seeded threads simulate other builders, and anything you post is saved to this device.</p>
    </div>

    ${joined ? `
    <form class="glass reveal in" id="thread-form" novalidate style="padding:22px; margin-bottom:26px;">
      <h3 style="margin-bottom:14px;">Start a new thread</h3>
      <div class="field">
        <label for="thread-title">Title</label>
        <input id="thread-title" name="title" required minlength="6" data-error-required="Give your thread a title." data-error-minlength="Titles need at least 6 characters.">
      </div>
      <div class="field">
        <label for="thread-body">What do you want to discuss?</label>
        <textarea id="thread-body" name="body" rows="3" required minlength="12" data-error-required="Add a bit of context for your thread." data-error-minlength="Write at least 12 characters so people know what you're asking."></textarea>
      </div>
      <button class="btn btn-primary btn-sm" type="submit">Post thread</button>
    </form>` : `
    <div class="glass reveal in forum-locked" style="padding:26px; margin-bottom:26px; text-align:center;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="margin-bottom:10px;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
      <p style="font-size:13.5px; margin-bottom:14px;">Join ${c.name} to start threads and reply to other builders.</p>
      <button class="btn btn-primary btn-sm" data-join="${c.id}">Join community</button>
    </div>`}

    <div class="eyebrow">Threads</div>
    <div id="thread-list" style="display:flex; flex-direction:column; gap:14px;"></div>
  `;

  if (joined) {
    document.getElementById('thread-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!dvValidateForm(e.target)) return;
      const titleInput = document.getElementById('thread-title');
      const bodyInput = document.getElementById('thread-body');
      const threads = dvForumThreads(c.id);
      threads.unshift({
        id: `${c.id}-${Date.now()}`,
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        author: 'you',
        createdAt: Date.now(),
        replies: [],
      });
      dvForumSave(c.id, threads);
      e.target.reset();
      dvAwardPoints(DV_POINT_VALUES.thread, 'Started a discussion thread');
      dvToast(`Thread posted (+${DV_POINT_VALUES.thread} pts)`);
      dvRenderThreads(c.id, joined);
    });
  }

  dvRenderThreads(c.id, joined);
  dvReveal(root);
}

function dvRenderThreads(communityId, joined) {
  const listRoot = document.getElementById('thread-list');
  const threads = dvForumThreads(communityId).slice().sort((a, b) => b.createdAt - a.createdAt);

  if (!threads.length) {
    listRoot.innerHTML = `<p class="muted">No threads yet — be the first to start one.</p>`;
    return;
  }

  listRoot.innerHTML = threads.map(function (t) { return `
    <div class="glass reveal in thread-card" data-thread-id="${t.id}">
      <div style="display:flex; align-items:flex-start;">
        <button class="thread-toggle" data-toggle-thread="${t.id}" style="flex:1; text-align:left; background:none; border:none; padding:18px 20px; display:flex; gap:14px; align-items:flex-start; cursor:pointer; color:inherit;">
          <img src="${dvAvatar(dvForumAuthorAvatar(t.author), 40)}" style="width:38px;height:38px;border-radius:50%; flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-size:14.5px; font-weight:600;">${t.title}</div>
            <div class="mono muted" style="font-size:11.5px; margin-top:4px;">${dvForumAuthorName(t.author)} ${dvTierIconHTML(t.author)} · ${dvForumAgo(t.createdAt)}</div>
          </div>
          <span class="chip" style="flex-shrink:0;">${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</span>
        </button>
        ${t.author === 'you' ? `<button class="thread-delete-btn" data-delete-thread="${t.id}" style="margin:18px 14px 0 0; flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
      </div>
      <div class="thread-body" id="thread-body-${t.id}" style="display:none; padding:16px 20px 20px 72px;">
        <p style="font-size:13.5px; margin-bottom:16px;">${t.body}</p>
        <div class="thread-replies" style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
          ${t.replies.map(function (r) { return `
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <img src="${dvAvatar(dvForumAuthorAvatar(r.author), 30)}" style="width:28px;height:28px;border-radius:50%; flex-shrink:0;">
              <div style="flex:1;">
                <div style="font-size:12.5px;"><b>${dvForumAuthorName(r.author)}</b> ${dvTierIconHTML(r.author)} <span class="muted mono" style="font-size:11px;">${dvForumAgo(r.createdAt)}</span></div>
                <div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">${r.text}</div>
              </div>
              ${r.author === 'you' ? `<button class="thread-delete-btn" data-delete-reply="${t.id}" data-reply-id="${r.id}" style="flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
            </div>`; }).join('') || `<p class="muted" style="font-size:12.5px;">No replies yet.</p>`}
        </div>
        ${joined
          ? `<form class="reply-form" data-reply-thread="${t.id}" novalidate style="display:flex; gap:10px; align-items:flex-start;">
              <input type="text" class="reply-input" placeholder="Write a reply\u2026" required minlength="2" data-error-required="Write a reply before posting." data-error-minlength="Replies need at least 2 characters." style="flex:1;">
              <button class="btn btn-primary btn-sm" type="submit">Reply</button>
            </form>`
          : `<p class="muted" style="font-size:12.5px;">Join this community to reply.</p>`}
      </div>
    </div>`; }).join('');

  dvReveal(listRoot);
}

/* Re-render the whole page whenever the join button for THIS community
   is toggled, so the gate (forms appearing/disappearing) updates live
   without a full page reload. Runs after app.js's own click handler
   (attached later, during dvCommunityInit), so DVStore already
   reflects the new joined state by the time this fires. */
document.addEventListener('click', (e) => {
  const joinBtn = e.target.closest('[data-join]');
  if (joinBtn && dvForumCommunity && joinBtn.dataset.join === dvForumCommunity) {
    dvCommunityInit();
  }
});

/* Delegated: expand/collapse threads + submit replies (elements are
   regenerated on every render, so we listen on a stable ancestor). */
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle-thread]');
  if (toggle) {
    const id = toggle.dataset.toggleThread;
    const body = document.getElementById(`thread-body-${id}`);
    if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
  }

  // Delete own thread
  const delThread = e.target.closest('[data-delete-thread]');
  if (delThread && dvForumCommunity) {
    const threadId = delThread.dataset.deleteThread;
    const threads = dvForumThreads(dvForumCommunity);
    const filtered = threads.filter(function (t) { return t.id !== threadId; });
    dvForumSave(dvForumCommunity, filtered);
    dvToast('Thread deleted');
    dvRenderThreads(dvForumCommunity, DVStore.has('communities', dvForumCommunity));
  }

  // Delete own reply
  const delReply = e.target.closest('[data-delete-reply]');
  if (delReply && dvForumCommunity) {
    const threadId = delReply.dataset.deleteReply;
    const replyId = delReply.dataset.replyId;
    const threads = dvForumThreads(dvForumCommunity);
    for (let i = 0; i < threads.length; i++) {
      if (threads[i].id === threadId) {
        threads[i].replies = threads[i].replies.filter(function (r) { return r.id !== replyId; });
        break;
      }
    }
    dvForumSave(dvForumCommunity, threads);
    dvToast('Reply deleted');
    dvRenderThreads(dvForumCommunity, DVStore.has('communities', dvForumCommunity));
    const reopened = document.getElementById(`thread-body-${threadId}`);
    if (reopened) reopened.style.display = 'block';
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('.reply-form');
  if (!form || !dvForumCommunity) return;
  e.preventDefault();
  if (!DVStore.has('communities', dvForumCommunity)) return; // defensive: reply forms only render when joined anyway
  if (!dvValidateForm(form)) return;
  const threadId = form.dataset.replyThread;
  const input = form.querySelector('.reply-input');
  const threads = dvForumThreads(dvForumCommunity);
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return;
  thread.replies.push({
    id: `${threadId}-r${Date.now()}`,
    author: 'you',
    text: input.value.trim(),
    createdAt: Date.now(),
  });
  dvForumSave(dvForumCommunity, threads);
  dvAwardPoints(DV_POINT_VALUES.reply, 'Replied to a thread');
  dvToast(`Reply posted (+${DV_POINT_VALUES.reply} pts)`);
  dvRenderThreads(dvForumCommunity, true);
  const reopened = document.getElementById(`thread-body-${threadId}`);
  if (reopened) reopened.style.display = 'block';
});

document.addEventListener('DOMContentLoaded', () => setTimeout(dvCommunityInit, 30));
