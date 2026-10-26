/**
 * DEVVERSE — Thread Service (Client)
 *
 * Client-side service layer for the thread and reply REST endpoints.
 * All calls go to /api/communities/:communityId/threads/...
 *
 * Author projections from the server are always safe: username, displayName, avatarUrl only.
 */

import apiClient from './apiClient.js';

export const threadService = {
  /**
   * Fetches all threads for a community, sorted newest first.
   *
   * @param {string} communityId - ObjectId or canonical slug (e.g. 'c1')
   * @returns {Promise<Object[]>}
   */
  async getThreads(communityId) {
    const res = await apiClient.get(`/communities/${communityId}/threads`);
    return res?.data || [];
  },

  /**
   * Fetches a single thread by ID within a community.
   *
   * @param {string} communityId
   * @param {string} threadId
   * @returns {Promise<Object>}
   */
  async getThread(communityId, threadId) {
    const res = await apiClient.get(`/communities/${communityId}/threads/${threadId}`);
    return res?.data;
  },

  /**
   * Creates a new thread in a community.
   * Requires authentication (401 if not signed in).
   *
   * @param {string} communityId
   * @param {{ title: string, body: string }} payload
   * @returns {Promise<Object>} Created thread
   */
  async createThread(communityId, { title, body }) {
    const res = await apiClient.post(`/communities/${communityId}/threads`, { title, body });
    return res?.data;
  },

  /**
   * Fetches all replies for a thread, sorted oldest first.
   *
   * @param {string} communityId
   * @param {string} threadId
   * @returns {Promise<Object[]>}
   */
  async getReplies(communityId, threadId) {
    const res = await apiClient.get(`/communities/${communityId}/threads/${threadId}/replies`);
    return res?.data || [];
  },

  /**
   * Posts a reply on a thread.
   * Requires authentication (401 if not signed in).
   *
   * @param {string} communityId
   * @param {string} threadId
   * @param {{ body: string }} payload
   * @returns {Promise<Object>} Created reply
   */
  async createReply(communityId, threadId, { body }) {
    const res = await apiClient.post(
      `/communities/${communityId}/threads/${threadId}/replies`,
      { body }
    );
    return res?.data;
  },
};

export default threadService;
