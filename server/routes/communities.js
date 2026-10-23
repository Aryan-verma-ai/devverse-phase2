/**
 * DEVVERSE — Community Routes
 *
 * Mount path: /api/communities
 *
 * Endpoints:
 *   GET    /api/communities                  - List all communities
 *   GET    /api/communities/user-memberships - Get authenticated user's joined communities
 *   GET    /api/communities/:id              - Get community details by ObjectId or slug
 *   POST   /api/communities/:id/join         - Join community (requireAuth)
 *   DELETE /api/communities/:id/leave        - Leave community (requireAuth)
 */

import { Router } from 'express';
import communityController from '../controllers/communityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Current user's joined communities (must precede /:id)
router.get('/user-memberships', requireAuth, communityController.getUserMemberships);

// Public directory and detail endpoints
router.get('/', communityController.list);
router.get('/:id', communityController.getById);

// Protected membership actions
router.post('/:id/join', requireAuth, communityController.join);
router.delete('/:id/leave', requireAuth, communityController.leave);

export default router;
