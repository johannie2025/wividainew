/**
 * WividAI API Authentication Middleware
 */

const validKeys = new Map(); // In production, use DB/Redis

// Preload keys from env
if (process.env.MASTER_API_KEY) {
  validKeys.set(process.env.MASTER_API_KEY, {
    plan: 'unlimited',
    owner: 'master',
    whitelabel: true,
    monthly_limit: -1,
    used: 0
  });
}

module.exports = function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'] || 
                 (req.headers['authorization'] || '').replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required', code: 'MISSING_API_KEY' });
  }

  // Master key check
  if (process.env.MASTER_API_KEY && apiKey === process.env.MASTER_API_KEY) {
    req.apiUser = { plan: 'unlimited', owner: 'master', whitelabel: true };
    return next();
  }

  // Validate key format (wividai_xxxxx)
  if (!apiKey.startsWith('wividai_') || apiKey.length < 20) {
    return res.status(401).json({ error: 'Invalid API key format', code: 'INVALID_API_KEY' });
  }

  // In production: check DB via callback from PHP app
  // For now: accept any properly formatted key with limits
  req.apiUser = {
    plan: 'starter',
    api_key: apiKey,
    monthly_limit: parseInt(process.env.DEFAULT_MONTHLY_LIMIT || '100'),
    used: 0,
    whitelabel: false
  };

  // Whitelabel domain check
  const whitelabelDomain = req.headers['x-whitelabel-domain'];
  if (whitelabelDomain && process.env.WHITELABEL_DOMAINS) {
    const domains = process.env.WHITELABEL_DOMAINS.split(',');
    if (domains.includes(whitelabelDomain)) {
      req.apiUser.whitelabel = true;
      req.apiUser.whitelabel_domain = whitelabelDomain;
    }
  }

  next();
};
