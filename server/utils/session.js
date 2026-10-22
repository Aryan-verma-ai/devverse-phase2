/**
 * DEVVERSE — Cryptographic Session Token & Cookie Utilities
 *
 * Implements tamper-proof HMAC-SHA256 signed session tokens without third-party JWT deps.
 * Format: <base64url_payload>.<hex_hmac_signature>
 */

import crypto from 'node:crypto';
import env from '../config/env.js';

const COOKIE_NAME = 'devverse_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Derives HMAC-SHA256 signature for a payload string using SESSION_SECRET.
 *
 * @param {string} data
 * @returns {string}
 */
function sign(data) {
  const secret = env.SESSION_SECRET;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Generates a signed session token containing user identity and expiry.
 *
 * @param {Object} user - User document or minimal user object
 * @returns {string} Signed token
 */
export function createSessionToken(user) {
  const now = Date.now();
  const payload = {
    userId: user._id ? user._id.toString() : String(user.id),
    username: user.username,
    role: user.role || 'user',
    iat: now,
    exp: now + SESSION_DURATION_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

/**
 * Validates a signed session token. Returns parsed payload if valid and unexpired;
 * returns null if missing, tampered, or expired.
 *
 * @param {string} token
 * @returns {Object|null}
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payloadBase64, providedSig] = token.split('.');
  if (!payloadBase64 || !providedSig) {
    return null;
  }

  // Verify HMAC signature safely
  try {
    const expectedSig = sign(payloadBase64);
    const providedBuf = Buffer.from(providedSig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  // Parse payload and check expiration
  try {
    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Attaches signed session cookie to an Express response.
 *
 * @param {import('express').Response} res
 * @param {Object} user
 */
export function setSessionCookie(res, user) {
  const token = createSessionToken(user);
  const isProduction = (process.env.NODE_ENV === 'production') || (env.NODE_ENV === 'production');

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });

  return token;
}

/**
 * Clears the session cookie on logout.
 *
 * @param {import('express').Response} res
 */
export function clearSessionCookie(res) {
  const isProduction = (process.env.NODE_ENV === 'production') || (env.NODE_ENV === 'production');

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

export { COOKIE_NAME };
