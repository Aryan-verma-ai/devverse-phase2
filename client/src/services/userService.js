/**
 * DEVVERSE — Client User Profile Service
 *
 * Dispatches profile reads and updates to the backend API:
 *   - GET   /api/users/:username  - Public profile & authored projects (no email/password)
 *   - PATCH /api/users/me         - Authenticated profile updates (allowlisted fields)
 */

import apiClient from './apiClient';

export const userService = {
  /**
   * Fetches public profile and projects for a given username.
   *
   * @param {string} username
   * @returns {Promise<{ user: Object, projects: Array }>}
   */
  async getPublicProfile(username) {
    const res = await apiClient.get(`/users/${encodeURIComponent(username)}`);
    return res.data;
  },

  /**
   * Updates the current authenticated user's profile.
   *
   * @param {Object} updates
   * @param {string} [updates.displayName]
   * @param {string} [updates.bio]
   * @param {string} [updates.avatarUrl]
   * @param {string[]} [updates.skills]
   * @param {Object} [updates.links]
   * @returns {Promise<Object>} Updated user object
   */
  async updateProfile(updates) {
    const res = await apiClient.patch('/users/me', updates);
    return res.data?.user;
  },
};

export default userService;
