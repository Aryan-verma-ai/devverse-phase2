# DevVerse — System Design

**Project:** DevVerse — Unified Developer Ecosystem  
**Document status:** Proposed target design for Phase 2  
**Audience:** Project team, Antigravity, reviewers  
**Implementation principle:** Migrate in small, verified stages. Do not rebuild the entire application in one prompt.

## 1. Purpose and product vision

DevVerse is a unified space for developers and students to discover projects, showcase work, find collaborators, participate in technical communities and hackathons, build a portfolio, and learn from practical engineering content.

Phase 2 evolves the existing vanilla HTML/CSS/JavaScript prototype into a maintainable React application with a Node/Express API and MongoDB persistence. The project remains a manageable college project: prefer understandable, reusable code over enterprise complexity.

## 2. Current-state baseline

The supplied Phase 1 source is a browser-first prototype containing 16 HTML pages, shared JavaScript, page-specific scripts/styles, seeded data, and visual assets. It uses `localStorage`/`sessionStorage` and simulated data for some interactions. The supplied source does not include a `package.json`, Express server, MongoDB integration, or automated test suite. The source was inspected statically; it was not confirmed by a runtime or visual test during the documentation pass.

Current destinations include:
- Home dashboard
- Explore projects
- Project detail
- Submit project / GitHub repository import
- Communities directory and community detail
- Codex knowledge base
- Hackathons directory and hackathon detail
- Squads
- Portfolio
- Profile
- Leaderboard
- Settings
- Login and signup

**Baseline rule:** Preserve a clean copy/branch/tag of Phase 1. Inspect the actual repository before changing paths or assuming a feature works. Never describe a prototype interaction as persistent/live until verified.

## 3. Goals and non-goals

### Goals
1. Preserve DevVerse's name, concept, visual identity, existing useful artwork, and key destinations.
2. Migrate the interface to React + Vite using JavaScript/JSX.
3. Use reusable components and predictable React state.
4. Add a Node.js + Express REST API.
5. Persist shared user and feature data in MongoDB using Mongoose.
6. Replace demo-only authentication with server-side password hashing and authorization.
7. Provide clear loading, empty, success, and error states.
8. Keep the code understandable and demonstrate relevant course concepts.
9. Add setup/API/syllabus documentation and practical tests.
10. Review each small task before moving to the next.

### Non-goals for this college-project scope
- Microservices, Kubernetes, or complex cloud infrastructure
- Real-time chat/WebSockets
- Complex recommendation or ranking algorithms
- Email delivery, verification, or password-reset workflows unless separately approved
- A sophisticated admin/moderation console
- Advanced analytics or notification infrastructure
- A full production security/compliance program

## 4. Target architecture

### Frontend
- React with Vite and JavaScript/JSX
- React Router for client-side routes
- CSS with centralized design tokens; retain and refine existing styles/assets
- Feature-oriented page/component organization
- A shared API client and feature services
- React state for transient UI state; server responses are canonical after writes
- `useEffect` for suitable data loading/cleanup and `useRef` for focus/DOM needs; no manual DOM mutation inside React-owned UI

### Backend
- Node.js using ES modules
- Express REST API
- Clear separation between routes, controllers, services, models, middleware, and validators
- Mongoose for MongoDB schemas, validation, indexes, and references
- Centralized error handling and consistent JSON responses
- Server-side authentication and resource ownership checks
- Multer only for scoped image upload flows, with type and size checks

### Development and deployment shape
- Vite serves the client during development and proxies `/api` to Express.
- Production can serve the built client and API from the same origin.
- Configure SPA fallback only for client routes. API 404s and missing assets must remain real 404s.
- Support direct route loads, refresh, browser back/forward, and intentional redirects from old `.html` URLs where needed.
- Use `.env.example` with placeholders only. Never commit real secrets.
- Local MongoDB or MongoDB Atlas setup must be documented.

### Suggested repository layout

