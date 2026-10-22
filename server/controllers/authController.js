/**
 * DEVVERSE — Authentication Controller
 *
 * Dispatches signup, login, logout, and me requests.
 * Attaches and clears signed HttpOnly session cookies.
 */

import authService from '../services/authService.js';
import { setSessionCookie, clearSessionCookie } from '../utils/session.js';

export const authController = {
  /**
   * POST /api/auth/signup
   */
  async signup(req, res, next) {
    try {
      const user = await authService.signup(req.body);
      setSessionCookie(res, user);

      res.status(201).json({
        status: 'ok',
        message: 'Account created successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const identifier = req.body.emailOrUsername || req.body.email || req.body.username;
      const user = await authService.login({
        emailOrUsername: identifier,
        password: req.body.password,
      });

      setSessionCookie(res, user);

      res.status(200).json({
        status: 'ok',
        message: 'Signed in successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(_req, res, next) {
    try {
      clearSessionCookie(res);
      res.status(200).json({
        status: 'ok',
        message: 'Signed out successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user._id);
      res.status(200).json({
        status: 'ok',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
