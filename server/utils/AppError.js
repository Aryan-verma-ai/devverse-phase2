/**
 * DEVVERSE — AppError
 *
 * A lightweight error subclass that carries HTTP status, a machine-readable
 * error code, and optional field-level validation details.
 *
 * Using a named subclass (rather than attaching properties to a plain Error)
 * means route handlers and controllers can throw a single class that the
 * centralized error handler understands, while unexpected Error instances
 * still produce a safe 500 response.
 *
 * Usage examples:
 *
 *   // Route handler — known error condition
 *   throw new AppError('Title is required.', 400, 'VALIDATION_ERROR');
 *
 *   // With field-level details for form UIs
 *   throw new AppError('Validation failed.', 422, 'VALIDATION_ERROR', [
 *     { field: 'title', message: 'Title must be at least 3 characters.' },
 *     { field: 'tags',  message: 'At least one tag is required.' },
 *   ]);
 *
 *   // Authorization failure
 *   throw new AppError('You must be logged in.', 401, 'UNAUTHORIZED');
 *
 *   // Resource not found
 *   throw new AppError('Project not found.', 404, 'NOT_FOUND');
 */

export default class AppError extends Error {
  /**
   * @param {string} message   - Human-readable error description (safe for clients)
   * @param {number} [status=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Machine-readable code (SCREAMING_SNAKE)
   * @param {Array}  [details=[]] - Optional field-level validation details
   *                                Each entry: { field: string, message: string }
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintains proper prototype chain in ES2015+
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
