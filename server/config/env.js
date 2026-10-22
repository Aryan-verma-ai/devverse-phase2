/**
 * DEVVERSE — Environment Configuration
 *
 * Reads and validates required environment variables at startup.
 * If a required variable is missing, the process exits immediately with a
 * clear message rather than failing silently later inside a request handler.
 *
 * Variables are read once at module load time and exported as a frozen object
 * so the rest of the application can import a single source of truth.
 *
 * Usage:
 *   import env from './config/env.js';
 *   console.log(env.PORT);
 */

import 'dotenv/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read a required string environment variable.
 * Exits the process with a descriptive error if it is missing.
 *
 * @param {string} name  Variable name (e.g. 'MONGODB_URI')
 * @returns {string}
 */
function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    console.error(
      `\n[DevVerse] ✗ Missing required environment variable: ${name}\n` +
      `  Copy .env.example to .env and fill in the value before starting.\n`
    );
    process.exit(1);
  }
  return value.trim();
}

/**
 * Read an optional string environment variable with a default.
 *
 * @param {string} name
 * @param {string} defaultValue
 * @returns {string}
 */
function optional(name, defaultValue) {
  const value = process.env[name];
  return (value && value.trim()) ? value.trim() : defaultValue;
}

// ---------------------------------------------------------------------------
// Configuration object
// ---------------------------------------------------------------------------

/**
 * Validated, typed environment configuration.
 * Add new variables here as they are introduced in later prompts.
 *
 * Required (must be set in .env for the server to start):
 *   (none yet — MONGODB_URI and SESSION_SECRET are added in Prompt 17/21)
 *
 * Optional with defaults (suitable for local development):
 *   PORT          — TCP port the Express server listens on (default: 5000)
 *   NODE_ENV      — Runtime mode: 'development' | 'test' | 'production'
 *   CLIENT_ORIGIN — Allowed CORS origin for the React dev server
 */
const env = Object.freeze({
  PORT: parseInt(optional('PORT', '5000'), 10),
  NODE_ENV: optional('NODE_ENV', 'development'),
  CLIENT_ORIGIN: optional('CLIENT_ORIGIN', 'http://localhost:5173'),

  // Placeholders for variables that will be required in later prompts.
  // Listed here for discoverability; kept optional now so Prompt 15 works
  // without a MongoDB or session secret configured.
  MONGODB_URI: optional('MONGODB_URI', ''),
  SESSION_SECRET: optional('SESSION_SECRET', ''),
});

export default env;
