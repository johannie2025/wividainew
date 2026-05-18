const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'operational',
    uptime: process.uptime(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
      heap_used: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      heap_total: Math.round(mem.heapTotal / 1024 / 1024) + 'MB'
    },
    os: {
      free_mem: Math.round(os.freemem() / 1024 / 1024) + 'MB',
      total_mem: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      load: os.loadavg()[0].toFixed(2)
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
