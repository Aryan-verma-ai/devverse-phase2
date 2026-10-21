# DevVerse — Project Scripts and Dependencies Plan

**Phase:** Phase A — Inspect and Plan (Prompt 04)  
**Document Status:** Approved Target Specification  
**Architecture Reference:** [SYSTEM-DESIGN.md](file:///c:/Users/acer/OneDrive/Desktop/DevVerse/SYSTEM-DESIGN.md)

---

## 1. Current Environment & Baseline State

* **Node.js:** `v22.19.0` (LTS with native ES modules, Fetch API, and Promise APIs).
* **npm:** `10.9.3` (supports native npm workspaces).
* **Package Manifests:** Currently absent in the root.
* **Workspace Status:** No dependencies installed, preserving pristine Phase 1 baseline.

---

## 2. Workspace Architecture

A clean, standard **npm monorepo with two workspaces** (`client` and `server`), orchestrated from the root:

```text
DevVerse/
├── package.json             # Root workspace orchestration
├── client/                  # Frontend workspace (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
├── server/                  # Backend workspace (Node.js + Express)
│   ├── package.json
│   ├── index.js
│   ├── app.js
│   └── ...
├── docs/                    # Architecture, parity, and setup guides
└── ...                      # Phase 1 baseline source (preserved)
```

---

## 3. Minimum Dependency Breakdown

### A. Client Workspace (`client/package.json`)

#### Production Dependencies
* **`react` & `react-dom`** (`^18.3.1` or `^19.0.0`):  
  * *Purpose:* Core UI library for component composition, declarative DOM rendering, and unidirectional state.
* **`react-router-dom`** (`^6.28.0`):  
  * *Purpose:* Client-side SPA routing, dynamic route parameters (`/projects/:id`, `/communities/:id`), query string parsing, and legacy redirects (`/explore.html` → `/explore`).

#### Developer Dependencies
* **`vite`** (`^6.0.0`):  
  * *Purpose:* Development server with Hot Module Replacement (HMR) and optimized Rollup production builds.
* **`@vitejs/plugin-react`** (`^4.3.4`):  
  * *Purpose:* JSX transformation and fast refresh for React in Vite.
* **`vitest`** (`^2.1.0`):  
  * *Purpose:* Fast unit and component test runner matching Vite configuration directly.
* **`@testing-library/react`** (`^16.0.0`):  
  * *Purpose:* Component behavior testing from the end-user perspective.
* **`@testing-library/jest-dom`** (`^6.6.0`):  
  * *Purpose:* Declarative DOM assertions (`toBeInTheDocument`, `toBeVisible`).
* **`jsdom`** (`^25.0.0`):  
  * *Purpose:* Browser DOM environment for running Vitest in Node.

---

### B. Server Workspace (`server/package.json`)

#### Production Dependencies
* **`express`** (`^4.21.0`):  
  * *Purpose:* REST API routing, request parsing, middleware pipeline, and centralized error handling.
* **`mongoose`** (`^8.8.0`):  
  * *Purpose:* MongoDB Object Data Modeling (ODM) for schemas, validations, compound unique indexes, and document relationships.
* **`dotenv`** (`^16.4.5`):  
  * *Purpose:* Loads environment variables (`PORT`, `MONGODB_URI`, `SESSION_SECRET`) from `.env` in local development.
* **`cors`** (`^2.8.5`):  
  * *Purpose:* Cross-Origin Resource Sharing middleware for local development.
* **`cookie-parser`** (`^1.4.7`):  
  * *Purpose:* Parses signed HttpOnly session cookies for stateful server-side authentication.
* **`bcryptjs`** (`^2.4.3`):  
  * *Purpose:* Pure JavaScript password hashing with salt rounds. Avoids native Windows C++ compilation tools required by `bcrypt`.
* **`multer`** (`^1.4.5-lts.1`):  
  * *Purpose:* Handles multipart/form-data for avatar and project screenshot uploads with strict file type and size limits.

#### Developer Dependencies
* **`nodemon`** (`^3.1.7`):  
  * *Purpose:* Auto-reloads Express during backend development on file changes.
* **`supertest`** (`^7.0.0`):  
  * *Purpose:* HTTP integration testing against Express route endpoints without binding to external live ports.

---

### C. Root Workspace (`package.json`)

#### Developer Dependencies
* **`concurrently`** (`^9.1.0`):  
  * *Purpose:* Runs `client` (Vite) and `server` (Express) simultaneously in a single terminal with colored output prefixes.

---

## 4. Libraries Explicitly Rejected

| Library | Decision | Rationale |
|---|---|---|
| **Redux / Zustand / MobX** | **Rejected** | React built-in state (`useState`, `useContext`) and service modules are cleaner, more transparent, and appropriate for college project scope. |
| **TailwindCSS** | **Rejected** | The project has an established custom design system in [css/style.css](file:///c:/Users/acer/OneDrive/Desktop/DevVerse/css/style.css). Preserving CSS tokens maintains visual fidelity without build complexities. |
| **MUI / Ant Design / Chakra** | **Rejected** | Heavy third-party UI kits would override DevVerse's bespoke violet/cyan glassmorphic identity. |
| **Axios** | **Rejected** | Modern browsers and Node 22 include native `fetch`. A lightweight `apiClient.js` demonstrates the service pattern without extra weight. |
| **Socket.io** | **Rejected** | Real-time chat is an explicit non-goal per [SYSTEM-DESIGN.md](file:///c:/Users/acer/OneDrive/Desktop/DevVerse/SYSTEM-DESIGN.md). |

---

## 5. Course Syllabus Concepts Demonstrated

1. **Component-Based UI Architecture:** Declarative JSX, props, unidirectional data flow, React Router 6 SPA routing.
2. **RESTful Architecture:** Semantic HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`), standard status codes, parameterization (`/api/projects/:id`), consistent JSON error schema.
3. **Backend Middleware Pipeline:** Express middleware chaining, request logging, CORS handling, cookie parsing, error handling middleware.
4. **Data Modeling & MongoDB Schemas:** Mongoose schemas, data casting, unique indexing, document referencing, timestamps.
5. **Security Best Practices:** Cryptographic password hashing (bcrypt), HttpOnly SameSite cookie sessions, data sanitization, preventing credential leakage in JSON projections.
6. **Automated Testing:** Unit tests for helper algorithms (compatibility matcher) and integration tests for REST endpoints (Supertest).

---

## 6. Supported Command Scripts

```json
{
  "scripts": {
    "dev": "concurrently -n \"client,server\" -c \"cyan,magenta\" \"npm run dev --workspace=client\" \"npm run dev --workspace=server\"",
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "build": "npm run build --workspace=client",
    "start": "npm start --workspace=server",
    "test": "npm run test:client && npm run test:server",
    "test:client": "npm run test --workspace=client",
    "test:server": "npm run test --workspace=server"
  }
}
```

---

## 7. Next Step Verification

In **Prompt 05**, only the `client` workspace will be initialized with the minimum packages (`react`, `react-dom`, `vite`, `@vitejs/plugin-react`). The server workspace and dependencies will remain uninstalled until Tier 1 frontend slices are verified.
