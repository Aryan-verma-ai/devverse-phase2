/* =========================================================
   HACKATHON DETAILS
   ========================================================= */

function dvHackathonDetailInit() {
  const root = document.getElementById('hackathon-detail');
  if (!root) return;
  const id = dvGetQueryParam('id') || DV_HACKATHONS[0].id;
  const h = DV_HACKATHONS.find((x) => x.id === id) || DV_HACKATHONS[0];
  const registered = DVStore.has('hackathons', h.id);
  const bookmarked = DVStore.has('bookmarks', 'hack-' + h.id);

  document.title = `${h.title} — DevVerse`;

  root.innerHTML = `
    <div class="glass reveal in" style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:36px;" data-end="${h.end}">
      <div style="height:220px; background:${DV_TECH_GRADIENTS[h.gradient]}; position:relative; display:flex; align-items:flex-end; padding:32px;">
        <div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 30%, rgba(7,8,12,0.75));"></div>
        <div style="position:relative; z-index:1;">
          <span class="chip" style="background:rgba(7,8,12,0.5); border-color:rgba(255,255,255,0.2);">${h.tags[0]}</span>
          <h1 style="margin-top:12px; font-size:clamp(28px,4vw,46px);">${h.title}</h1>
        </div>
      </div>
      <div style="padding:26px 32px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:20px; align-items:center;">
        <div>
          <div class="mono muted" style="font-size:11.5px; margin-bottom:6px;">Time remaining to hack</div>
          <div class="mono countdown" style="font-size:28px; font-weight:700; color:var(--accent);">--:--:--</div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-ghost dv-bookmark ${bookmarked ? 'bookmarked' : ''}" data-bookmark="hack-${h.id}" aria-label="Bookmark this hackathon">
            ${DV_ICON_BOOKMARK}
            <span class="dv-bookmark-label">${bookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button class="btn btn-outline" data-share><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> Share</button>
          <button class="btn ${registered ? 'btn-outline' : 'btn-primary'}" data-register="${h.id}">${registered ? 'Registered ✓' : 'Register now'}</button>
        </div>
      </div>
    </div>

    <div class="detail-grid detail-grid--wide">
      <div style="display:flex; flex-direction:column; gap:36px;">
        <section class="reveal in">
          <div class="eyebrow">Overview</div>
          <p class="lede" style="max-width:none; font-size:16px;">${h.longDesc}</p>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Tracks</div>
          <div class="pc-tags">${h.tracks.map((t) => `<span class="chip chip-accent">${t}</span>`).join('')}</div>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Timeline</div>
          <div class="glass" style="padding:22px;">
            ${h.timeline.map(([label, when]) => `
              <div style="display:flex; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--border);"><span style="font-size:13.5px;">${label}</span><span class="mono" style="font-size:12px; color:var(--text-tertiary);">${when}</span></div>`).join('')}
          </div>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Rules</div>
          <div class="grid grid-2">
            ${h.rules.map((r) => `
              <div class="glass" style="padding:16px; display:flex; gap:10px; align-items:flex-start;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><path d="M20 6L9 17l-5-5"/></svg>
                <span style="font-size:13px;">${r}</span>
              </div>`).join('')}
          </div>
        </section>

        <section class="reveal in">
          <div class="eyebrow">How submissions are judged</div>
          <div class="glass" style="padding:22px; display:flex; flex-direction:column; gap:14px;">
            ${h.judging.map(([criteria, weight]) => `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>${criteria}</span><span class="mono muted">${weight}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${weight}"></div></div>
              </div>`).join('')}
          </div>
        </section>
      </div>

      <aside style="display:flex; flex-direction:column; gap:20px; position:sticky; top:110px;">
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Details</div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Prize pool</span><span style="font-size:13px; font-weight:600;">${h.prize}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Participants</span><span style="font-size:13px; font-weight:600;">${h.participants.toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Difficulty</span><span style="font-size:13px; font-weight:600;">${h.difficulty}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Mode</span><span style="font-size:13px; font-weight:600;">${h.mode}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Organized by</span><span style="font-size:13px; font-weight:600;">${h.organizer}</span></div>
        </div>
      </aside>
    </div>

    <section class="section-tight reveal in">
      <div class="section-head"><h2>Other hackathons</h2></div>
      <div class="grid grid-3" id="related-hackathons"></div>
    </section>
  `;

  document.getElementById('related-hackathons').innerHTML = DV_HACKATHONS.filter((x) => x.id !== h.id).slice(0, 3).map(dvHackathonCardHTML).join('');

  dvReveal(root);
  dvTickCountdowns();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvHackathonDetailInit, 30));
