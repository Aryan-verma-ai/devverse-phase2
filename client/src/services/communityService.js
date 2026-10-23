/**
 * DEVVERSE — Community Service
 *
 * Client-side service layer communicating with the /api/communities REST endpoints.
 */

import apiClient from './apiClient.js';

export const communityService = {
  /**
   * Fetches the complete list of communities with actual member counts.
   *
   * @returns {Promise<Array<Object>>}
   */
  async getCommunities() {
    const res = await apiClient.get('/communities');
    return res?.data || [];
  },

  /**
   * Fetches a single community by ObjectId or canonical slug ('c1', etc.).
   *
   * @param {string} idOrSlug
   * @returns {Promise<Object>}
   */
  async getCommunity(idOrSlug) {
    const res = await apiClient.get(`/communities/${idOrSlug}`);
    return res?.data;
  },

  /**
   * Joins a community for the authenticated user.
   *
   * @param {string} idOrSlug
   * @returns {Promise<{ joined: boolean, membersCount: number }>}
   */
  async joinCommunity(idOrSlug) {
    const res = await apiClient.post(`/communities/${idOrSlug}/join`);
    return res?.data;
  },

  /**
   * Leaves a community for the authenticated user.
   *
   * @param {string} idOrSlug
   * @returns {Promise<{ joined: boolean, membersCount: number }>}
   */
  async leaveCommunity(idOrSlug) {
    const res = await apiClient.delete(`/communities/${idOrSlug}/leave`);
    return res?.data;
  },

  /**
   * Retrieves all joined community IDs and slugs for the current user.
   *
   * @returns {Promise<{ joinedCommunityIds: string[], joinedCommunitySlugs: string[] }>}
   */
  async getUserMemberships() {
    const res = await apiClient.get('/communities/user-memberships');
    return res?.data || { joinedCommunityIds: [], joinedCommunitySlugs: [] };
  },
};

export default communityService;
