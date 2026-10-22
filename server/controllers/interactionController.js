/**
 * DEVVERSE — Interaction Controller
 *
 * Thin controller layer mapping HTTP requests to interactionService methods:
 *   - POST   /api/projects/:id/like
 *   - DELETE /api/projects/:id/like
 *   - POST   /api/projects/:id/bookmark
 *   - DELETE /api/projects/:id/bookmark
 *   - GET    /api/projects/user-interactions
 */

import interactionService from '../services/interactionService.js';

export const interactionController = {
  /**
   * Adds a like to the project for the authenticated user.
   */
  async like(req, res, next) {
    try {
      const result = await interactionService.likeProject(req.user._id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Removes a like from the project for the authenticated user.
   */
  async unlike(req, res, next) {
    try {
      const result = await interactionService.unlikeProject(req.user._id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Adds a bookmark to the project for the authenticated user.
   */
  async bookmark(req, res, next) {
    try {
      const result = await interactionService.bookmarkProject(req.user._id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Removes a bookmark from the project for the authenticated user.
   */
  async unbookmark(req, res, next) {
    try {
      const result = await interactionService.unbookmarkProject(req.user._id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves all liked and bookmarked project IDs for the authenticated user.
   */
  async getUserInteractions(req, res, next) {
    try {
      const result = await interactionService.getUserInteractions(req.user._id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default interactionController;
