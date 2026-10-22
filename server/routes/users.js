/**
 * DEVVERSE — User Profile Routes
 *
 * Mount path: /api/users
 *
 * Endpoints:
 *   GET   /api/users/:username - Public profile & projects (safe serialization, no email/password)
 *   PATCH /api/users/me        - Update own profile (requireAuth + allowlisting)
 *   PATCH /api/users/:id       - Update profile by ID (requireAuth + ownership check)
 */

import { Router } from 'express';
import userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUpdateProfile } from '../validators/userValidator.js';

const router = Router();

// Protected profile updates (must declare /me before /:id)
router.patch('/me', requireAuth, validateUpdateProfile, userController.updateMe);
router.patch('/:id', requireAuth, validateUpdateProfile, userController.updateById);

// Public profile retrieval
router.get('/:username', userController.getPublicProfile);

export default router;
