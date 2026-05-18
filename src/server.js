require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Performance ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Whitelabel-Domain']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT || '30'),
  message: { error: 'Too many requests', retry_after: 60 },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip
});
app.use('/api/', limiter);

// ── Static output files ──────────────────────────────────────────────────────
const outputDir = path.join(__dirname, '../public/outputs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
app.use('/outputs', express.static(outputDir, { maxAge: '1h' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/video', require('./routes/video'));
app.use('/api/v1/templates', require('./routes/templates'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/status', require('./routes/status'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'WividAI Video API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      render: 'POST /api/v1/video/render',
      status: 'GET /api/v1/video/status/:jobId',
      download: 'GET /api/v1/video/download/:jobId',
      templates: 'GET /api/v1/templates',
      docs: 'GET /api/v1/docs'
    },
    durations: [6, 12, 18, 24, 30, 45, 60],
    formats: ['mp4'],
    resolutions: ['1920x1080', '1280x720', '1080x1920', '1080x1080', '1280x720']
  });
});

// ── API Docs ─────────────────────────────────────────────────────────────────
app.get('/api/v1/docs', (req, res) => {
  res.json({
    title: 'WividAI FrameScript API v1',
    description: 'Ultra-fast HTML-to-MP4 video generation API',
    authentication: 'Bearer token or X-API-Key header',
    endpoints: [
      {
        method: 'POST', path: '/api/v1/video/render',
        description: 'Render a video from HTML/FrameScript',
        body: {
          html: 'string (required) - HTML content with CSS animations',
          duration: 'number - 6|12|18|24|30|45|60 seconds',
          fps: 'number - 24|30|60 (default: 30)',
          width: 'number - default 1920',
          height: 'number - default 1080',
          template_id: 'string - use a preset template',
          variables: 'object - template variable substitutions',
          webhook_url: 'string - callback when done',
          quality: 'string - low|medium|high|ultra'
        }
      },
      {
        method: 'GET', path: '/api/v1/video/status/:jobId',
        description: 'Check render job status'
      },
      {
        method: 'GET', path: '/api/v1/video/download/:jobId',
        description: 'Download rendered MP4'
      }
    ]
  });
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Cleanup old files every hour ─────────────────────────────────────────────
setInterval(() => {
  const maxAge = 3600000; // 1 hour
  try {
    const files = fs.readdirSync(outputDir);
    const now = Date.now();
    files.forEach(f => {
      const fp = path.join(outputDir, f);
      const stat = fs.statSync(fp);
      if (now - stat.mtimeMs > maxAge) fs.unlinkSync(fp);
    });
  } catch (e) {}
}, 3600000);

app.listen(PORT, () => {
  console.log(`🎬 WividAI API running on port ${PORT}`);
  console.log(`📖 Docs: http://localhost:${PORT}/api/v1/docs`);
});

module.exports = app;
