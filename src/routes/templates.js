// routes/templates.js
const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const templates = require('../services/templates');

router.get('/', auth, (req, res) => {
  res.json({ success: true, templates: templates.list(), categories: templates.categories() });
});

router.get('/:id', auth, (req, res) => {
  const tpl = templates.get(req.params.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true, template: tpl });
});

module.exports = router;
