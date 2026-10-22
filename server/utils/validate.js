/**
 * DEVVERSE — Body Validation Helper
 *
 * Provides a lightweight middleware factory for validating JSON request bodies
 * using a plain JavaScript schema object. No external validation library is
 * used, keeping the dependency list minimal.
 *
 * This is intentionally simple: it validates presence, type, min/max length,
 * and a custom pattern for each field. For more complex validation rules
 * (cross-field, async uniqueness checks) add them in the service layer.
 *
 * Usage:
 *
 *   import { validateBody } from '../utils/validate.js';
 *
 *   router.post(
 *     '/projects',
 *     validateBody({
 *       title:  { required: true, type: 'string', minLength: 3, maxLength: 120 },
 *       desc:   { required: true, type: 'string', minLength: 20, maxLength: 1000 },
 *       tags:   { required: false, type: 'array' },
 *       demoUrl:{ required: false, type: 'string', pattern: /^https?:\/\// },
 *     }),
 *     projectController.create
 *   );
 *
 * Schema field options:
 *   required   {boolean}  - Whether the field must be present and non-empty
 *   type       {string}   - JS typeof check: 'string' | 'number' | 'boolean' | 'array' | 'object'
 *   minLength  {number}   - Minimum string length (trimmed) or array length
 *   maxLength  {number}   - Maximum string length (trimmed) or array length
 *   pattern    {RegExp}   - Regex the string value must match
 *   label      {string}   - Human-readable field name in error messages (defaults to field key)
 *
 * On validation failure:
 *   next(AppError('Validation failed.', 422, 'VALIDATION_ERROR', [
 *     { field: 'title', message: '...' },
 *     ...
 *   ]))
 *
 * On success: calls next() and adds nothing to req.
 */

import AppError from './AppError.js';

/**
 * @typedef {Object} FieldSchema
 * @property {boolean} [required=false]
 * @property {'string'|'number'|'boolean'|'array'|'object'} [type]
 * @property {number}  [minLength]
 * @property {number}  [maxLength]
 * @property {RegExp}  [pattern]
 * @property {string}  [label]
 */

/**
 * Creates an Express middleware that validates req.body against the schema.
 *
 * @param {Object.<string, FieldSchema>} schema
 * @returns {import('express').RequestHandler}
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const errors = [];
    const body = req.body ?? {};

    for (const [field, rules] of Object.entries(schema)) {
      const label = rules.label || field;
      const raw = body[field];
      const isPresent = raw !== undefined && raw !== null && raw !== '';

      // Required check
      if (rules.required && !isPresent) {
        errors.push({ field, message: `${label} is required.` });
        continue; // Skip further checks for absent required fields
      }

      // Skip remaining checks if field is absent and not required
      if (!isPresent) continue;

      const value = raw;

      // Type check
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push({ field, message: `${label} must be a ${rules.type}.` });
          continue;
        }
      }

      // Length checks (string: trimmed length; array: array length)
      const len = Array.isArray(value)
        ? value.length
        : typeof value === 'string'
          ? value.trim().length
          : null;

      if (len !== null) {
        if (rules.minLength !== undefined && len < rules.minLength) {
          errors.push({
            field,
            message: `${label} must be at least ${rules.minLength} character${rules.minLength !== 1 ? 's' : ''}.`,
          });
        }
        if (rules.maxLength !== undefined && len > rules.maxLength) {
          errors.push({
            field,
            message: `${label} must be no more than ${rules.maxLength} character${rules.maxLength !== 1 ? 's' : ''}.`,
          });
        }
      }

      // Pattern check (strings only)
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({ field, message: `${label} has an invalid format.` });
      }
    }

    if (errors.length > 0) {
      return next(new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors));
    }

    next();
  };
}