```text
DevVerse/
  client/
    index.html
    vite.config.js
    public/assets/
    src/
      main.jsx
      App.jsx
      components/
      pages/
      features/
        auth/
        projects/
        communities/
        squads/
        hackathons/
        portfolio/
        settings/
      services/
        apiClient.js
        authService.js
        projectService.js
        githubService.js
      hooks/
      utils/
      styles/
  server/
    app.js
    index.js
    config/
    models/
    routes/
    controllers/
    services/
    middleware/
    validators/
    utils/
  examples/
    vanilla-dom/
    event-loop/
    modules/
    http-server/
    streams/
  tests/
    unit/
    integration/
    flows/
  docs/
    SETUP.md
    API.md
    SECURITY.md
    SYLLABUS-COVERAGE.md
  postman/
  package.json
  .env.example
  .gitignore
  README.md
```

This is a proposed layout, not a claim about the existing repository. The implementer may make small justified adjustments and must document them.

## 5. Feature scope and migration order

### Tier 1 — first complete vertical slice
1. App shell, route handling, navigation, design tokens, responsive behavior
2. Explore projects: list, search, filter, sort, empty/loading/error states
3. Project detail
4. Submit project manually
5. GitHub repository import with editable fields and graceful failure
6. Server project CRUD and MongoDB persistence after the React slice is stable

### Tier 2 — identity and portfolio
1. Signup/login/logout/current-user flow
2. Profile view/edit and public/private fields
3. Portfolio
4. Settings and local theme/reduced-motion preferences
5. Authorization and ownership tests

### Tier 3 — interaction and collaboration
1. Likes and bookmarks
2. Communities and membership
3. Threads and replies
4. Squads and join requests

### Tier 4 — events and learning
1. Hackathon directory/detail
2. Registration with duplicate prevention
3. Codex knowledge base
4. Leaderboard only after scoring rules and data provenance are defined
5. Dashboard activity and counts only from actual records or clearly labeled demo data

### Tier 5 — release hardening and syllabus evidence
1. Upload validation, error paths, responsive/accessibility pass
2. Unit/API/critical-flow tests
3. Postman collection
4. Setup/security/API/syllabus docs
5. Production build and final manual review

Keep the Phase 1 vanilla version as a reference/backup; do not blindly copy unsafe local authentication or demo behavior into the new system.

## 6. Data model and relationships

Models below are a practical starting point. Keep the model count minimal: add a separate collection only when it improves uniqueness, queryability, or ownership rules. Final fields can be adjusted after checking the actual UI flows.

### User
Suggested fields: `displayName`, normalized unique `username`, normalized unique private `email`, `passwordHash`, `bio`, `avatarUrl`, `skills[]`, `links`, `experience[]`, `achievements[]`, `preferences`, `visibility`, `role`, timestamps.

Rules:
- Never store raw passwords.
- Never return `passwordHash` from API responses.
- Do not expose private email in public profile responses.
- Normalize username/email and enforce uniqueness in the database.
- Theme and reduced-motion preferences may be stored locally for convenience, with account persistence only if implemented deliberately.

### Project
Suggested fields: `title`, `slug` if needed, `description`, `technologies[]`, `category`, `difficulty` if supported, `imageUrl`, `screenshots[]`, `repositoryUrl`, `demoUrl`, `features[]`, `owner` (User ref), timestamps, visibility/status if needed.

Relationships:
- One User owns many Projects.
- Project detail exposes a safe public owner projection.
- Only the owner may edit/delete a project; enforce this on the server.

### Community
Suggested fields: `name`, `slug`, `description`, `icon/image`, `tags[]`, `createdBy` if user-created communities are in scope, timestamps.

Relationship:
- Community has many Threads.
- Membership can initially be represented by a `CommunityMembership` collection if membership actions need uniqueness and querying. Do not create it until the relevant feature is confirmed.

### Thread and Reply
- Thread: `community` ref, `author` User ref, `title`, `body`, timestamps.
- Reply: `thread` ref, `author` User ref, `body`, timestamps.
- A Community has many Threads; a Thread has many Replies.
- Author identity must be returned as a safe public projection.

### Squad and JoinRequest
- Squad: `name`, `description`, `owner` User ref, `members[]` or membership records, `skillsNeeded[]`, status, timestamps.
- JoinRequest: `squad` ref, `user` ref, `message`, `status`, timestamps.
- Prevent duplicate pending requests for the same user/squad pair.

