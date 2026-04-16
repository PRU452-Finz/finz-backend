'use strict';

/**
 * Request Logger Middleware
 * Log setiap request masuk ke console — berguna saat development.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode < 300 ? '\x1b[32m' :
      res.statusCode < 400 ? '\x1b[33m' :
      '\x1b[31m';

    console.log(
      `${timestamp} ${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} — ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;
