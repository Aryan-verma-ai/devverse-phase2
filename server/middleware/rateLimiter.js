/**
 * DEVVERSE — Rate Limiter Middleware
 *
 * ─── CURRENT STATUS ─────────────────────────────────────────────────────────
 * This module provides a simple in-memory rate limiter.
 *
 * It is NOT wired into any route in Prompt 16 because there are no auth routes
 * yet (those arrive in Prompt 21). The limiter is implemented here so it is
 * ready to apply immediately when `/api/auth/login` and `/api/auth/signup` are
 * created, without introducing a new dependency at that point.
 *
 * ─── WHERE IT WILL BE APPLIED ───────────────────────────────────────────────
 * In Prompt 21 (auth routes), add to server/routes/auth.js:
 *
 *   import { authRateLimiter } from '../middleware/rateLimiter.js';
 *   router.post('/login',  authRateLimiter, authController.login);
 *   router.post('/signup', authRateLimiter, authController.signup);
 *
 * ─── DESIGN DECISIONS ───────────────────────────────────────────────────────
 * - In-memory store: suitable for a single-process college project.
 *   In a multi-process / clustered deployment, use Redis + express-rate-limit.
 * - Keyed by IP address (req.ip). Express must have `app.set('trust proxy', 1)`
 *   set if running behind a proxy/load-balancer (e.g. Nginx, Heroku).
 * - Window: 15 minutes, 20 requests max (generous for development).
 *   Tighten to 5–10 for production.
 * - Returns standard 429 + Retry-After header.
 *
 * ─── WHY NOT express-rate-limit ─────────────────────────────────────────────
 * The approved dependency plan lists only: express, dotenv, cors, mongoose,
 * bcryptjs, cookie-parser, multer, nodemon, supertest.
 * express-rate-limit is NOT listed. This implementation provides equivalent
 * behavior using ~60 lines of plain JS and no new package.
 */

import AppError from '../utils/AppError.js';

// ---------------------------------------------------------------------------
// In-memory store: ip → { count, resetAt }
// The store is module-scoped so it persists for the process lifetime.
// ---------------------------------------------------------------------------
const store = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 20;           // per window

/**
 * Rate limiter middleware for authentication routes.
 *
 * Allows MAX_REQUESTS per IP per WINDOW_MS.
 * On limit exceeded: 429 with Retry-After header.
 *
 * @type {import('express').RequestHandler}
 */
export function authRateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  let record = store.get(ip);

  // Create or reset expired window
  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, record);
  }

  record.count += 1;

  // Set informational headers even on success (mirrors standard rate-limit headers)
  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

  if (record.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', retryAfterSec);
    return next(
      new AppError(
        `Too many requests from this IP. Please wait ${retryAfterSec} seconds before retrying.`,
        429,
        'RATE_LIMITED'
      )
    );
  }

  next();
}

/**
 * Clears the in-memory store.
 * Useful in tests to reset state between test cases.
 */
export function clearRateLimitStore() {
  store.clear();
}
