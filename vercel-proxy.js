// vercel-proxy.js - Middleware for Vercel to proxy API requests to Railway backend
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if the request is for the API
  if (req.url.startsWith('/api')) {
    console.log(`Proxying API request: ${req.url} to Railway backend`);
    
    // Create a proxy to the backend API
    const apiProxy = createProxyMiddleware({
      target: 'https://mamacycle-marketplace-production.up.railway.app',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          message: 'Error connecting to backend service',
          error: err.message 
        }));
      }
    });
    
    // Apply the proxy middleware
    return apiProxy(req, res);
  }
  
  // Continue with normal Vercel handling for non-API requests
  return;
}; 