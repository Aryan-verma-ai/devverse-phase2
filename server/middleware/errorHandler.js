/**
 * DEVVERSE — Centralized Error Handler Middleware
 *
 * This is the single place where all errors are formatted and returned to clients.
 * Every route handler and middleware should either:
 *   a) call next(new AppError(...)) for known, expected errors, or
 *   b) call next(err) for unexpected errors to let this handler format them safely.
 *
 * Consistent JSON error shape (all error responses):
 * {
 *   "status":  "error",
 *   "code":    "SCREAMING_SNAKE_CODE",  // machine-readable, safe to match in client code
 *   "message": "Human-readable text",   // safe for display; never contains internal details
 *   "details": [                         // optional; present only for validation errors
 *     { "field": "title", "message": "Title is required." }
 *   ],
 *   "stack":   "..."                    // development only, never in production
 * }
 *
 * Known error codes used across the application:
 *   VALIDATION_ERROR  (422) — field-level validation failure
 *   BAD_JSON          (400) — malformed JSON request body
 *   NOT_FOUND         (404) — resource or route does not exist
 *   UNAUTHORIZED      (401) — not authenticated
 *   FORBIDDEN         (403) — authenticated but not authorized
 *   CONFLICT          (409) — e.g. duplicate username/email
 *   RATE_LIMITED      (429) — too many requests (auth routes)
 *   INTERNAL_ERROR    (500) — unexpected server error
 */

import AppError from '../utils/AppError.js';
import env from '../config/env.js';

/**
 * Express 4-argument error-handling middleware.
 * MUST be registered last, after all routes and other middleware.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  // ── 1. Handle malformed JSON bodies ────────────────────────────────────────
  // Express's built-in JSON parser throws a SyntaxError when the body is
  // invalid JSON. Detect it by checking err.type from the body-parser package.
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      status: 'error',
      code: 'BAD_JSON',
      message: 'Request body contains malformed JSON. Please check the syntax and try again.',
    });
  }

  // ── 2. Handle body too large ────────────────────────────────────────────────
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body exceeds the maximum allowed size.',
    });
  }

  // ── 3. Known operational errors (AppError instances) ───────────────────────
  // These are anticipated, deliberate errors thrown by controllers/services.
  // The message is safe to surface to the client as-is.
  if (err instanceof AppError) {
    const body = {
      status: 'error',
      code: err.code,
      message: err.message,
    };
    if (err.details && err.details.length > 0) {
      body.details = err.details;
    }
    if (env.NODE_ENV === 'development') {
      body.stack = err.stack;
    }
    return res.status(err.status).json(body);
  }

  // ── 4. Unexpected errors ────────────────────────────────────────────────────
  // Log the full error server-side (so it can be debugged), but return only a
  // safe generic message to the client. Stack traces NEVER reach production clients.
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.method} ${req.url}:`, err);

  const status = err.status || err.statusCode || 500;
  const body = {
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message: env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : (err.message || 'An unexpected error occurred.'),
  };

  if (env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  return res.status(status).json(body);
}
