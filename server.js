const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = 3000;

// CORS Headers for browser compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// Proxy route
app.use('/proxy', createProxyMiddleware({
  target: 'https://example.com', // dummy; we'll rewrite the target dynamically
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const url = req.query.url;
    return new URL(url).pathname + new URL(url).search;
  },
  router: (req) => {
    const url = req.query.url;
    const target = new URL(url);
    return `${target.protocol}//${target.host}`;
  },
  onProxyReq: (proxyReq, req, res) => {
    // remove headers that may block iframe use
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('referer');
  },
  onProxyRes: (proxyRes, req, res) => {
    // remove headers that block iframing
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
  }
}));

app.listen(PORT, () => {
  console.log(`🌐 Proxy server running at http://localhost:${PORT}`);
});
