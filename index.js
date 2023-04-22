const http = require('http');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');

const PORT = 3000;
const ROOT_DIR = path.resolve(__dirname, 'public');
const PASSWORD = 'mypassword';

// Helper function to get the username from the session cookie
function getUsername(req) {
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Handler for the file list page
function handleListFiles(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, {'Content-Type': 'text/plain'});
    res.end('Method Not Allowed');
    return;
  }

  // Get the username from the session cookie
  const username = getUsername(req);

  // If the user is not signed in, redirect to the sign-in page
  if (!username) {
    res.writeHead(302, {'Location': '/signin.html'});
    res.end();
    return;
  }

  // Get a list of files for the signed-in user
  fs.readdir(ROOT_DIR, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Internal Server Error');
    } else {
      // Filter the list of files to include only those that belong to the signed-in user
      const userFiles = files.filter((file) => {
        return fs.statSync(path.join(ROOT_DIR, file)).isFile() && file.startsWith(username);
      });

      // Generate an HTML page with links to the user's files
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>File List</title>
          </head>
          <body>
            <h1>File List</h1>
            <p>Signed in as ${username} <a href="/signout">Sign out</a></p>
            <ul>
              ${userFiles.map((file) => `<li><a href="/${file}">${file}</a></li>`).join('\n')}
            </ul>
          </body>
        </html>
      `;
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    }
  });
}

// Handler for the sign-in page
function handleSignIn(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, {'Content-Type': 'text/plain'});
    res.end('Method Not Allowed');
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = qs.parse(body);
      const {username, password} = data;

      // Check if the username and password are correct
      if (username === getUsername(req) || password !== PASSWORD) {
        res.writeHead(401, {'Content-Type': 'text/plain'});
        res.end('Incorrect username or password');
      } else {
        // Set a session cookie with the username
        res.writeHead(302, {'Set-Cookie': `session=${username}`, 'Location': '/'});
        res.end();
      }
    } catch (err) {
      console.error(`Error parsing request body: ${err}`);
      res.writeHead(400, {'Content-Type': 'text/plain'});
      res.end('Bad Request');
      }
      });
      }
      
      // Handler for the sign-out page
      function handleSignOut(req, res) {
      // Clear the session cookie and redirect to the sign-in page
      res.writeHead(302, {'Set-Cookie': 'session=; Max-Age=0', 'Location': '/signin.html'});
      res.end();
      }
      
      // Handler for serving static files
      function handleStaticFile(req, res) {
      const filePath = path.join(ROOT_DIR, req.url.slice(1));
      fs.readFile(filePath, (err, data) => {
      if (err) {
      console.error(`Error reading file: ${err}`);
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not Found');
      } else {
      res.writeHead(200, {'Content-Type': getMimeType(filePath)});
      res.end(data);
      }
      });
      }
      
      // Helper function to get the MIME type of a file based on its extension
      function getMimeType(filePath) {
      const extname = path.extname(filePath).toLowerCase();
      const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
      };
      return mimeTypes[extname] || 'application/octet-stream';
      }
      
      // Create the HTTP server
      const server = http.createServer((req, res) => {
      if (req.url === '/signin' && req.method === 'POST') {
      handleSignIn(req, res);
      } else if (req.url === '/signout' && req.method === 'GET') {
      handleSignOut(req, res);
      } else if (req.url === '/') {
      handleListFiles(req, res);
      } else {
      handleStaticFile(req, res);
      }
      });
      
      // Start the server
      server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      });