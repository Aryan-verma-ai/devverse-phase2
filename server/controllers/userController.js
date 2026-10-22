/**
 * DEVVERSE — User Profile Controller
 *
 * Dispatches public profile retrieval and authenticated profile update requests.
 */

import userService from '../services/userService.js';

export const userController = {
  /**
   * GET /api/users/:username
   * Public profile retrieval (excludes email and passwordHash).
   */
  async getPublicProfile(req, res, next) {
    try {
      const data = await userService.getPublicProfile(req.params.username);
      res.status(200).json({
        status: 'ok',
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/users/me
   * Authenticated user updates their own profile.
   */
  async updateMe(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user._id, req.user, req.body);
      res.status(200).json({
        status: 'ok',
        message: 'Profile updated successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/users/:id
   * Authenticated update with target user ID check (rejects cross-user updates with 403).
   */
  async updateById(req, res, next) {
    try {
      const user = await userService.updateProfile(req.params.id, req.user, req.body);
      res.status(200).json({
        status: 'ok',
        message: 'Profile updated successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },
};

export default userController;
