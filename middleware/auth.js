const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  if (!req.session.isAdmin) {
    logger.warning(logger.categories.SECURITY, 'Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date()
    });
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next();
};

module.exports = authMiddleware;
