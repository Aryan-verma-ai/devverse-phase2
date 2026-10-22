/**
 * DEVVERSE — Project Controller
 *
 * Thin controller layer: delegates domain logic to projectService and formats
 * standard JSON success responses.
 */

import projectService from '../services/projectService.js';

export const projectController = {
  /**
   * GET /api/projects
   */
  async list(req, res, next) {
    try {
      const result = await projectService.listProjects(req.query);
      res.status(200).json({
        status: 'ok',
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/projects/:id
   */
  async getById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user?._id);
      res.status(200).json({
        status: 'ok',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/projects
   */
  async create(req, res, next) {
    try {
      const project = await projectService.createProject(req.body, req.user._id);
      res.status(201).json({
        status: 'ok',
        message: 'Project created successfully.',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/projects/:id
   */
  async update(req, res, next) {
    try {
      const project = await projectService.updateProject(
        req.params.id,
        req.body,
        req.user._id
      );
      res.status(200).json({
        status: 'ok',
        message: 'Project updated successfully.',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/projects/:id
   */
  async remove(req, res, next) {
    try {
      const result = await projectService.deleteProject(req.params.id, req.user._id);
      res.status(200).json({
        status: 'ok',
        message: 'Project deleted successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default projectController;
