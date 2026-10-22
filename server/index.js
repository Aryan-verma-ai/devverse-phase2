/**
 * DEVVERSE — Server Entry Point
 *
 * This file is responsible for:
 *   1. Importing validated environment configuration (which also loads .env)
 *   2. Starting the HTTP server on the configured port
 *   3. Graceful shutdown on SIGTERM and SIGINT signals
 *
 * Database connection will be added here in Prompt 17 (MongoDB setup).
 * This file intentionally does NOT contain middleware or route definitions —
 * those live in app.js and are imported from there.
 *
 * Run:
 *   node index.js           (production)
 *   nodemon index.js        (development — auto-restarts on file change)
 */

import env from './config/env.js';
import app from './app.js';

// ---------------------------------------------------------------------------
// Start HTTP server
// ---------------------------------------------------------------------------

const server = app.listen(env.PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║           DevVerse API Server              ║
  ╠════════════════════════════════════════════╣
  ║  Environment : ${env.NODE_ENV.padEnd(26)}║
  ║  Port        : ${String(env.PORT).padEnd(26)}║
  ║  Health      : http://localhost:${env.PORT}/api/health  ║
  ╚════════════════════════════════════════════╝
  `);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// On SIGTERM (e.g. from process manager) or SIGINT (Ctrl-C in terminal),
// stop accepting new connections and allow in-flight requests to finish
// before exiting. In Prompt 17, the database connection will also be closed
// here before the process exits.
// ---------------------------------------------------------------------------

function shutdown(signal) {
  console.log(`\n[DevVerse] Received ${signal}. Shutting down gracefully…`);
  server.close((err) => {
    if (err) {
      console.error('[DevVerse] Error during shutdown:', err.message);
      process.exit(1);
    }
    console.log('[DevVerse] HTTP server closed. Bye.');
    process.exit(0);
  });

  // Force-exit after 10 s if graceful close stalls
  setTimeout(() => {
    console.error('[DevVerse] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled promise rejections — log and exit so the process does not
// silently continue in a broken state.
process.on('unhandledRejection', (reason) => {
  console.error('[DevVerse] Unhandled rejection:', reason);
  process.exit(1);
});
