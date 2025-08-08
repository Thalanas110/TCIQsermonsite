const crypto = require('crypto');

const generateFingerprint = (req) => {
  // Combine various request headers and properties to create a device fingerprint
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const connection = req.headers.connection || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  // Create a hash from combined properties
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${connection}|${ip}`;
  
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};

module.exports = { generateFingerprint };
