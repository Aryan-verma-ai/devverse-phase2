# DevVerse — Routing and Legacy URL Specification

**Document Status:** Approved Specification  
**Phase:** Phase B — Frontend Foundation (Prompt 08)  
**Reference Architecture:** [SYSTEM-DESIGN.md](../SYSTEM-DESIGN.md)

---

## 1. Overview

With the migration from static multi-page HTML prototype to a single-page React application powered by `react-router-dom` (v6.28.0), all platform destinations are managed through declarative client-side routes.

This document records the exact route mapping, backward compatibility redirects for existing `.html` URLs, fallback handling, and SPA development server proxy rules.

---

## 2. Route Directory & Mapping

| # | Feature / Page | Legacy Phase 1 URL | Modern React Route | Status / View Component |
|---|---|---|---|---|
| 1 | Home Dashboard | `/index.html` | `/` | `PlaceholderPage` (`AppShell`) |
| 2 | Explore Projects | `/explore.html` | `/explore` | `PlaceholderPage` (`AppShell`) |
| 3 | Project Detail | `/project.html?id=:id` | `/projects/:id` | `PlaceholderPage` (`AppShell`) |
| 4 | Submit Project | `/submit-project.html` | `/submit-project` | `PlaceholderPage` (`AppShell`) |
| 5 | Communities Directory | `/communities.html` | `/communities` | `PlaceholderPage` (`AppShell`) |
| 6 | Community Forum Detail | `/community.html?id=:id` | `/communities/:id` | `PlaceholderPage` (`AppShell`) |
| 7 | Hackathons Directory | `/hackathons.html` | `/hackathons` | `PlaceholderPage` (`AppShell`) |
| 8 | Hackathon Detail | `/hackathon.html?id=:id` | `/hackathons/:id` | `PlaceholderPage` (`AppShell`) |
| 9 | Squads & Matcher | `/squads.html` | `/squads` | `PlaceholderPage` (`AppShell`) |
| 10 | Portfolio Builder | `/portfolio.html` | `/portfolio` | `PlaceholderPage` (`AppShell`) |
| 11 | Developer Profile | `/profile.html` | `/profile` | `PlaceholderPage` (`AppShell`) |
| 12 | Leaderboard | `/leaderboard.html` | `/leaderboard` | `PlaceholderPage` (`AppShell`) |
| 13 | The Codex | `/codex.html` | `/codex` | `PlaceholderPage` (`AppShell`) |
| 14 | Settings | `/settings.html` | `/settings` | `PlaceholderPage` (`AppShell`) |
| 15 | Sign In | `/login.html` | `/login` | `PlaceholderPage` (`AppShell`) |
| 16 | Sign Up | `/signup.html` | `/signup` | `PlaceholderPage` (`AppShell`) |

---

## 3. Legacy URL Redirects

To prevent broken bookmarks, existing browser history, or links in external documentation from failing, `App.jsx` registers explicit client-side redirects using `<Navigate to="..." replace />`:

```jsx
<Route path="/index.html" element={<Navigate to="/" replace />} />
<Route path="/explore.html" element={<Navigate to="/explore" replace />} />
<Route path="/project.html" element={<Navigate to="/explore" replace />} />
<Route path="/submit-project.html" element={<Navigate to="/submit-project" replace />} />
<Route path="/communities.html" element={<Navigate to="/communities" replace />} />
<Route path="/community.html" element={<Navigate to="/communities" replace />} />
<Route path="/hackathons.html" element={<Navigate to="/hackathons" replace />} />
<Route path="/hackathon.html" element={<Navigate to="/hackathons" replace />} />
<Route path="/squads.html" element={<Navigate to="/squads" replace />} />
<Route path="/portfolio.html" element={<Navigate to="/portfolio" replace />} />
<Route path="/profile.html" element={<Navigate to="/profile" replace />} />
<Route path="/leaderboard.html" element={<Navigate to="/leaderboard" replace />} />
<Route path="/codex.html" element={<Navigate to="/codex" replace />} />
<Route path="/settings.html" element={<Navigate to="/settings" replace />} />
<Route path="/login.html" element={<Navigate to="/login" replace />} />
<Route path="/signup.html" element={<Navigate to="/signup" replace />} />
```

---

## 4. 404 Not Found & Error Fallback

Any unmatched route path is caught by the wildcard route:
```jsx
<Route path="*" element={<PlaceholderPage title="404 — Page Not Found" ... />} />
```
This renders a user-friendly error screen retaining the `AppShell` navigation dock, alerting the user to invalid or missing paths, and offering one-click recovery buttons back to Home (`/`) or Explore (`/explore`).

---

## 5. Server Proxy & SPA Fallback Boundaries

Per Section 1.5 of `SYSTEM-DESIGN.md`:
- **Vite Development Proxy (`vite.config.js`):**
  Requests starting with `/api` are proxied directly to Express at `http://localhost:5000` with `changeOrigin: true`.
- **SPA Fallback Protection:**
  The development server and production Express static serving must **never** rewrite `/api/*` or missing static assets (`.png`, `.svg`, `.js`, `.css`) into `index.html`. Unmatched API requests must always produce genuine HTTP 404/500 JSON responses.
