/**
 * DEVVERSE — User Profile Service
 *
 * Handles:
 *   - Public profile retrieval with projects lookup and strict privacy guarantees
 *     (email and passwordHash are NEVER returned in public responses).
 *   - Authenticated profile updates with field allowlisting and server-enforced
 *     ownership checks (users can only edit their own profile).
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

export const userService = {
  /**
   * Retrieves public profile by username or ID.
   *
   * @param {string} identifier - Username or ObjectId
   * @returns {Promise<{ user: Object, projects: Array }>}
   */
  async getPublicProfile(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      throw new AppError('A valid username or user ID is required.', 400, 'BAD_REQUEST');
    }

    const trimmed = identifier.trim().toLowerCase();

    // Query user by username or ObjectId if valid
    const isObjectId = mongoose.isValidObjectId(trimmed);
    const query = isObjectId ? { $or: [{ _id: trimmed }, { username: trimmed }] } : { username: trimmed };

    const user = await User.findOne(query).select('-passwordHash -email');

    if (!user) {
      throw new AppError(`User '@${identifier}' not found.`, 404, 'NOT_FOUND');
    }

    // Retrieve projects authored by this user
    const projects = await Project.find({ owner: user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    return {
      user,
      projects,
    };
  },

  /**
   * Updates user profile with allowlisting and strict ownership enforcement.
   *
   * @param {string|mongoose.Types.ObjectId} targetUserId - ID of user document to update
   * @param {Object} requestingUser - Authenticated user from req.user
   * @param {Object} updates - Raw update payload from req.body
   * @returns {Promise<Object>} Updated user document
   */
  async updateProfile(targetUserId, requestingUser, updates) {
    if (!targetUserId || !mongoose.isValidObjectId(targetUserId)) {
      throw new AppError('Invalid target user identifier.', 400, 'INVALID_ID');
    }

    // Enforce ownership: user can only edit their own profile
    if (!requestingUser || requestingUser._id.toString() !== targetUserId.toString()) {
      throw new AppError('Forbidden: You can only edit your own profile.', 403, 'FORBIDDEN');
    }

    // Strict field allowlist extraction
    const allowedUpdates = {};

    if (updates.displayName !== undefined) {
      allowedUpdates.displayName = updates.displayName.trim();
    }
    if (updates.bio !== undefined) {
      allowedUpdates.bio = updates.bio.trim();
    }
    if (updates.avatarUrl !== undefined) {
      allowedUpdates.avatarUrl = updates.avatarUrl.trim();
    }
    if (updates.skills !== undefined) {
      allowedUpdates.skills = Array.isArray(updates.skills)
        ? updates.skills.map((s) => String(s).trim()).filter(Boolean)
        : [];
    }
    if (updates.links !== undefined && typeof updates.links === 'object' && updates.links !== null) {
      allowedUpdates.links = {
        github: updates.links.github ? updates.links.github.trim() : '',
        linkedin: updates.links.linkedin ? updates.links.linkedin.trim() : '',
        twitter: updates.links.twitter ? updates.links.twitter.trim() : '',
        website: updates.links.website ? updates.links.website.trim() : '',
      };
    }

    // Persist changes
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      allowedUpdates,
      { returnDocument: 'after', runValidators: true }
    ).select('+email');

    if (!updatedUser) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return updatedUser;
  },
};

export default userService;
