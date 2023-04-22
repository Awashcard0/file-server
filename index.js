const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const ejs = require('ejs');

const server = http.createServer((req, res) => {
  // Handle file uploads
  if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('Internal server error');
        return;
      }
      const file = files.filetoupload;
      const oldpath = file.path;
      const newpath = path.join(__dirname, '/uploads/', file.name);
      fs.rename(oldpath, newpath, (err) => {
        if (err) {
          console.error(err);
          res.statusCode = 500;
          res.end('Internal server error');
          return;
        }
        res.writeHead(302, { 'Location': '/' });
        res.end();
      });
    });
  // Handle file downloads and listing
  } else {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filepath = path.join(__dirname, url);
    fs.stat(filepath, (err, stats) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      if (stats.isDirectory()) {
        fs.readdir(filepath, (err, files) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('Internal server error');
            return;
          }
          const data = {
            files: files,
          };
          ejs.renderFile(path.join(__dirname, 'index.ejs'), data, (err, html) => {
            if (err) {
              console.error(err);
              res.statusCode = 500;
              res.end('Internal server error');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          });
        });
      } else {
        const stream = fs.createReadStream(filepath);
        stream.on('open', () => {
          const contentType = getContentType(filepath);
          res.writeHead(200, { 'Content-Type': contentType });
          stream.pipe(res);
        });
        stream.on('error', (err) => {
          console.error(err);
          res.statusCode = 500;
          res.end('Internal server error');
        });
      }
    });
  }
});

function getContentType(filepath) {
  const extname = path.extname(filepath);
  switch (extname) {
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpg';
    case '.wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
