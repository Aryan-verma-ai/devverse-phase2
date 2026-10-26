/**
 * DEVVERSE — Thread Service
 *
 * Business logic for:
 *   - Listing threads for a community
 *   - Getting a single thread by ID
 *   - Creating a thread in a community
 *   - Listing replies for a thread
 *   - Creating a reply on a thread (with community parentage check)
 *
 * Author projection: 'username displayName avatarUrl' (never email or passwordHash)
 * Reply parentage:   reply.community must match thread.community (enforced here)
 */

import mongoose from 'mongoose';
import Thread from '../models/Thread.js';
import Reply from '../models/Reply.js';
import AppError from '../utils/AppError.js';
import communityService from './communityService.js';

/** Safe fields to populate for author — never exposes email or passwordHash */
const AUTHOR_PROJECTION = 'username displayName avatarUrl';

export const threadService = {
  /**
   * Lists all threads for a community, sorted newest first.
   *
   * @param {string} communityIdOrSlug
   * @returns {Promise<Object[]>}
   */
  async listThreads(communityIdOrSlug) {
    const community = await communityService.getCommunityByIdOrSlug(communityIdOrSlug);

    return Thread.find({ community: community._id })
      .sort({ createdAt: -1 })
      .populate('author', AUTHOR_PROJECTION)
      .lean();
  },

  /**
   * Gets a single thread by ID within a community.
   * Throws 404 if not found or if the thread does not belong to this community.
   *
   * @param {string} communityIdOrSlug
   * @param {string} threadId
   * @returns {Promise<Object>}
   */
  async getThreadById(communityIdOrSlug, threadId) {
    if (!mongoose.isValidObjectId(threadId)) {
      throw new AppError('Invalid thread ID format.', 400, 'INVALID_ID');
    }

    const community = await communityService.getCommunityByIdOrSlug(communityIdOrSlug);

    const thread = await Thread.findOne({ _id: threadId, community: community._id })
      .populate('author', AUTHOR_PROJECTION)
      .lean();

    if (!thread) {
      throw new AppError('Thread not found.', 404, 'NOT_FOUND');
    }

    return thread;
  },

  /**
   * Creates a new thread in a community.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} communityIdOrSlug
   * @param {{ title: string, body: string }} payload
   * @returns {Promise<Object>} Populated thread document
   */
  async createThread(userId, communityIdOrSlug, { title, body }) {
    const community = await communityService.getCommunityByIdOrSlug(communityIdOrSlug);

    const thread = await Thread.create({
      community: community._id,
      author: userId,
      title: title.trim(),
      body: body.trim(),
    });

    // Return populated author projection
    return Thread.findById(thread._id)
      .populate('author', AUTHOR_PROJECTION)
      .lean();
  },

  /**
   * Lists all replies for a thread, sorted oldest first (conversation order).
   * Verifies the thread belongs to the given community.
   *
   * @param {string} communityIdOrSlug
   * @param {string} threadId
   * @returns {Promise<Object[]>}
   */
  async listReplies(communityIdOrSlug, threadId) {
    // This also validates the thread belongs to the community
    await this.getThreadById(communityIdOrSlug, threadId);

    return Reply.find({ thread: threadId })
      .sort({ createdAt: 1 })
      .populate('author', AUTHOR_PROJECTION)
      .lean();
  },

  /**
   * Creates a reply on a thread.
   * Validates:
   *   1. Community exists
   *   2. Thread exists and belongs to that community
   *   3. reply.community is set from the thread's community (not user input)
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} communityIdOrSlug
   * @param {string} threadId
   * @param {{ body: string }} payload
   * @returns {Promise<Object>} Populated reply document
   */
  async createReply(userId, communityIdOrSlug, threadId, { body }) {
    if (!mongoose.isValidObjectId(threadId)) {
      throw new AppError('Invalid thread ID format.', 400, 'INVALID_ID');
    }

    const community = await communityService.getCommunityByIdOrSlug(communityIdOrSlug);

    // Load thread — must exist
    const thread = await Thread.findById(threadId).lean();
    if (!thread) {
      throw new AppError('Thread not found.', 404, 'NOT_FOUND');
    }

    // Verify thread belongs to the requested community
    if (thread.community.toString() !== community._id.toString()) {
      throw new AppError(
        'Thread does not belong to this community.',
        400,
        'THREAD_COMMUNITY_MISMATCH'
      );
    }

    const reply = await Reply.create({
      thread: thread._id,
      community: community._id,
      author: userId,
      body: body.trim(),
    });

    // Sync repliesCount on Thread (ground truth from real records)
    const repliesCount = await Reply.countDocuments({ thread: thread._id });
    await Thread.findByIdAndUpdate(thread._id, { repliesCount });

    return Reply.findById(reply._id)
      .populate('author', AUTHOR_PROJECTION)
      .lean();
  },
};

export default threadService;
