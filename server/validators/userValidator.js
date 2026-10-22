/**
 * DEVVERSE — User Request Validators
 *
 * Validates user profile updates with strict field allowlisting.
 * Only grounded fields from the inventory are allowed:
 *   - displayName: string, 1-60 chars
 *   - bio: string, max 500 chars
 *   - avatarUrl: string, valid URL or empty
 *   - skills: array of strings, max 20 items, max 30 chars each
 *   - links: object { github, linkedin, twitter, website }
 *
 * Strictly disallowed & rejected/stripped fields:
 *   - email, passwordHash, role, points, _id, username
 */

import AppError from '../utils/AppError.js';

const URL_REGEX = /^https?:\/\/.+/i;

export function validateUpdateProfile(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  // Check for empty body
  if (Object.keys(body).length === 0) {
    return next(new AppError('No update fields provided.', 400, 'BAD_REQUEST'));
  }

  // Reject attempts to alter immutable or sensitive identity/security fields
  const forbiddenAttempted = ['passwordHash', 'password', 'role', 'points', 'email', 'username', '_id'];
  for (const field of forbiddenAttempted) {
    if (body[field] !== undefined) {
      errors.push({
        field,
        message: `Field '${field}' cannot be updated through this endpoint.`,
      });
    }
  }

  // Display Name
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || !body.displayName.trim()) {
      errors.push({ field: 'displayName', message: 'Display name cannot be empty.' });
    } else if (body.displayName.trim().length > 60) {
      errors.push({ field: 'displayName', message: 'Display name cannot exceed 60 characters.' });
    }
  }

  // Bio
  if (body.bio !== undefined) {
    if (typeof body.bio !== 'string') {
      errors.push({ field: 'bio', message: 'Bio must be a string.' });
    } else if (body.bio.length > 500) {
      errors.push({ field: 'bio', message: 'Bio cannot exceed 500 characters.' });
    }
  }

  // Avatar URL
  if (body.avatarUrl !== undefined && body.avatarUrl !== '') {
    if (typeof body.avatarUrl !== 'string') {
      errors.push({ field: 'avatarUrl', message: 'Avatar URL must be a string.' });
    } else if (!URL_REGEX.test(body.avatarUrl.trim())) {
      errors.push({ field: 'avatarUrl', message: 'Avatar URL must use http or https protocol.' });
    }
  }

  // Skills
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills)) {
      errors.push({ field: 'skills', message: 'Skills must be an array of strings.' });
    } else {
      if (body.skills.length > 20) {
        errors.push({ field: 'skills', message: 'You can specify at most 20 skills.' });
      }
      for (let i = 0; i < body.skills.length; i++) {
        const skill = body.skills[i];
        if (typeof skill !== 'string' || !skill.trim()) {
          errors.push({ field: `skills[${i}]`, message: 'Skill item cannot be empty.' });
        } else if (skill.trim().length > 30) {
          errors.push({ field: `skills[${i}]`, message: 'Skill item cannot exceed 30 characters.' });
        }
      }
    }
  }

  // Links
  if (body.links !== undefined) {
    if (typeof body.links !== 'object' || body.links === null || Array.isArray(body.links)) {
      errors.push({ field: 'links', message: 'Links must be an object with social platform URLs.' });
    } else {
      const allowedPlatforms = ['github', 'linkedin', 'twitter', 'website'];
      for (const [platform, url] of Object.entries(body.links)) {
        if (!allowedPlatforms.includes(platform)) {
          errors.push({ field: `links.${platform}`, message: `Unsupported link platform '${platform}'.` });
        } else if (url && typeof url === 'string' && url.trim() !== '') {
          if (!URL_REGEX.test(url.trim())) {
            errors.push({ field: `links.${platform}`, message: `Invalid URL format for ${platform}.` });
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}
