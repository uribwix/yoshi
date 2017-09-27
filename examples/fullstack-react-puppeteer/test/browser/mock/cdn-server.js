'use strict';

import express from 'express';

const app = express();

function corsMiddleware() {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  };
}

function resourceTimingMiddleware() {
  return (req, res, next) => {
    res.setHeader('Timing-Allow-Origin', '*');
    next();
  };
}

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', 0);
  return next();
});

app
  .use(corsMiddleware())
  .use(resourceTimingMiddleware())
  .use(express.static('dist/statics'));

const port = process.env.FAKE_SERVER_PORT || 3200;
app.listen(port, () => {
  console.log(`CDN server is running on port ${port}`);
});

module.exports = app;
