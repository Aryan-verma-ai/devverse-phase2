/**
 * DEVVERSE — Community Service
 *
 * Implements business and domain logic for:
 *   - Directory listing with actual database member counts.
 *   - Detailed community retrieval by ObjectId or slug (e.g. 'c1').
 *   - Idempotent community joining and leaving with unique database constraints.
 *   - Canonical member count synchronization grounded in stored CommunityMembership records.
 *   - Current user active membership querying.
 */

import mongoose from 'mongoose';
import Community from '../models/Community.js';
import CommunityMembership from '../models/CommunityMembership.js';
import AppError from '../utils/AppError.js';

export const communityService = {
  /**
   * Retrieves all communities sorted by order of creation or canonical slug.
   *
   * @param {string|mongoose.Types.ObjectId|null} [requestingUserId=null]
   * @returns {Promise<Array<Object>>}
   */
  async listCommunities(requestingUserId = null) {
    const communities = await Community.find().sort({ createdAt: 1 }).lean();

    let joinedCommunityIds = new Set();
    if (requestingUserId) {
      const memberships = await CommunityMembership.find({ user: requestingUserId })
        .select('community')
        .lean();
      joinedCommunityIds = new Set(memberships.map((m) => m.community.toString()));
    }

    return communities.map((c) => ({
      ...c,
      id: c._id.toString(),
      isMember: joinedCommunityIds.has(c._id.toString()),
    }));
  },

  /**
   * Retrieves a single community by ObjectId or canonical slug ('c1', etc.).
   *
   * @param {string} idOrSlug
   * @param {string|mongoose.Types.ObjectId|null} [requestingUserId=null]
   * @returns {Promise<Object>}
   */
  async getCommunityByIdOrSlug(idOrSlug, requestingUserId = null) {
    if (!idOrSlug || typeof idOrSlug !== 'string') {
      throw new AppError('A valid community ID or slug is required.', 400, 'INVALID_INPUT');
    }

    const cleanInput = idOrSlug.trim().toLowerCase();
    const query = mongoose.isValidObjectId(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: cleanInput }] }
      : { slug: cleanInput };

    const community = await Community.findOne(query).lean();
    if (!community) {
      throw new AppError('Community not found.', 404, 'NOT_FOUND');
    }

    let isMember = false;
    if (requestingUserId) {
      const membership = await CommunityMembership.exists({
        user: requestingUserId,
        community: community._id,
      });
      isMember = Boolean(membership);
    }

    return {
      ...community,
      id: community._id.toString(),
      isMember,
    };
  },

  /**
   * Idempotently adds the requesting user to the specified community.
   * Grounded in database records via CommunityMembership.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} idOrSlug
   * @returns {Promise<{ joined: boolean, membersCount: number }>}
   */
  async joinCommunity(userId, idOrSlug) {
    const community = await this.getCommunityByIdOrSlug(idOrSlug);

    try {
      await CommunityMembership.create({ user: userId, community: community._id });
    } catch (err) {
      // E11000 duplicate key error means user already joined — handled idempotently
      if (err.code !== 11000) throw err;
    }

    // Ground member count strictly in actual database records
    const membersCount = await CommunityMembership.countDocuments({ community: community._id });
    await Community.findByIdAndUpdate(community._id, { membersCount });

    return { joined: true, membersCount };
  },

  /**
   * Idempotently removes the requesting user from the specified community.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} idOrSlug
   * @returns {Promise<{ joined: boolean, membersCount: number }>}
   */
  async leaveCommunity(userId, idOrSlug) {
    const community = await this.getCommunityByIdOrSlug(idOrSlug);

    await CommunityMembership.deleteOne({ user: userId, community: community._id });

    // Ground member count strictly in actual database records
    const membersCount = await CommunityMembership.countDocuments({ community: community._id });
    await Community.findByIdAndUpdate(community._id, { membersCount });

    return { joined: false, membersCount };
  },

  /**
   * Returns all joined community IDs and slugs for the user.
   *
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<{ joinedCommunityIds: string[], joinedCommunitySlugs: string[] }>}
   */
  async getUserMemberships(userId) {
    const memberships = await CommunityMembership.find({ user: userId })
      .populate('community', 'slug name')
      .lean();

    return {
      joinedCommunityIds: memberships.map((m) => m.community?._id?.toString()).filter(Boolean),
      joinedCommunitySlugs: memberships.map((m) => m.community?.slug).filter(Boolean),
    };
  },
};

export default communityService;
