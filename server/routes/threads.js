/**
 * DEVVERSE — Thread Routes
 *
 * Mount path: /api/communities/:communityId/threads
 *
 * IMPORTANT: Router must use { mergeParams: true } so `:communityId` from
 * the parent route in app.js is accessible as req.params.communityId here.
 *
 * Endpoints:
 *   GET    /                   - List all threads for a community (public)
 *   POST   /                   - Create a thread (requireAuth)
 *   GET    /:threadId          - Get thread detail (public)
 *   GET    /:threadId/replies  - List replies for a thread (public)
 *   POST   /:threadId/replies  - Post a reply (requireAuth)
 */

import { Router } from 'express';
import threadController from '../controllers/threadController.js';
import { requireAuth } from '../middleware/auth.js';
import {
  validateCreateThread,
  validateCreateReply,
} from '../validators/threadValidator.js';

// mergeParams: true is required to inherit :communityId from the parent router
const router = Router({ mergeParams: true });

// Thread list and creation
router.get('/', threadController.listThreads);
router.post('/', requireAuth, validateCreateThread, threadController.createThread);

// Thread detail (must come before /:threadId/replies to avoid conflicts)
router.get('/:threadId', threadController.getThread);

// Reply list and creation (specific sub-paths before generic /:threadId catch)
router.get('/:threadId/replies', threadController.listReplies);
router.post('/:threadId/replies', requireAuth, validateCreateReply, threadController.createReply);

export default router;
