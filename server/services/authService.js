/**
 * DEVVERSE — Authentication Service
 *
 * Core authentication logic:
 *   - Duplicate account rejection with 409 CONFLICT.
 *   - Secure bcrypt password hashing.
 *   - Generic credential failure messages (anti-enumeration).
 *   - Safe user returns without passwordHash.
 */

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const BCRYPT_SALT_ROUNDS = 12;

export const authService = {
  /**
   * Registers a new user with hashed password and normalized identity fields.
   *
   * @param {Object} userData
   * @param {string} userData.username
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {string} userData.displayName
   * @param {string} [userData.bio]
   * @param {string} [userData.avatarUrl]
   * @returns {Promise<Object>}
   */
  async signup({ username, email, password, displayName, bio = '', avatarUrl = '' }) {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing duplicate account
    const existing = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existing) {
      const isUsernameMatch = existing.username === normalizedUsername;
      const field = isUsernameMatch ? 'username' : 'email';
      throw new AppError(
        `An account with that ${field} already exists. Please choose another or sign in.`,
        409,
        'CONFLICT'
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user record
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    return user;
  },

  /**
   * Authenticates user credentials. Employs generic error message to prevent enumeration.
   *
   * @param {Object} credentials
   * @param {string} credentials.emailOrUsername
   * @param {string} credentials.password
   * @returns {Promise<Object>}
   */
  async login({ emailOrUsername, password }) {
    const identifier = emailOrUsername.trim().toLowerCase();

    // Query user by username or email, explicitly requesting passwordHash and email
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+passwordHash +email');

    if (!user) {
      throw new AppError(
        'Invalid username/email or password. Please try again.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(
        'Invalid username/email or password. Please try again.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Exclude passwordHash before returning
    user.passwordHash = undefined;
    return user;
  },

  /**
   * Retrieves user profile for the authenticated session.
   *
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId).select('+email');
    if (!user) {
      throw new AppError('User profile not found.', 404, 'NOT_FOUND');
    }
    return user;
  },
};

export default authService;