### Hackathon and Registration
- Hackathon: `title`, `description`, `organizer`, `startDate`, `endDate`, `registrationDeadline`, `location` or mode, `url`, `imageUrl`, status, timestamps.
- Registration: `hackathon` ref, `user` ref, `status`, timestamps.
- Enforce a unique `(hackathon, user)` pair to prevent duplicate registrations.

### Bookmark and Like
Use separate records if the UI needs queries, counts, or uniqueness:
- Bookmark: `user` ref + `project` ref + timestamps.
- Like: `user` ref + `project` ref + timestamps.
- Enforce unique `(user, project)` pairs in each collection.
- Do not trust client-provided like/bookmark counts; derive them from stored records or maintain them through a documented, tested approach.

### Activity and leaderboard
- Activity can be introduced only for real events the application records.
- Do not generate random activity.
- Leaderboard score/ranking must have documented deterministic rules and use actual records. If not agreed, label it as sample/demo or defer it.

### Relationship overview

```text
User 1 ─── * Project
User 1 ─── * Thread
Community 1 ─── * Thread
Thread 1 ─── * Reply
User 1 ─── * Reply
User 1 ─── * Squad (as owner)
Squad 1 ─── * JoinRequest
User 1 ─── * JoinRequest
Hackathon 1 ─── * Registration
User 1 ─── * Registration
User 1 ─── * Bookmark ─── 1 Project
User 1 ─── * Like ─────── 1 Project
```

## 7. API conventions

Use `/api` as the API prefix. Keep naming consistent and responses predictable. Example route plan:

| Area | Example endpoints |
|---|---|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Projects | `GET /api/projects`, `POST /api/projects`, `GET /api/projects/:id`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id` |
| Project interactions | `PUT/DELETE /api/projects/:id/bookmark`, `PUT/DELETE /api/projects/:id/like` |
| Users | `GET /api/users/:username`, `PATCH /api/users/me` |
| Communities | `GET /api/communities`, `GET /api/communities/:id`, `POST /api/communities/:id/threads` |
| Threads | `GET /api/threads/:id`, `POST /api/threads/:id/replies` |
| Squads | `GET /api/squads`, `POST /api/squads`, `POST /api/squads/:id/join-requests` |
| Hackathons | `GET /api/hackathons`, `GET /api/hackathons/:id`, `POST /api/hackathons/:id/registrations` |
| Codex | `GET /api/codex` or static client content if persistence is unnecessary |
| Uploads | `POST /api/uploads/avatar`, `POST /api/uploads/project-image` when upload is in scope |

API conventions:
- Use suitable status codes (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `413`, `415`, `429`, `500`).
- Validate request body, path IDs, query parameters, URLs, and uploaded files.
- Paginate lists if they can grow.
- Return a consistent error shape, for example `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
- Do not leak stack traces, secrets, password hashes, or internal database details.
- Never rely on hiding a UI control as authorization.

## 8. Authentication and security decisions

- Hash passwords with bcrypt (or an explicitly approved equivalent).
- Prefer an HttpOnly, Secure-in-production, appropriately SameSite cookie session/token design for the browser, with CSRF protection where required. If a different JWT strategy is selected, document token storage, expiration, refresh/logout behavior, and its tradeoffs before implementation.
- Do not store passwords or long-lived auth tokens in localStorage.
- Protect authenticated endpoints and check ownership on every protected write.
- Normalize and validate inputs server-side as well as client-side.
- Avoid raw `innerHTML` for untrusted data; React text rendering should be used safely.
- Restrict upload type and size; do not trust file extensions alone.
- Add basic authentication rate limiting.
- Validate outbound URLs and allow safe protocols; GitHub import failures must not block manual entry.
- Keep secrets in environment variables and out of source control.
- Use generic public errors; log useful server-side diagnostics without sensitive values.
- Treat this as a college project with sound baseline security, not a claim of production security certification.

## 9. UI/UX rules

