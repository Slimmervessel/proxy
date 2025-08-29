// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());               // Allow cross-origin requests
app.disable('x-powered-by');   // Hide Express signature in headers

// Proxy all requests to /proxy
app.use('/proxy', createProxyMiddleware({
  changeOrigin: true,
  selfHandleResponse: true,  // Allows you to modify response headers
  onProxyReq: (proxyReq, req, res) => {
    // Optional: remove or modify headers before sending request to target
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
  },
  onProxyRes: async (proxyRes, req, res) => {
    let body = [];

    proxyRes.on('data', chunk => body.push(chunk));
    proxyRes.on('end', () => {
      // Concatenate and forward response
      const content = Buffer.concat(body);

      // Remove headers that prevent embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');

      // Copy remaining headers
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (!['content-length','x-frame-options','content-security-policy'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      res.send(content);
    });
  },
  router: (req) => {
    // Extract and route to requested URL
    const targetUrl = req.query.url;
    return new URL(targetUrl).origin;
  },
  pathRewrite: (path, req) => {
    const targetUrl = new URL(req.query.url);
    return targetUrl.pathname + targetUrl.search;
  }
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
