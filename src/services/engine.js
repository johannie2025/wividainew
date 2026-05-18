/**
 * WividAI FrameScript Engine
 * Ultra-fast HTML→MP4 pipeline using Puppeteer + FFmpeg
 * Optimized for 512MB RAM environments (Render.com free tier)
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { EventEmitter } = require('events');

const VALID_DURATIONS = [6, 12, 18, 24, 30, 45, 60];
const QUALITY_PRESETS = {
  low:    { crf: 35, preset: 'ultrafast', scale: 0.5 },
  medium: { crf: 28, preset: 'superfast', scale: 0.75 },
  high:   { crf: 22, preset: 'fast',      scale: 1.0 },
  ultra:  { crf: 18, preset: 'medium',    scale: 1.0 }
};

class FrameScriptEngine extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.outputDir = path.join(__dirname, '../../public/outputs');
    this.tempDir = path.join(__dirname, '../../public/temp');
    [this.outputDir, this.tempDir].forEach(d => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });
  }

  /**
   * Main render entry point
   */
  async render(options) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'queued',
      progress: 0,
      created_at: new Date().toISOString(),
      options: this._validateOptions(options)
    };
    this.jobs.set(jobId, job);

    // Non-blocking render
    this._renderPipeline(job).catch(err => {
      job.status = 'failed';
      job.error = err.message;
      console.error(`[Job ${jobId}] Failed:`, err.message);
    });

    return { job_id: jobId, status: 'queued', estimated_seconds: this._estimateTime(job.options) };
  }

  _validateOptions(opts) {
    const duration = VALID_DURATIONS.includes(parseInt(opts.duration)) ? parseInt(opts.duration) : 6;
    const fps = [24, 30, 60].includes(parseInt(opts.fps)) ? parseInt(opts.fps) : 30;
    const quality = QUALITY_PRESETS[opts.quality] ? opts.quality : 'high';
    const width = parseInt(opts.width) || 1920;
    const height = parseInt(opts.height) || 1080;

    if (!opts.html || typeof opts.html !== 'string') {
      throw new Error('html content is required');
    }

    return { ...opts, duration, fps, quality, width, height, totalFrames: duration * fps };
  }

  _estimateTime(opts) {
    const base = opts.duration * 0.8;
    const qualityMul = { low: 0.3, medium: 0.6, high: 1.0, ultra: 2.0 };
    return Math.ceil(base * qualityMul[opts.quality]);
  }

  async _renderPipeline(job) {
    const { id, options } = job;
    const frameDir = path.join(this.tempDir, id);
    fs.mkdirSync(frameDir, { recursive: true });

    try {
      job.status = 'capturing';
      job.progress = 5;

      // ── Step 1: Launch minimal Chromium ────────────────────────────────────
      const browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--single-process',
          '--disable-extensions',
          `--window-size=${options.width},${options.height}`
        ],
        defaultViewport: { width: options.width, height: options.height },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true
      });

      const page = await browser.newPage();
      await page.setViewport({ width: options.width, height: options.height });

      // ── Step 2: Inject FrameScript runtime ─────────────────────────────────
      const fullHTML = this._injectRuntime(options.html, options);
      await page.setContent(fullHTML, { waitUntil: 'networkidle0', timeout: 15000 });

      // ── Step 3: Capture frames with smart sampling ─────────────────────────
      const { totalFrames, fps } = options;
      const quality = QUALITY_PRESETS[options.quality];

      // Smart frame capture: use requestAnimationFrame timing simulation
      await page.evaluate((opts) => {
        window.__WIVIDAI_START__ = performance.now();
        window.__WIVIDAI_DURATION__ = opts.duration * 1000;
        window.__WIVIDAI_FPS__ = opts.fps;
      }, options);

      for (let frame = 0; frame < totalFrames; frame++) {
        const timeMs = (frame / fps) * 1000;

        // Advance animation timeline
        await page.evaluate((time) => {
          if (window.__wividai_setTime) {
            window.__wividai_setTime(time);
          }
          // Force CSS animation progress
          document.querySelectorAll('*').forEach(el => {
            el.style.animationDelay = `-${time}ms`;
          });
        }, timeMs);

        const framePath = path.join(frameDir, `frame_${String(frame).padStart(6, '0')}.jpg`);
        await page.screenshot({
          path: framePath,
          type: 'jpeg',
          quality: quality.scale >= 1 ? 90 : 75,
          clip: quality.scale < 1 ? {
            x: 0, y: 0,
            width: Math.floor(options.width * quality.scale),
            height: Math.floor(options.height * quality.scale)
          } : undefined
        });

        job.progress = Math.floor(5 + (frame / totalFrames) * 70);
        if (frame % 30 === 0) this.emit('progress', { jobId: id, progress: job.progress });
      }

      await browser.close();
      job.progress = 75;
      job.status = 'encoding';

      // ── Step 4: FFmpeg encode to MP4 ───────────────────────────────────────
      const outputPath = path.join(this.outputDir, `${id}.mp4`);
      await this._encodeMP4(frameDir, outputPath, options);

      // ── Step 5: Cleanup temp frames ────────────────────────────────────────
      fs.rmSync(frameDir, { recursive: true, force: true });

      job.status = 'completed';
      job.progress = 100;
      job.output_url = `/outputs/${id}.mp4`;
      job.file_size = fs.statSync(outputPath).size;
      job.completed_at = new Date().toISOString();

      this.emit('completed', { jobId: id, url: job.output_url });

      // Webhook callback
      if (options.webhook_url) {
        this._triggerWebhook(options.webhook_url, job);
      }

    } catch (err) {
      fs.rmSync(frameDir, { recursive: true, force: true });
      throw err;
    }
  }

  _encodeMP4(frameDir, outputPath, options) {
    return new Promise((resolve, reject) => {
      const quality = QUALITY_PRESETS[options.quality];
      const scaleW = Math.floor(options.width * quality.scale);
      const scaleH = Math.floor(options.height * quality.scale);

      let cmd = ffmpeg()
        .input(path.join(frameDir, 'frame_%06d.jpg'))
        .inputOptions([`-framerate ${options.fps}`])
        .videoCodec('libx264')
        .outputOptions([
          `-crf ${quality.crf}`,
          `-preset ${quality.preset}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart',   // Web-optimized: metadata at start
          '-tune fastdecode',
          `-vf scale=${scaleW}:${scaleH}`
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject);

      // Add audio silence track for compatibility
      cmd.inputOptions(['-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100'])
         .outputOptions(['-c:a aac', '-shortest']);

      cmd.run();
    });
  }

  /**
   * Inject WividAI FrameScript runtime into HTML
   * Provides timeline control, variable substitution, effects
   */
  _injectRuntime(html, options) {
    // Variable substitution
    let processed = html;
    if (options.variables) {
      Object.entries(options.variables).forEach(([key, val]) => {
        processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
      });
    }

    const runtime = `
<script>
// WividAI FrameScript Runtime v1.0
window.__wividai_time = 0;
window.__wividai_duration = ${options.duration * 1000};

window.__wividai_setTime = function(ms) {
  window.__wividai_time = ms;
  const progress = ms / window.__wividai_duration;
  
  // Trigger custom timeline events
  document.querySelectorAll('[data-wividai-at]').forEach(el => {
    const at = parseFloat(el.getAttribute('data-wividai-at')) * 1000;
    const dur = parseFloat(el.getAttribute('data-wividai-dur') || '1') * 1000;
    if (ms >= at && ms <= at + dur) {
      el.classList.add('wividai-active');
      el.style.opacity = '1';
      el.style.transform = el.getAttribute('data-wividai-transform-in') || '';
    } else if (ms < at) {
      el.classList.remove('wividai-active');
      el.style.opacity = '0';
    }
  });

  // Progress bar elements
  document.querySelectorAll('[data-wividai-progress]').forEach(el => {
    el.style.width = (progress * 100) + '%';
  });

  // Counter elements
  document.querySelectorAll('[data-wividai-count]').forEach(el => {
    const target = parseFloat(el.getAttribute('data-wividai-count'));
    el.textContent = Math.floor(target * progress);
  });
};

// Preload: pause all CSS animations, we'll control them
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = \`
    * { animation-play-state: paused !important; }
    [data-wividai-at] { opacity: 0; transition: none !important; }
  \`;
  document.head.appendChild(style);
  window.__wividai_setTime(0);
});
</script>`;

    // Inject before </head> or at start
    if (processed.includes('</head>')) {
      return processed.replace('</head>', runtime + '</head>');
    }
    return runtime + processed;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async _triggerWebhook(url, job) {
    try {
      const https = require('https');
      const http = require('http');
      const payload = JSON.stringify({ event: 'video.completed', job });
      const lib = url.startsWith('https') ? https : http;
      const req = lib.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } });
      req.write(payload);
      req.end();
    } catch (e) { /* silent */ }
  }
}

module.exports = new FrameScriptEngine();
