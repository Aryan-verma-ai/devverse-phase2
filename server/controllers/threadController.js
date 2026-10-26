/**
 * DEVVERSE — Thread Controller
 *
 * Thin HTTP layer mapping requests to threadService methods.
 *
 * Endpoints (mounted at /api/communities/:communityId/threads):
 *   GET    /                     listThreads
 *   POST   /                     createThread
 *   GET    /:threadId            getThread
 *   GET    /:threadId/replies    listReplies
 *   POST   /:threadId/replies    createReply
 */

import threadService from '../services/threadService.js';

export const threadController = {
  /**
   * GET /api/communities/:communityId/threads
   */
  async listThreads(req, res, next) {
    try {
      const threads = await threadService.listThreads(req.params.communityId);
      res.status(200).json({ status: 'ok', data: threads });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/communities/:communityId/threads
   */
  async createThread(req, res, next) {
    try {
      const thread = await threadService.createThread(
        req.user._id,
        req.params.communityId,
        { title: req.body.title, body: req.body.body }
      );
      res.status(201).json({
        status: 'ok',
        message: 'Thread created successfully.',
        data: thread,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/communities/:communityId/threads/:threadId
   */
  async getThread(req, res, next) {
    try {
      const thread = await threadService.getThreadById(
        req.params.communityId,
        req.params.threadId
      );
      res.status(200).json({ status: 'ok', data: thread });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/communities/:communityId/threads/:threadId/replies
   */
  async listReplies(req, res, next) {
    try {
      const replies = await threadService.listReplies(
        req.params.communityId,
        req.params.threadId
      );
      res.status(200).json({ status: 'ok', data: replies });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/communities/:communityId/threads/:threadId/replies
   */
  async createReply(req, res, next) {
    try {
      const reply = await threadService.createReply(
        req.user._id,
        req.params.communityId,
        req.params.threadId,
        { body: req.body.body }
      );
      res.status(201).json({
        status: 'ok',
        message: 'Reply posted successfully.',
        data: reply,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default threadController;
