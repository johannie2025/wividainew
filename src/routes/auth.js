// routes/auth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Called by PHP app to validate API keys
router.post('/validate', (req, res) => {
  const { api_key, master_secret } = req.body;
  if (master_secret !== process.env.MASTER_SECRET) {
    return res.status(403).json({ valid: false, error: 'Forbidden' });
  }
  // In real setup: check DB. For now accept any wividai_ key
  const valid = api_key && api_key.startsWith('wividai_');
  res.json({ valid, plan: valid ? 'starter' : null });
});

// Generate new API key (called from PHP admin)
router.post('/generate', (req, res) => {
  const { master_secret, user_id, plan } = req.body;
  if (master_secret !== process.env.MASTER_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const key = 'wividai_' + crypto.randomBytes(24).toString('hex');
  res.json({ success: true, api_key: key, user_id, plan });
});

module.exports = router;
