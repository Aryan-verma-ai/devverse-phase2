/**
 * DEVVERSE — Temporary Development Authentication Guard
 *
 * ─── PURPOSE ────────────────────────────────────────────────────────────────
 * Prompt 19 requires write endpoints (POST, PATCH, DELETE) to be protected
 * without exposing unauthenticated writes in production, while full
 * session-based authentication is scheduled for Prompt 21 (Phase E).
 *
 * ─── BEHAVIOR ───────────────────────────────────────────────────────────────
 * 1. Production Mode (`NODE_ENV === 'production'`):
 *    - Strictly checks for an authenticated user on `req.user`.
 *    - Rejects with HTTP 401 UNAUTHORIZED if not present.
 *    - Prevents unauthenticated production writes.
 *
 * 2. Development / Test Mode:
 *    - If `req.user` is already set (e.g. by a test setup), accepts it.
 *    - If `x-dev-user-id` header is sent with a valid ObjectId, uses it.
 *    - Otherwise, automatically finds or creates a deterministic development
 *      author in MongoDB (`username: 'dev_author'`) and attaches it to `req.user`.
 *
 * ─── REPLACEMENT IN PROMPT 21 ───────────────────────────────────────────────
 * When auth routes and session middleware are implemented in Prompt 21,
 * this guard will be replaced with the standard `requireAuth` session middleware.
 */

import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import env from '../config/env.js';
import User from '../models/User.js';

let cachedDevUserId = null;

export default async function devAuthGuard(req, _res, next) {
  // ── 1. Production check ────────────────────────────────────────────────────
  const isProd = (process.env.NODE_ENV === 'production') || (env.NODE_ENV === 'production');
  if (isProd) {
    if (!req.user || !req.user._id) {
      return next(
        new AppError(
          'Authentication required: Production write endpoints are restricted.',
          401,
          'UNAUTHORIZED'
        )
      );
    }
    return next();
  }

  // ── 2. Already authenticated (e.g. injected by test) ───────────────────────
  if (req.user && req.user._id) {
    return next();
  }

  // ── 3. Header override for testing ownership scenarios ─────────────────────
  const customDevId = req.headers['x-dev-user-id'];
  if (customDevId) {
    if (!mongoose.isValidObjectId(customDevId)) {
      return next(new AppError('Invalid x-dev-user-id header format.', 400, 'INVALID_ID'));
    }
    req.user = {
      _id: new mongoose.Types.ObjectId(customDevId),
      username: req.headers['x-dev-username'] || 'custom-dev-user',
    };
    return next();
  }

  // ── 4. Fallback dev author (DB-persisted if connected, or static ObjectId) ─
  try {
    if (mongoose.connection.readyState === 1) {
      if (!cachedDevUserId) {
        let devUser = await User.findOne({ username: 'dev_author' });
        if (!devUser) {
          devUser = await User.create({
            username: 'dev_author',
            email: 'dev_author@devverse.local',
            passwordHash: '$2b$10$devStubPasswordHashForLocalDevelopmentOnly1234',
            displayName: 'DevVerse Local Author',
            bio: 'Default author created for local development and testing.',
          });
        }
        cachedDevUserId = devUser._id;
      }
      req.user = { _id: cachedDevUserId, username: 'dev_author' };
    } else {
      // In-memory fallback if database is not connected
      req.user = {
        _id: new mongoose.Types.ObjectId('000000000000000000000001'),
        username: 'dev_author',
      };
    }
    next();
  } catch (err) {
    next(err);
  }
}
