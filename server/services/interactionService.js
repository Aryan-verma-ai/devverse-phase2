/**
 * DEVVERSE — Interaction Service (Likes & Bookmarks)
 *
 * Implements domain logic for:
 *   - Idempotent likes: adding/removing like records with atomic duplicate safety.
 *   - Derived likesCount: grounded strictly in actual stored records via Like.countDocuments.
 *   - Idempotent bookmarks: adding/removing bookmark records.
 *   - Querying user interactions: returning active liked and bookmarked project IDs.
 */

import mongoose from 'mongoose';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

export const interactionService = {
  /**
   * Idempotently adds a like for a user on a project.
   * Recalculates and updates Project.likesCount strictly from stored records.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} projectId
   * @returns {Promise<{ liked: boolean, likesCount: number }>}
   */
  async likeProject(userId, projectId) {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    try {
      await Like.create({ user: userId, project: projectId });
    } catch (err) {
      // Duplicate key error (code 11000) means the user already liked it — handled idempotently
      if (err.code !== 11000) throw err;
    }

    // Ground count strictly in actual database records
    const likesCount = await Like.countDocuments({ project: projectId });
    await Project.findByIdAndUpdate(projectId, { likesCount });

    return { liked: true, likesCount };
  },

  /**
   * Idempotently removes a like for a user on a project.
   * Recalculates and updates Project.likesCount strictly from stored records.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} projectId
   * @returns {Promise<{ liked: boolean, likesCount: number }>}
   */
  async unlikeProject(userId, projectId) {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    await Like.deleteOne({ user: userId, project: projectId });

    // Ground count strictly in actual database records
    const likesCount = await Like.countDocuments({ project: projectId });
    await Project.findByIdAndUpdate(projectId, { likesCount });

    return { liked: false, likesCount };
  },

  /**
   * Idempotently adds a bookmark for a user on a project.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} projectId
   * @returns {Promise<{ bookmarked: boolean }>}
   */
  async bookmarkProject(userId, projectId) {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    try {
      await Bookmark.create({ user: userId, project: projectId });
    } catch (err) {
      // Duplicate key error (code 11000) is handled idempotently
      if (err.code !== 11000) throw err;
    }

    return { bookmarked: true };
  },

  /**
   * Idempotently removes a bookmark for a user on a project.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} projectId
   * @returns {Promise<{ bookmarked: boolean }>}
   */
  async unbookmarkProject(userId, projectId) {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    await Bookmark.deleteOne({ user: userId, project: projectId });

    return { bookmarked: false };
  },

  /**
   * Returns all liked and bookmarked project IDs for a given user.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<{ likedProjectIds: string[], bookmarkedProjectIds: string[] }>}
   */
  async getUserInteractions(userId) {
    const [likes, bookmarks] = await Promise.all([
      Like.find({ user: userId }).select('project').lean(),
      Bookmark.find({ user: userId }).select('project').lean(),
    ]);

    return {
      likedProjectIds: likes.map((l) => l.project.toString()),
      bookmarkedProjectIds: bookmarks.map((b) => b.project.toString()),
    };
  },

  /**
   * Checks whether a specific user liked and/or bookmarked a given project.
   *
   * @param {string} projectId
   * @param {string|mongoose.Types.ObjectId|null} userId
   * @returns {Promise<{ liked: boolean, bookmarked: boolean }>}
   */
  async getProjectInteractionsForUser(projectId, userId) {
    if (!userId) {
      return { liked: false, bookmarked: false };
    }

    const [likeDoc, bookmarkDoc] = await Promise.all([
      Like.exists({ user: userId, project: projectId }),
      Bookmark.exists({ user: userId, project: projectId }),
    ]);

    return {
      liked: Boolean(likeDoc),
      bookmarked: Boolean(bookmarkDoc),
    };
  },
};

export default interactionService;
