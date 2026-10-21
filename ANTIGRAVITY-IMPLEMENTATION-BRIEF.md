# DevVerse — Antigravity Implementation Brief

## Mission

Continue the existing **DevVerse — Unified Developer Ecosystem** project. Do not create a different product and do not attempt a full rebuild in one giant prompt. Work from the actual Phase 1 files, preserve the concept and visual identity, and implement the approved target architecture in small reviewable tasks.

The detailed architecture, relationships, API conventions, security rules and acceptance criteria are in `SYSTEM-DESIGN.md`. The task sequence and copy/paste prompts are in `DEVVERSE-ANTIGRAVITY-TASK-PROMPTS.txt`.

## Product context

DevVerse helps developers and students discover projects, showcase their work, find collaborators, join communities and hackathons, build a portfolio, and learn through Codex/engineering content.

The supplied Phase 1 prototype contains 16 HTML pages, vanilla CSS/JS, assets, and local/demo data. It does not include a backend, package manifest, MongoDB integration or automated test suite. The supplied source was inspected statically, not runtime/visual tested. Verify the actual working tree before assuming anything.

## Target architecture

- **Client:** React + Vite + JavaScript/JSX; React Router; CSS/design tokens; reusable components; feature services; accessible responsive UI.
- **Server:** Node.js + Express REST API using ES modules; routes/controllers/services/middleware/validators.
- **Database:** MongoDB + Mongoose; indexed, validated schemas and references.
- **Testing/docs:** unit tests, API integration tests, critical-flow checks, Postman collection, setup/API/security/syllabus docs.
- **Development:** Vite `/api` proxy to Express; production SPA fallback must not swallow API or missing-asset 404s.
- **Auth:** password hashing, server-side auth, ownership checks, safe cookie/token approach documented before implementation. Never persist plaintext passwords or long-lived auth tokens in localStorage.

## Feature scope

### Preserve and migrate
- Home/dashboard
- Explore projects
- Project detail
- Submit project and GitHub import
- Communities and community detail/discussions
- Codex
- Hackathons and detail/registration
- Squads
- Portfolio
- Profile
- Leaderboard
- Settings
- Login/signup

### Prioritize vertical slices
1. React shell, navigation, routing, responsive design system
2. Explore → project detail → submit project → GitHub import
3. Express foundation → MongoDB → project persistence
4. Auth → profile/portfolio
5. Likes/bookmarks
6. Communities/threads/replies
7. Squads/join requests
8. Hackathons/registrations
9. Codex, leaderboard and activity after verifying scope/data rules
10. Hardening, tests, docs, accessibility and build review

### Explicitly avoid unless separately approved
Microservices, Kubernetes, real-time chat, complex recommendation engines, advanced analytics, email delivery/password reset systems, and a complex admin console.

## Database relationship summary

- User 1 → many Projects
- Community 1 → many Threads
- Thread 1 → many Replies
- User authors Threads and Replies
- User owns Squads; Squad has JoinRequests and members
- Hackathon 1 → many Registrations; unique `(hackathon, user)`
- User has Bookmarks and Likes for Projects; unique `(user, project)` in each
- Activity and leaderboard must be based on actual recorded events and documented scoring rules, or remain explicitly labeled demo content.

Only add collections needed for the agreed feature behavior. Final fields should be checked against current forms and flows before coding.

## Coding and workflow rules

1. Start with repository inspection. Never assume file paths or scripts.
2. Preserve a recoverable Phase 1 baseline/branch before large changes.
3. One prompt = one small, coherent task.
4. Do not begin the next task until the user reviews and approves the current checkpoint.
5. Make only changes needed for the current task; do not refactor unrelated areas.
6. Do not silently add frameworks, libraries, services or scope.
7. Keep React UI declarative. Do not use manual DOM mutation inside React-owned UI.
8. Keep HTTP calls in service modules; keep controllers thin and business rules reusable.
9. Validate inputs on the server; enforce ownership server-side.
10. Never hardcode secrets or commit `.env` values. Keep `.env.example` placeholders only.
11. Do not fake successful requests, persistent data, live activity or real metrics.
12. Test after every task and report exact commands/results. If blocked, say so.
13. Keep code understandable for a college project and explain non-obvious choices.
14. At every checkpoint, list changed files, behavior, tests, manual checks, limitations and review questions; then STOP.
15. Do not claim visual testing unless the app was actually launched and checked.

## Checkpoint template

For every task, report:

- **Task:** ID and title
- **Files changed:** exact paths
- **Implementation:** short factual summary
- **Automated checks:** commands and actual pass/fail output
- **Manual checks:** actions actually performed and results
- **Acceptance checklist:** pass/fail/not run for each criterion
- **Risks/blockers:** anything unresolved
- **Review request:** what the user should inspect
- **Status:** `READY FOR REVIEW — STOPPED`

Never start the next task automatically.

## Definition of done

- The project still clearly feels like DevVerse.
- Current destinations are preserved or intentionally redirected.
- Core project flow works from UI to API to MongoDB.
- Authentication and authorization are enforced on the server.
- Shared records persist and are visible to authorized users.
- Loading/empty/success/error states are present.
- Responsive and accessibility checks are documented.
- Critical tests and production build pass.
- Setup/API/security/syllabus docs match the actual code.
- No secrets or plaintext passwords are stored/committed.
- Each staged task has been reviewed and approved.
