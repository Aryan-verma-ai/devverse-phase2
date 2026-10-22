/**
 * DEVVERSE — Not Found Handler for /api Routes
 *
 * Catches any request to /api/* that was not matched by a registered route.
 * Must be registered AFTER all real API routes and BEFORE the error handler.
 *
 * Returns a structured JSON 404 — never HTML, never the React index page.
 *
 * Non-/api paths (e.g. static assets, React routes) are not handled here;
 * in production the static file server or SPA fallback handles those separately.
 */

/**
 * Express middleware that returns 404 JSON for unmatched /api routes.
 *
 * @type {import('express').RequestHandler}
 */
export default function notFound(_req, res) {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: 'The requested API endpoint does not exist.',
  });
}
