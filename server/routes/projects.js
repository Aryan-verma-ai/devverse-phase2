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
import devAuthGuard from '../middleware/devAuthGuard.js';
import {
  validateCreateProject,
  validateUpdateProject,
} from '../validators/projectValidator.js';

const router = Router();

// Public read endpoints
router.get('/', projectController.list);
router.get('/:id', projectController.getById);

// Protected write endpoints (guarded by devAuthGuard until full auth is wired in Prompt 21)
router.post('/', devAuthGuard, validateCreateProject, projectController.create);
router.patch('/:id', devAuthGuard, validateUpdateProject, projectController.update);
router.delete('/:id', devAuthGuard, projectController.remove);

export default router;
