const express = require('express');
const router = express.Router();
const engine = require('../services/engine');
const auth = require('../utils/auth');
const path = require('path');
const fs = require('fs');

// All video endpoints require auth
router.use(auth);

/**
 * POST /api/v1/video/render
 * Main render endpoint
 */
router.post('/render', async (req, res) => {
  try {
    const {
      html, duration, fps, width, height,
      quality, template_id, variables, webhook_url
    } = req.body;

    if (!html && !template_id) {
      return res.status(400).json({
        error: 'Either html or template_id is required',
        code: 'MISSING_CONTENT'
      });
    }

    let finalHtml = html;

    // Load template if specified
    if (template_id) {
      const templates = require('../services/templates');
      const tpl = templates.get(template_id);
      if (!tpl) return res.status(404).json({ error: 'Template not found' });
      finalHtml = tpl.html;
    }

    const result = await engine.render({
      html: finalHtml,
      duration: duration || 6,
      fps: fps || 30,
      width: width || 1920,
      height: height || 1080,
      quality: quality || 'high',
      variables: variables || {},
      webhook_url,
      user: req.apiUser
    });

    res.status(202).json({
      success: true,
      ...result,
      poll_url: `/api/v1/video/status/${result.job_id}`,
      download_url: `/api/v1/video/download/${result.job_id}`
    });

  } catch (err) {
    res.status(400).json({ error: err.message, code: 'RENDER_ERROR' });
  }
});

/**
 * GET /api/v1/video/status/:jobId
 */
router.get('/status/:jobId', (req, res) => {
  const job = engine.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    created_at: job.created_at,
    completed_at: job.completed_at || null,
    output_url: job.output_url || null,
    file_size: job.file_size || null,
    error: job.error || null,
    download_url: job.status === 'completed' ? `/api/v1/video/download/${job.id}` : null
  });
});

/**
 * GET /api/v1/video/download/:jobId
 */
router.get('/download/:jobId', (req, res) => {
  const job = engine.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'completed') {
    return res.status(425).json({ error: 'Video not ready', status: job.status, progress: job.progress });
  }

  const filePath = path.join(__dirname, '../../public/outputs', `${job.id}.mp4`);
  if (!fs.existsSync(filePath)) {
    return res.status(410).json({ error: 'File expired or deleted' });
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="wividai-${job.id}.mp4"`);
  res.setHeader('Content-Length', fs.statSync(filePath).size);
  fs.createReadStream(filePath).pipe(res);
});

/**
 * GET /api/v1/video/stream/:jobId (SSE progress)
 */
router.get('/stream/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onProgress = ({ jobId: jid, progress }) => {
    if (jid === jobId) sendEvent({ type: 'progress', progress });
  };

  const onCompleted = ({ jobId: jid, url }) => {
    if (jid === jobId) {
      sendEvent({ type: 'completed', url, download_url: `/api/v1/video/download/${jid}` });
      cleanup();
    }
  };

  const cleanup = () => {
    engine.off('progress', onProgress);
    engine.off('completed', onCompleted);
    res.end();
  };

  engine.on('progress', onProgress);
  engine.on('completed', onCompleted);

  // Check if already done
  const job = engine.getJob(jobId);
  if (job) {
    sendEvent({ type: 'status', status: job.status, progress: job.progress });
    if (job.status === 'completed') {
      sendEvent({ type: 'completed', url: job.output_url });
      return cleanup();
    }
  }

  req.on('close', cleanup);
  setTimeout(cleanup, 300000); // 5min timeout
});

/**
 * DELETE /api/v1/video/:jobId
 */
router.delete('/:jobId', (req, res) => {
  const job = engine.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const filePath = path.join(__dirname, '../../public/outputs', `${job.id}.mp4`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  engine.jobs.delete(job.id);

  res.json({ success: true, message: 'Video deleted' });
});

module.exports = router;
