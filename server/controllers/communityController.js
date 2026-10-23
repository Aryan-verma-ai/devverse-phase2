/**
 * DEVVERSE — Community Controller
 *
 * Thin controller layer mapping HTTP requests to communityService methods:
 *   - GET    /api/communities
 *   - GET    /api/communities/user-memberships
 *   - GET    /api/communities/:id
 *   - POST   /api/communities/:id/join
 *   - DELETE /api/communities/:id/leave
 */

import communityService from '../services/communityService.js';

export const communityController = {
  /**
   * Retrieves all communities with membership status if authenticated.
   */
  async list(req, res, next) {
    try {
      const communities = await communityService.listCommunities(req.user?._id);
      res.status(200).json({
        status: 'ok',
        data: communities,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves single community details by ID or slug with membership status.
   */
  async getById(req, res, next) {
    try {
      const community = await communityService.getCommunityByIdOrSlug(
        req.params.id,
        req.user?._id
      );
      res.status(200).json({
        status: 'ok',
        data: community,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Joins a community (protected by requireAuth).
   */
  async join(req, res, next) {
    try {
      const result = await communityService.joinCommunity(req.user._id, req.params.id);
      res.status(200).json({
        status: 'ok',
        message: 'Successfully joined community.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Leaves a community (protected by requireAuth).
   */
  async leave(req, res, next) {
    try {
      const result = await communityService.leaveCommunity(req.user._id, req.params.id);
      res.status(200).json({
        status: 'ok',
        message: 'Successfully left community.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves current user's joined communities (protected by requireAuth).
   */
  async getUserMemberships(req, res, next) {
    try {
      const result = await communityService.getUserMemberships(req.user._id);
      res.status(200).json({
        status: 'ok',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default communityController;
