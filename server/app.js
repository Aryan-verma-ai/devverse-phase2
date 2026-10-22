/**
 * DEVVERSE — Express Application
 *
 * Creates and configures the Express app.
 * Intentionally separated from the HTTP server binding in index.js so the
 * same app instance can be imported cleanly by integration tests without
 * starting a real TCP listener.
 *
 * Middleware pipeline order (order matters in Express):
 *   1. CORS
 *   2. JSON body parser (with size limit + malformed-JSON error handling)
 *   3. Request logger
 *   4. Feature routes  (added in later prompts)
 *   5. /api health route
 *   6. /api/* not-found handler
 *   7. Centralized error handler (must be last)
 *
 * What does NOT belong here:
 *   - database.connect() — belongs in index.js
 *   - process.listen()  — belongs in index.js
 *   - Business logic    — belongs in controllers / services
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import { getDatabaseStatus } from './config/database.js';
import requestLogger from './middleware/requestLogger.js';
import { authenticateUser } from './middleware/auth.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import { validateBody } from './utils/validate.js';
import AppError from './utils/AppError.js';

const app = express();

// ---------------------------------------------------------------------------
// 1. CORS
// Allow requests from the Vite dev server during development.
// In production the React build is served from the same origin, so CORS
// is only needed in development (or if API and frontend are on separate domains).
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// 2. Body & Cookie parsers
// express.json() emits a SyntaxError for malformed JSON — the centralized
// errorHandler catches and formats it as { code: 'BAD_JSON', status: 400 }.
// The 1 MB limit rejects oversized payloads before they are parsed.
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 3. Request logger
// Logs method, URL, response status, and duration on response finish.
// Body and headers are never logged.
// ---------------------------------------------------------------------------
app.use(requestLogger);

// ---------------------------------------------------------------------------
// 4. Authentication (populates req.user from cookie or Bearer header)
// ---------------------------------------------------------------------------
app.use(authenticateUser);

// ---------------------------------------------------------------------------
// 5. Feature routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// ---------------------------------------------------------------------------
// 5. Health endpoint
// ---------------------------------------------------------------------------

/**
 * GET /api/health
 * Liveness probe. Returns current status, environment, and timestamp.
 * Safe to expose publicly — contains no sensitive data.
 */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'devverse-api',
    environment: env.NODE_ENV,
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// DEV/TEST-ONLY routes
// These routes exercise middleware without needing a real feature route.
// They are gated behind NODE_ENV !== 'production' so they are stripped in
// production builds and never exposed to real users.
// ---------------------------------------------------------------------------
if (env.NODE_ENV !== 'production') {
  /**
   * POST /api/_test/validate
   * Exercises the validateBody middleware with a minimal schema.
   * Used by integration tests only.
   */
  app.post(
    '/api/_test/validate',
    validateBody({
      title: { required: true, type: 'string', minLength: 3, maxLength: 80, label: 'Title' },
      url:   { required: false, type: 'string', pattern: /^https?:\/\//, label: 'URL' },
    }),
    (_req, res) => {
      res.status(200).json({ status: 'ok', message: 'Validation passed.' });
    }
  );

  /**
   * GET /api/_test/error
   * Throws a known AppError to test the error handler pipeline.
   */
  app.get('/api/_test/error', (_req, _res, next) => {
    next(new AppError('Test error from route.', 418, 'TEST_ERROR'));
  });

  /**
   * GET /api/_test/unexpected
   * Throws an unexpected (non-AppError) error to test the 500 path.
   */
  app.get('/api/_test/unexpected', () => {
    throw new Error('Simulated unexpected server error.');
  });
}

// ---------------------------------------------------------------------------
// 6. Unknown /api route → 404
// Must be AFTER all real API routes and BEFORE the error handler.
// ---------------------------------------------------------------------------
app.use('/api', notFound);

// ---------------------------------------------------------------------------
// 7. Centralized error handler
// Must be the LAST middleware registered — Express identifies a 4-argument
// function as an error handler.
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;
