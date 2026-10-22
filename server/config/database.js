/**
 * DEVVERSE — MongoDB Connection & Lifecycle Management
 *
 * Responsibilities:
 *   1. Connect to MongoDB using the URI configured in `server/config/env.js`.
 *   2. Mask any user credentials when logging connection strings.
 *   3. Listen to connection events ('connected', 'error', 'disconnected').
 *   4. Provide readiness status for health check probes.
 *   5. Support clean teardown during graceful process termination.
 */

import mongoose from 'mongoose';
import env from './env.js';

/**
 * Safely masks passwords in database connection URIs for console logging.
 * Example: mongodb+srv://<user>:<password>@cluster.net/devverse
 *       -> mongodb+srv://<user>:****@cluster.net/devverse
 *
 * @param {string} uri
 * @returns {string}
 */
export function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
}

/**
 * Returns human-readable state corresponding to mongoose.connection.readyState.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 *
 * @returns {'connected' | 'connecting' | 'disconnecting' | 'disconnected'}
 */
export function getDatabaseStatus() {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
}

/**
 * Checks if the database connection is currently ready to accept queries.
 *
 * @returns {boolean}
 */
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Connect to MongoDB using the environment-provided URI.
 *
 * Startup Policy:
 *   - In production or when MONGODB_URI is provided: attempts connection.
 *   - If MONGODB_URI is missing and in production: logs a fatal error and throws.
 *   - If MONGODB_URI is missing in development: logs a clear warning without crashing,
 *     allowing client UI development and non-DB testing to proceed until DB is configured.
 *
 * @param {string} [overrideUri] - Optional URI override (useful for tests)
 * @returns {Promise<typeof mongoose | null>}
 */
export async function connectDatabase(overrideUri) {
  const uri = overrideUri || env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    const isProd = (process.env.NODE_ENV === 'production') || (env.NODE_ENV === 'production');
    if (isProd) {
      console.error('[DevVerse DB] ✗ MONGODB_URI is required in production environment.');
      throw new Error('MONGODB_URI is required in production.');
    }
    console.warn('[DevVerse DB] ⚠ MONGODB_URI is not configured in .env. MongoDB connection skipped.');
    return null;
  }

  const safeUri = sanitizeMongoUri(uri);
  console.log(`[DevVerse DB] Connecting to MongoDB: ${safeUri} ...`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DevVerse DB] ✓ Connected to database: ${conn.connection.name || 'default'}`);
    return conn;
  } catch (err) {
    console.error(`[DevVerse DB] ✗ Failed to connect to MongoDB (${safeUri}): ${err.message}`);
    throw err;
  }
}

/**
 * Gracefully close the MongoDB connection.
 * Used during SIGINT / SIGTERM shutdown.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    console.log('[DevVerse DB] Closing database connection...');
    await mongoose.disconnect();
    console.log('[DevVerse DB] ✓ Database connection closed.');
  }
}

// Attach event listeners for unexpected runtime connection disruptions
mongoose.connection.on('error', (err) => {
  console.error('[DevVerse DB] Runtime connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DevVerse DB] Database connection lost.');
});
