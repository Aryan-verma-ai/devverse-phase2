/**
 * DEVVERSE — Request Logger Middleware
 *
 * Logs each incoming request in a safe, structured format.
 *
 * What IS logged:   timestamp, HTTP method, URL path + query string, response status, duration
 * What is NOT logged: request body, Authorization headers, Cookie values, passwords
 *
 * The response status and duration are captured using the 'finish' event on the
 * response object, so a single log line contains the complete picture of the request.
 *
 * In production, structured JSON logging (e.g. pino) would be preferred.
 * For this college project scope, human-readable console output is sufficient
 * and easier to read in a terminal.
 */

import env from '../config/env.js';

/**
 * Express middleware that logs each completed request.
 * Safe to use in all environments — no sensitive data is logged.
 *
 * @type {import('express').RequestHandler}
 */
export default function requestLogger(req, res, next) {
  const start = Date.now();
  const ts = new Date().toISOString();

  // Log on response finish so we can include status and duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Colour-code status for readability in development terminal
    let statusStr = String(statusCode);
    if (env.NODE_ENV === 'development') {
      if (statusCode >= 500) statusStr = `\x1b[31m${statusCode}\x1b[0m`; // red
      else if (statusCode >= 400) statusStr = `\x1b[33m${statusCode}\x1b[0m`; // yellow
      else if (statusCode >= 200) statusStr = `\x1b[32m${statusCode}\x1b[0m`; // green
    }

    console.log(`[${ts}]  ${req.method}  ${req.url}  ${statusStr}  ${duration}ms`);
  });

  next();
}