- Preserve DevVerse name, concept, violet/cyan identity, theme behavior, and existing assets where appropriate.
- Inspect existing CSS tokens before changing exact colors. Do not replace the identity with a new visual concept without approval.
- Make primary actions obvious and reduce navigation clutter.
- Ensure consistent project-card dimensions, search/filter/reset controls, form grouping, inline validation, and image previews.
- Provide loading, empty, success, and failure states for asynchronous features.
- Clearly label sample data and demo-only metrics.
- Responsive checks: narrow phone, tablet, desktop.
- Accessibility checks: semantic headings, labels, keyboard navigation, visible focus, modal focus management, error announcements, contrast, reduced motion.

## 10. Coding rules

1. Inspect the existing file(s) before editing; do not guess paths or rewrite unrelated files.
2. Make one task-sized change per prompt.
3. Preserve current working behavior unless the task explicitly changes it.
4. Use reusable components, but do not abstract trivial one-use code without a clear benefit.
5. Use JavaScript/JSX and explain course-relevant concepts in concise comments/docs where helpful.
6. Keep React rendering declarative; no manual DOM mutation of React-owned UI.
7. Keep API calls in service modules, not scattered through presentation components.
8. Keep controllers thin; put reusable business rules in services.
9. Validate at both client and server; server validation is authoritative.
10. Never hardcode secrets, passwords, tokens, or private connection strings.
11. Do not silently introduce a new framework, database, UI library, or state library.
12. Avoid duplicate state; derive filtered/sorted results from source data.
13. Use accessible labels, useful errors, and explicit busy states.
14. Do not fake success when a network/database operation fails.
15. Add/update tests for the behavior changed.
16. Run the relevant tests/build after each task and report the exact result.
17. If a command cannot run because a dependency, service, or credential is missing, report the blocker rather than claiming success.
18. Stop at the checkpoint. Do not start the next task until the user approves.
19. Keep `README.md`, `.env.example`, and setup instructions consistent with the actual implementation.
20. Avoid overengineering; prefer the simplest design that meets the agreed acceptance criteria.

## 11. Testing and acceptance criteria

### Each-task checkpoint
At the end of every prompt, the implementer must report:
- Files created/changed
- What was implemented
- Commands/tests run and actual results
- Manual checks performed and their results
- Known limitations or blockers
- Whether the task's acceptance criteria pass
- A short review checklist for the user
- **STOP** and wait for approval before the next prompt

### Release acceptance
- Existing DevVerse destinations are preserved or intentionally redirected.
- React client builds successfully and routes work on direct load/refresh/back/forward.
- Core project discovery/detail/submission flow works end to end.
- GitHub import has useful success/failure handling and manual-entry fallback.
- Data that should be shared persists in MongoDB and survives restart.
- Signup/login/logout/current-user flows work; passwords are hashed.
- Server-side ownership rules prevent cross-user edits/deletes.
- Search/filter/sort are deterministic and do not inject HTML.
- Likes/bookmarks/registrations prevent duplicates.
- Forms show validation, busy, success, and failure states.
- No unexplained fake metrics/activity are presented as real.
- API errors are consistent; unknown API routes return 404.
- Tests for critical utilities, API flows, and core user journeys pass.
- Setup/API/security/syllabus docs match the real code.
- Production build succeeds and responsive/accessibility checks are documented.
- No secrets or real credentials are committed.

## 12. Implementation order

1. Baseline inventory and backup
2. Confirm scope and visual reference
3. Package/workspace and Vite/React setup
4. Shared design tokens and app shell
5. React routing and legacy URL plan
6. Reusable UI primitives
7. Explore projects with local seed data
8. Project detail
9. Submit project and GitHub import
10. Client unit/flow checks and review
11. Express foundation and health endpoint
12. API conventions, validation and error handling
13. MongoDB connection and model setup
14. Project API and persistence
15. Connect React project services to API
16. Auth and authorization
17. Profile and portfolio
18. Likes/bookmarks
19. Communities/threads/replies
20. Squads/join requests
21. Hackathons/registrations
22. Codex/leaderboard/activity scope decision
23. Uploads and security hardening
24. Tests, docs, Postman and release review

The separate Antigravity prompt file contains the actual gated, task-by-task instructions.
