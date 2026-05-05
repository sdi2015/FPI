#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const getArgValue = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return process.env[name.toUpperCase()] || fallback;
};

const port = Number(getArgValue('port', '8765'));
const host = getArgValue('host', '127.0.0.1');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const resolveSafePath = (requestPath) => {
  const decodedPath = decodeURIComponent(requestPath);
  const normalizedPath = path.normalize(decodedPath).replace(/^([.][.][/\\])+/, '');
  const filePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  return path.join(rootDir, filePath);
};

const sendResponse = (res, statusCode, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(statusCode, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(body);
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const absolutePath = resolveSafePath(reqUrl.pathname);

  if (!absolutePath.startsWith(rootDir)) {
    sendResponse(res, 403, 'Forbidden');
    return;
  }

  fs.stat(absolutePath, (statError, stats) => {
    if (statError) {
      sendResponse(res, 404, 'Not Found');
      return;
    }

    const finalPath = stats.isDirectory() ? path.join(absolutePath, 'index.html') : absolutePath;

    fs.readFile(finalPath, (readError, content) => {
      if (readError) {
        sendResponse(res, 404, 'Not Found');
        return;
      }

      const extension = path.extname(finalPath).toLowerCase();
      const mimeType = mimeTypes[extension] || 'application/octet-stream';
      sendResponse(res, 200, content, mimeType);
    });
  });
});

server.listen(port, host, () => {
  console.log('FPI localhost server is running');
  console.log(`URL: http://${host}:${port}/`);
  console.log('Press Ctrl+C to stop');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try: npm run start:8766`);
    process.exit(1);
  }

  console.error(error.message);
  process.exit(1);
});
