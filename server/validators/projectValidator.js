/**
 * DEVVERSE — Project Request Validators
 *
 * Validates request payload against schema constraints before reaching controllers.
 * Produces consistent HTTP 422 VALIDATION_ERROR responses with field-level details.
 */

import AppError from '../utils/AppError.js';
import { PROJECT_CATEGORIES, PROJECT_DIFFICULTIES } from '../models/Project.js';

const URL_REGEX = /^https?:\/\/.+/i;

/**
 * Validates POST /api/projects payload for project creation.
 */
export function validateCreateProject(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  // Title
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push({ field: 'title', message: 'Project title is required.' });
  } else if (body.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Project title must be at least 3 characters.' });
  } else if (body.title.trim().length > 120) {
    errors.push({ field: 'title', message: 'Project title cannot exceed 120 characters.' });
  }

  // Description
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    errors.push({ field: 'description', message: 'Project description is required.' });
  } else if (body.description.trim().length < 20) {
    errors.push({ field: 'description', message: 'Project description must be at least 20 characters.' });
  } else if (body.description.trim().length > 2000) {
    errors.push({ field: 'description', message: 'Project description cannot exceed 2000 characters.' });
  }

  // Category
  if (!body.category || typeof body.category !== 'string') {
    errors.push({ field: 'category', message: 'Project category is required.' });
  } else if (!PROJECT_CATEGORIES.includes(body.category.trim())) {
    errors.push({
      field: 'category',
      message: `Invalid category. Must be one of: ${PROJECT_CATEGORIES.join(', ')}.`,
    });
  }

  // Difficulty (optional, defaults to Intermediate)
  if (body.difficulty && !PROJECT_DIFFICULTIES.includes(body.difficulty)) {
    errors.push({
      field: 'difficulty',
      message: `Invalid difficulty. Must be one of: ${PROJECT_DIFFICULTIES.join(', ')}.`,
    });
  }

  // Technologies / Tags
  if (body.technologies && !Array.isArray(body.technologies)) {
    errors.push({ field: 'technologies', message: 'Technologies must be an array of strings.' });
  }

  // Features
  if (body.features && !Array.isArray(body.features)) {
    errors.push({ field: 'features', message: 'Features must be an array of strings.' });
  }

  // GitHub URL
  if (body.githubUrl && (typeof body.githubUrl !== 'string' || !URL_REGEX.test(body.githubUrl.trim()))) {
    errors.push({ field: 'githubUrl', message: 'GitHub repository URL must start with http:// or https://' });
  }

  // Demo URL
  if (body.demoUrl && (typeof body.demoUrl !== 'string' || !URL_REGEX.test(body.demoUrl.trim()))) {
    errors.push({ field: 'demoUrl', message: 'Demo URL must start with http:// or https://' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}

/**
 * Validates PATCH /api/projects/:id payload for project update.
 */
export function validateUpdateProject(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    return next(new AppError('At least one field must be provided for update.', 400, 'BAD_REQUEST'));
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.push({ field: 'title', message: 'Project title cannot be empty.' });
    } else if (body.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Project title must be at least 3 characters.' });
    } else if (body.title.trim().length > 120) {
      errors.push({ field: 'title', message: 'Project title cannot exceed 120 characters.' });
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      errors.push({ field: 'description', message: 'Project description cannot be empty.' });
    } else if (body.description.trim().length < 20) {
      errors.push({ field: 'description', message: 'Project description must be at least 20 characters.' });
    } else if (body.description.trim().length > 2000) {
      errors.push({ field: 'description', message: 'Project description cannot exceed 2000 characters.' });
    }
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !PROJECT_CATEGORIES.includes(body.category.trim())) {
      errors.push({
        field: 'category',
        message: `Invalid category. Must be one of: ${PROJECT_CATEGORIES.join(', ')}.`,
      });
    }
  }

  if (body.difficulty !== undefined) {
    if (typeof body.difficulty !== 'string' || !PROJECT_DIFFICULTIES.includes(body.difficulty)) {
      errors.push({
        field: 'difficulty',
        message: `Invalid difficulty. Must be one of: ${PROJECT_DIFFICULTIES.join(', ')}.`,
      });
    }
  }

  if (body.technologies !== undefined && !Array.isArray(body.technologies)) {
    errors.push({ field: 'technologies', message: 'Technologies must be an array of strings.' });
  }

  if (body.features !== undefined && !Array.isArray(body.features)) {
    errors.push({ field: 'features', message: 'Features must be an array of strings.' });
  }

  if (body.githubUrl) {
    if (typeof body.githubUrl !== 'string' || !URL_REGEX.test(body.githubUrl.trim())) {
      errors.push({ field: 'githubUrl', message: 'GitHub repository URL must start with http:// or https://' });
    }
  }

  if (body.demoUrl) {
    if (typeof body.demoUrl !== 'string' || !URL_REGEX.test(body.demoUrl.trim())) {
      errors.push({ field: 'demoUrl', message: 'Demo URL must start with http:// or https://' });
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
  }

  next();
}
