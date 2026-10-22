/**
 * DEVVERSE — Project Routes
 *
 * Mount path: /api/projects
 *
 * Endpoints:
 *   GET    /api/projects       - List/search projects with bounded pagination
 *   GET    /api/projects/:id   - Get single project details
 *   POST   /api/projects       - Create project (devAuthGuard + validation)
 *   PATCH  /api/projects/:id   - Update project (devAuthGuard + validation)
 *   DELETE /api/projects/:id   - Delete project (devAuthGuard + ownership)
 */

import { Router } from 'express';
import projectController from '../controllers/projectController.js';
import interactionController from '../controllers/interactionController.js';
import { requireAuth } from '../middleware/auth.js';
import {
  validateCreateProject,
  validateUpdateProject,
} from '../validators/projectValidator.js';

const router = Router();

// Current user's interaction state (must precede /:id)
router.get('/user-interactions', requireAuth, interactionController.getUserInteractions);

// Public read endpoints
router.get('/', projectController.list);
router.get('/:id', projectController.getById);

// Protected write endpoints (enforce authentication on server as security boundary)
router.post('/', requireAuth, validateCreateProject, projectController.create);
router.patch('/:id', requireAuth, validateUpdateProject, projectController.update);
router.delete('/:id', requireAuth, projectController.remove);

// Project likes and bookmarks (requireAuth)
router.post('/:id/like', requireAuth, interactionController.like);
router.delete('/:id/like', requireAuth, interactionController.unlike);
router.post('/:id/bookmark', requireAuth, interactionController.bookmark);
router.delete('/:id/bookmark', requireAuth, interactionController.unbookmark);

export default router;
