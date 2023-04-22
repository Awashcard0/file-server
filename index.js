const http = require('http');
const fs = require('fs');
const path = require('path');
const qs = require('querystring'); // We need this package to parse the POST data

const PORT = 3000;
const PASSWORD = 'mysecretpassword'; // Change this to your desired password

// Create a server
const server = http.createServer((req, res) => {
  // If the user visits the root URL and is not signed in, show the sign-in form
  if (req.url === '/' && !isSignedIn(req)) {
    serveSignInForm(req, res);
  }
  // If the user is signed in and visits the root URL, show the list of files
  else if (req.url === '/' && isSignedIn(req)) {
    serveFileList(req, res);
  }
  // If the user submits the sign-in form, process the data and redirect to the root URL
  else if (req.url === '/signin' && req.method === 'POST') {
    processSignIn(req, res);
  }
  // If the user requests a file that exists in the user's directory, serve that file
  else if (isSignedIn(req)) {
    const filePath = path.join(__dirname, 'public', getUsername(req), req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('File not found');
        return;
      }

      res.writeHead(200);
      res.end(data);
    });
  }
  // Otherwise, show a 404 error page
  else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404 Not Found');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Helper functions

function isSignedIn(req) {
  // Check if the user has a valid session cookie
  return req.headers.cookie && req.headers.cookie.includes('session=');
}

function getUsername(req) {
  // Get the username from the session cookie
  const cookie = req.headers.cookie.split(';').find(c => c.trim().startsWith('session='));
  const username = cookie ? cookie.trim().substring(8) : '';
  return username;
}

function serveSignInForm(req, res) {
  // Serve the sign-in form
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Node.js File Server</title>
    </head>
    <body>
      <h1>Sign in to access your files</h1>
      <form method="POST" action="/signin">
        <label>
          Username:
          <input type="text" name="username" required>
        </label>
        <br>
        <label>
          Password:
          <input type="password" name="password" required>
        </label>
        <br>
        <button type="submit">Sign In</button>
      </form>
    </body>
    </html>
  `;
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);


function processSignIn(req, res) {
  // Parse the POST data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
});
}

req.on('end', () => {
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
  function serveFileList(req, res) {
    // Get the list of files in the user's directory
    const userDir = path.join(__dirname, 'public', getUsername(req));
    fs.readdir(userDir, (err, files) => {
    if (err) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
    return;
    }   
    // Serve the file list
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Node.js File Server</title>
</head>
<body>
  <h1>Files for user: ${getUsername(req)}</h1>
  <ul>
    ${files.map(file => `<li><a href="${file}">${file}</a></li>`).join('')}
  </ul>
</body>
</html>
`;
res.writeHead(200, {'Content-Type': 'text/html'});
res.end(html);
    });
}
});
}