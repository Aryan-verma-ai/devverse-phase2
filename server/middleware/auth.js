/**
 * DEVVERSE — Authentication Middleware
 *
 * Provides:
 *   - `authenticateUser`: Inspects incoming session cookies or Bearer tokens,
 *     verifies signature, and populates `req.user`. Non-blocking (routes can still proceed as guests).
 *   - `requireAuth`: Strict guard requiring `req.user` to be populated. Rejects unauthenticated
 *     requests with HTTP 401 UNAUTHORIZED.
 */

import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { verifySessionToken, COOKIE_NAME } from '../utils/session.js';
import env from '../config/env.js';

/**
 * Extracts and verifies session credentials from cookies or headers.
 * Populates `req.user` if valid; leaves `req.user = null` otherwise.
 */
export function authenticateUser(req, _res, next) {
  req.user = null;

  // 1. Check HttpOnly cookie
  let token = req.cookies?.[COOKIE_NAME];

  // 2. Fallback: Authorization header (Bearer token)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  // 3. Verify token if present
  if (token) {
    const payload = verifySessionToken(token);
    if (payload && payload.userId) {
      req.user = {
        _id: new mongoose.Types.ObjectId(payload.userId),
        username: payload.username,
        role: payload.role || 'user',
      };
      return next();
    }
  }

  // 4. Test / Development header fallback (for automated integration tests)
  const isDev = (process.env.NODE_ENV !== 'production') && (env.NODE_ENV !== 'production');
  if (isDev && req.headers['x-dev-user-id']) {
    const customDevId = req.headers['x-dev-user-id'];
    if (mongoose.isValidObjectId(customDevId)) {
      req.user = {
        _id: new mongoose.Types.ObjectId(customDevId),
        username: req.headers['x-dev-username'] || 'custom-dev-user',
        role: 'user',
      };
    }
  }

  next();
}

/**
 * Route protection guard. Ensures `req.user` exists, else throws 401 UNAUTHORIZED.
 */
export function requireAuth(req, _res, next) {
  if (!req.user || !req.user._id) {
    return next(
      new AppError(
        'Authentication required. Please sign in to continue.',
        401,
        'UNAUTHORIZED'
      )
    );
  }
  next();
}
