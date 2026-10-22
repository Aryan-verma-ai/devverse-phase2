# DevVerse — Authentication Architecture & Design Decision

**Phase:** Phase E — Authentication and User Features (Prompt 21)  
**Status:** Approved Architecture Specification  
**Authority:** [SYSTEM-DESIGN.md](file:///c:/Users/acer/OneDrive/Desktop/DevVerse-Phase%201/SYSTEM-DESIGN.md) (Section 8)

---

## 1. Executive Summary & Design Decision

DevVerse adopts a **Stateful, Signed, HttpOnly Cookie Session** authentication mechanism using cryptographic HMAC-SHA256 signatures over an unforgeable session payload.

### Why HttpOnly Cookies over LocalStorage JWT
| Vector | LocalStorage JWT | Signed HttpOnly Cookie (DevVerse Approach) |
|---|---|---|
| **XSS Vulnerability** | High. Any compromised client script or XSS flaw can access `localStorage.getItem('token')` and exfiltrate user credentials. | **Immune.** JavaScript cannot inspect or read `HttpOnly` cookies (`document.cookie` returns nothing for this cookie). |
| **CSRF Protection** | No automatic credential attachment. | Protected via `SameSite: 'lax'` attribute + custom `Content-Type: application/json` headers on state-changing API routes. |
| **Revocation / Logout** | Difficult. Stateless JWTs remain valid until natural expiration unless maintaining a distributed blacklist. | Instant. Clear cookie via `res.clearCookie()` immediately destroys client credential; server rejects unsigned/expired cookies. |
| **Persistence** | Persists indefinitely unless manually cleared. | Configurable `maxAge` (7 days) with sliding refresh capability. |
| **Browser Integration** | Requires client interceptors or custom fetch headers on every outbound request. | Automatically dispatched by modern browsers on all same-origin and proxied `/api` requests (`credentials: 'include'`). |

---

## 2. Cookie Configuration & Security Flags

| Flag | Value | Rationale |
|---|---|---|
| **Name** | `devverse_session` | Namespaced cookie identifier. |
| **`httpOnly`** | `true` | Prevents client-side scripts from reading the cookie via DOM/XSS. |
| **`secure`** | `process.env.NODE_ENV === 'production'` | Forces HTTPS in production deployments while permitting HTTP over localhost during development. |
| **`sameSite`** | `'lax'` | Baseline cross-site request forgery protection. Permits safe top-level GET navigation while blocking cross-origin POST/PATCH/DELETE subresource requests. |
| **`maxAge`** | `7 * 24 * 60 * 60 * 1000` (7 days) | Sensible user session duration for developer portfolio workflows. |
| **`path`** | `'/'` | Available across all `/api` and client routes. |

---

## 3. Session Signature & Cryptographic Integrity

Each session cookie encapsulates a base64-encoded JSON payload coupled with an HMAC-SHA256 signature generated using `SESSION_SECRET`:

```
devverse_session = base64(payload) . signature
```

* **Payload Structure**:
  ```json
  {
    "userId": "6717a1234567890abcdef123",
    "username": "ari_dev",
    "role": "user",
    "iat": 1792675200000,
    "exp": 1793280000000
  }
  ```
* **Tamper Resistance**: If any user attempts to alter the `userId`, `role`, or `exp` timestamp in the cookie, signature verification fails and Express discards the session with an HTTP 401 response.
* **No External JWT Library Needed**: Pure Node.js `node:crypto` provides native HMAC-SHA256 signing without adding third-party JWT dependencies outside the approved dependency plan.

---

## 4. Password Security & Storage Rules

1. **Hashing Algorithm**:
   - `bcryptjs` with salt round factor of `12`.
   - Never store or log plaintext passwords.
2. **Schema Protection**:
   - `User.passwordHash` is configured with `select: false` in Mongoose.
   - User `toJSON` / `toObject` transform hooks explicitly delete `passwordHash` and `__v`.
3. **Generic Error Messages**:
   - On failed login: `"Invalid username/email or password."` (HTTP 401). Never indicate whether it was the username or password that failed, preventing username harvesting.

---

## 5. Rate Limiting Strategy

* **Endpoints Protected**:
  - `POST /api/auth/login`
  - `POST /api/auth/signup`
* **Limiter Configuration**:
  - In-memory `authRateLimiter` (`server/middleware/rateLimiter.js`).
  - Limits each IP address to **20 requests per 15-minute window**.
  - Exceeding limit triggers `HTTP 429 RATE_LIMITED` with a `Retry-After` header.

---

## 6. Local Development & Proxy Setup

* **Vite Proxy (`client/vite.config.js`)**:
  - Proxies `/api` requests from `http://localhost:5173` to `http://localhost:5000`.
  - Because requests to `/api` share the Vite origin in the browser, cookies are handled as first-party same-site cookies without cross-origin friction.
* **Express CORS**:
  - `cors({ origin: env.CLIENT_ORIGIN, credentials: true })` ensures credentials and cookies pass through if accessed across ports.
