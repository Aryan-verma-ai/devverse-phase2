/**
 * DEVVERSE — Express Application
 *
 * Creates and configures the Express app.
 * Intentionally separated from the HTTP server binding in index.js so the
 * same app instance can be imported cleanly by integration tests (Prompt 16+)
 * without starting a real TCP listener.
 *
 * What belongs here:
 *   - Middleware registration (cors, JSON parsing, logging)
 *   - Route mounting
 *   - 404 handler for unknown /api routes
 *   - Centralized error handler
 *
 * What does NOT belong here:
 *   - database.connect() — belongs in index.js
 *   - process.listen()  — belongs in index.js
 *   - Business logic    — belongs in controllers / services
 */

import express from 'express';
import cors from 'cors';
import env from './config/env.js';

const app = express();

// ---------------------------------------------------------------------------
// CORS
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
// Body parsing
// Limit JSON body size to 1 MB to avoid accidentally accepting huge payloads
// before a proper size/validation strategy is in place.
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Request logger
// Simple, safe format: method, URL, timestamp — no request body or headers
// that might contain sensitive values.
// ---------------------------------------------------------------------------
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}]  ${req.method}  ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// API routes
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
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Unknown /api route → 404 (must NOT fall through to the React app)
// This handler must be registered AFTER all real API routes and BEFORE the
// generic error handler.
// ---------------------------------------------------------------------------
app.use('/api', (_req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: 'The requested API endpoint does not exist.',
  });
});

// ---------------------------------------------------------------------------
// Centralized error handler
// Express identifies a 4-argument middleware as an error handler.
// Catches any error passed via next(err) from route handlers.
// Never exposes stack traces to clients in non-development environments.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';

  if (env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  res.status(status).json({
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message,
    // Stack trace only in development — never in production
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
