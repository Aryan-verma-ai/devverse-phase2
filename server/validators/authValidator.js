/**
 * DEVVERSE — Authentication Request Validators
 *
 * Validates signup and login request bodies, enforcing normalized formats
 * and password complexity rules before hitting database queries.
 */

import AppError from '../utils/AppError.js';

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates POST /api/auth/signup payload.
 */
export function validateSignup(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  // Username
  if (!body.username || typeof body.username !== 'string' || !body.username.trim()) {
    errors.push({ field: 'username', message: 'Username is required.' });
  } else {
    const trimmed = body.username.trim().toLowerCase();
    if (trimmed.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters long.' });
    } else if (trimmed.length > 30) {
      errors.push({ field: 'username', message: 'Username cannot exceed 30 characters.' });
    } else if (!USERNAME_REGEX.test(trimmed)) {
      errors.push({
        field: 'username',
        message: 'Username may only contain lowercase letters, numbers, underscores, and hyphens.',
      });
    }
  }

  // Email
  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else {
    const trimmed = body.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address.' });
    }
  }

  // Display Name
  if (!body.displayName || typeof body.displayName !== 'string' || !body.displayName.trim()) {
    errors.push({ field: 'displayName', message: 'Display name is required.' });
  } else if (body.displayName.trim().length > 60) {
    errors.push({ field: 'displayName', message: 'Display name cannot exceed 60 characters.' });
  }

  // Password
  if (!body.password || typeof body.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required.' });
  } else {
    const pw = body.password;
    if (pw.length < 7) {
      errors.push({ field: 'password', message: 'Password must be at least 7 characters long.' });
    } else {
      const hasUpper = /[A-Z]/.test(pw);
      const hasNumber = /[0-9]/.test(pw);
      const hasSpecial = /[^A-Za-z0-9]/.test(pw);

      if (!hasUpper || !hasNumber || !hasSpecial) {
        errors.push({
          field: 'password',
          message: 'Password must contain at least one uppercase letter, one number, and one special character.',
        });
      }
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}

/**
 * Validates POST /api/auth/login payload.
 */
export function validateLogin(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  const identifier = body.emailOrUsername || body.email || body.username;
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    errors.push({
      field: 'emailOrUsername',
      message: 'Email address or username is required to sign in.',
    });
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}
