/* =========================================================
   HACKATHONS (listing)
   Card rendering + the countdown ticker itself now live in
   app.js since the Profile library and hackathon.html's
   "Other hackathons" section need them too.
   ========================================================= */

function dvHackathonsInit() {
  const root = document.getElementById('hackathons-grid');
  if (!root) return;
  root.innerHTML = DV_HACKATHONS.map(dvHackathonCardHTML).join('');
  dvReveal(root);
  dvTickCountdowns();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvHackathonsInit, 30));
