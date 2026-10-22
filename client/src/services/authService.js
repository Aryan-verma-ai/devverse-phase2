/**
 * DEVVERSE — Client Authentication Service
 *
 * Dispatches auth requests to the backend API using the centralized apiClient.
 * Communicates with:
 *   - POST /api/auth/signup  -> Creates account, receives session cookie
 *   - POST /api/auth/login   -> Authenticates credentials, receives session cookie
 *   - POST /api/auth/logout  -> Clears session cookie
 *   - GET  /api/auth/me      -> Loads current user profile from active session
 *
 * NOTE: Credentials and session tokens are strictly stored in HttpOnly cookies
 * by the server and are NEVER placed in localStorage.
 */

import apiClient from './apiClient';

export const authService = {
  /**
   * Loads current user profile for the active session.
   *
   * @returns {Promise<Object>} Safe user object
   */
  async getCurrentUser() {
    const res = await apiClient.get('/auth/me');
    return res.data?.user || null;
  },

  /**
   * Signs in user with email/username and password.
   *
   * @param {Object} credentials
   * @param {string} credentials.emailOrUsername
   * @param {string} credentials.password
   * @returns {Promise<Object>} Safe user object
   */
  async login({ emailOrUsername, password }) {
    const res = await apiClient.post('/auth/login', {
      emailOrUsername,
      password,
    });
    return res.data?.user || null;
  },

  /**
   * Registers a new account.
   *
   * @param {Object} userData
   * @param {string} userData.username
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {string} userData.displayName
   * @param {string} [userData.bio]
   * @param {string} [userData.avatarUrl]
   * @returns {Promise<Object>} Safe user object
   */
  async signup(userData) {
    const res = await apiClient.post('/auth/signup', userData);
    return res.data?.user || null;
  },

  /**
   * Logs out the current user by clearing the session cookie on the server.
   *
   * @returns {Promise<boolean>}
   */
  async logout() {
    await apiClient.post('/auth/logout');
    return true;
  },
};

export default authService;
