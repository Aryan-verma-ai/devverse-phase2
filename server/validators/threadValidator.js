/**
 * DEVVERSE — Thread & Reply Request Validators
 *
 * Validates request payloads before reaching controllers.
 * Produces consistent HTTP 422 VALIDATION_ERROR responses with field-level details.
 *
 * Thread title:  5–140 chars (required)
 * Thread body:   10–5000 chars (required)
 * Reply body:    1–2000 chars (required)
 */

import AppError from '../utils/AppError.js';

/**
 * Validates POST /api/communities/:communityId/threads payload.
 */
export function validateCreateThread(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  // Title
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push({ field: 'title', message: 'Thread title is required.' });
  } else if (body.title.trim().length < 5) {
    errors.push({ field: 'title', message: 'Thread title must be at least 5 characters.' });
  } else if (body.title.trim().length > 140) {
    errors.push({ field: 'title', message: 'Thread title cannot exceed 140 characters.' });
  }

  // Body
  if (!body.body || typeof body.body !== 'string' || !body.body.trim()) {
    errors.push({ field: 'body', message: 'Thread body is required.' });
  } else if (body.body.trim().length < 10) {
    errors.push({ field: 'body', message: 'Thread body must be at least 10 characters.' });
  } else if (body.body.trim().length > 5000) {
    errors.push({ field: 'body', message: 'Thread body cannot exceed 5000 characters.' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}

/**
 * Validates POST /api/communities/:communityId/threads/:threadId/replies payload.
 */
export function validateCreateReply(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  // Body
  if (!body.body || typeof body.body !== 'string' || !body.body.trim()) {
    errors.push({ field: 'body', message: 'Reply body is required.' });
  } else if (body.body.trim().length > 2000) {
    errors.push({ field: 'body', message: 'Reply body cannot exceed 2000 characters.' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}
