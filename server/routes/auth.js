/**
 * DEVVERSE — Authentication Routes
 *
 * Mount path: /api/auth
 *
 * Endpoints:
 *   POST /api/auth/signup  - Rate-limited registration (creates user, sets session cookie)
 *   POST /api/auth/login   - Rate-limited sign-in (verifies credentials, sets session cookie)
 *   POST /api/auth/logout  - Clears session cookie
 *   GET  /api/auth/me      - Returns current authenticated user profile
 */

import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';
import { validateSignup, validateLogin } from '../validators/authValidator.js';

const router = Router();

// Rate-limited credential endpoints
router.post('/signup', authRateLimiter, validateSignup, authController.signup);
router.post('/login', authRateLimiter, validateLogin, authController.login);

// Session management endpoints
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
