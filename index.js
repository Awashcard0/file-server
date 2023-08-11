const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const formidable = require('formidable');

// Define the username and password to access the server
const PORT = 3000
const username = "admin";
const password = "password";

// Create the 'files' directory if it doesn't exist
const filesDirectory = path.join(__dirname, 'files');
if (!fs.existsSync(filesDirectory)) {
  console.log("--------------------------------------------------------------------\nNo `files` folder was found in this dir, so I made you one :)\n--------------------------------------------------------------------");
  fs.mkdirSync(filesDirectory);
}

// Create the HTTP server
const server = http.createServer(function (req, res) {
  // Parse the request URL
  const parsedUrl = url.parse(req.url, true);

  // Check if the user is trying to access the server without authentication
  if (req.method === 'GET' && parsedUrl.pathname === '/login') {
    return serveFile(res, 'login.html');
  }

  // Handle login request
  if (req.method === 'POST' && parsedUrl.pathname === '/login') {
    handleLogin(req, res);
    return;
  }

  const cookies = parseCookies(req);
  const userCookie = cookies.username;
  if (!userCookie || userCookie !== username) {
    return serveUnauthorized(res);
  }

  // Get the path to the requested file
  let filePath = path.join(__dirname, 'files', parsedUrl.pathname);

  if (!fs.existsSync(filePath)) {
    return serveNotFound(res);;
  }

  // Check if the requested file is a directory
  if (fs.statSync(filePath).isDirectory()) {
    // If it is a directory, try to find an index.html file

    // filePath = path.join(__dirname, 'index.html');
    // if (!fs.existsSync(filePath)) {
      // If no index.html file exists, show a list of files in the directory
      fs.readdir(filePath, function(err, files) {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end(`500 Internal Server Error. Error ${err}`);
          return;
        }
        let fileHtml = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>File Server</title>
        </head>
        <body>
          <div class="file-explorer">
            <h1>File Server</h1>
            <button onclick="document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; window.location.reload();">Logout</button>
                  <form id="uploadForm" enctype="multipart/form-data">
                  <input type="file" id="filetoupload" name="filetoupload"><br>
                  <button class="upload-button" type="button" onclick="handleUploadFormSubmission()">Upload</button>
                </form>
            <ul class="file-list">
          
        `;
        files.forEach(function(file) {
          fileHtml += '<li class="file-item"><a href="' + path.join(parsedUrl.pathname, file) + '">' + decodeURIComponent(file) + '</a>';
          fileHtml += `<br><button class="delete-button" onclick="handleDeleteFile('\\${path.join(parsedUrl.pathname, file)}')">Delete</button>`;
          fileHtml += `<form class="rename-form" action="/rename" method="post" onsubmit="handleRenameFormSubmission(this); return false;">
          <input type="hidden" name="current" value="${path.join(parsedUrl.pathname, file)}">
          <input type="text" name="new" placeholder="Enter new filename">
          <button class="rename-button" type="submit">Rename</button>
        </form></li>`;
        });
        fileHtml += ` </ul>
        </div>
        </body>
        <script>
        function handleRenameFormSubmission(form) {
          const currentFilename = form.current.value;
          const newFilename = form.new.value;
          
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/rename', true);
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 302) {
              alert("Renamed");
              window.location.reload(); // Reload the page after successful rename
            } else if (xhr.readyState === 4) {
              // Handle error or other responses
              console.error('Error renaming file:', xhr.responseText);
              setTimeout(() => { window.location.reload(); }, 700);
            }
          };
          
          const params = 'current=' + encodeURIComponent(currentFilename) +
                         '&new=' + encodeURIComponent(newFilename);
          
          xhr.send(params);
        }
        
        function handleDeleteFile(filename) {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/delete', true);
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status === 302) {
                window.location.reload(); // Reload the page after successful deletion
              } else {
                // Handle error or other responses
                console.error('Error deleting file:', xhr.responseText);
                setTimeout(() => { window.location.reload(); }, 700);
              }
            }
          };
          
          const params = 'name=' + encodeURIComponent(filename)
          console.log(filename, params)
          xhr.send(params);
        }
        
        function handleUploadFormSubmission() {
            const fileInput = document.getElementById('filetoupload');
            const file = fileInput.files[0];
          
            if (!file) {
              console.error('No file selected for upload.');
              return;
            }
          
            const formData = new FormData();
            formData.append('filetoupload', file);
          
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload', true);
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                if (xhr.status === 404) {
                  window.location.reload(); // Reload the page after successful upload
                } else {
                  // Handle error or other responses
                  console.error('Error uploading file:', xhr.responseText);
                }
              }
            };
          
            xhr.send(formData);
          }
</script>
<style>
  body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: linear-gradient(to right, #f06, #9f6);
}

.file-explorer {
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 80%;
  margin: 50px auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: slide-in 0.5s forwards;
}

@keyframes slide-in {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

h1 {
  margin-bottom: 20px;
}

.file-list {
  list-style-type: none;
  padding: 0;
}

.file-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
}

.file-item a {
  flex-grow: 1;
  color: #007bff;
  text-decoration: none;
  margin-right: 10px;
}

.delete-button,
.rename-button,
.upload-button {
  background-color: #dc3545;
  border: none;
  color: white;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 5px;
}

.delete-button:hover,
.rename-button:hover,
.upload-button:hover {
  background-color: #c82333;
}

.upload-item {
  display: flex;
  align-items: center;
}

.upload-button {
  margin-top: 10px;
}

button {
  background-color: #dc3545;
  border: none;
  color: white;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 5px;
}

button:hover {
  background-color: #c82333;
}

</style>
        </html>`;
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(fileHtml);
      });
      return;
    // }
  }

  // Check if the requested file exists
  // if (!fs.existsSync(filePath)) {
  //   return serveNotFound(res);;
  // }

  // Serve the requested file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// Handle file uploads
server.on('request', function(req, res) {
  const parsedUrl = url.parse(req.url, true);

  if (req.method.toLowerCase() === 'post' && req.url === '/upload') {
    // Parse the form data
    const form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      if (err) {
        console.error(err);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Internal Server Error, Error: ' + err);
        return;
      }
      // Move the uploaded file to the 'files' directory
      const oldPath = files.filetoupload.filepath;
      const newPath = path.join(__dirname, 'files', encodeURIComponent(files.filetoupload.originalFilename));

      fs.copyFile(oldPath, newPath, function(err) {
        if (err) {
          console.error(err);
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('500 Internal Server Error, Error: ' + err);
          return;
        }
        // Redirect back to the home page after the upload is complete
        res.writeHead(302, {'Location': '/'});
        res.end();
      });
    });
  }

// Handle file deletion
if (req.method === 'POST' && parsedUrl.pathname === '/delete') {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
  const params = new URLSearchParams(body);

  const filename = params.get('name');
  const filePath = path.join(filesDirectory, filename);
  console.log(filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.writeHead(302, { 'Location': '/' });
    res.end();
  } else {
    return serveNotFound(res);
  }
});
return
}


// Handle file renaming
if (req.method === 'POST' && parsedUrl.pathname === '/rename') {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const currentFilename = params.get('current');
    const newFilename = encodeURIComponent(params.get('new'));
    const currentFilePath = path.join(filesDirectory, currentFilename);
    const newFilePath = path.join(filesDirectory, newFilename);

    if (fs.existsSync(currentFilePath)) {
      fs.renameSync(currentFilePath, newFilePath);
      res.writeHead(302, { 'Location': '/' });
      res.end();
    } else {
      return serveNotFound(res);
    }
  });
  return;
}


});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (http://localhost:${PORT}/)`);
});

// Function to parse cookies from request headers
function parseCookies(request) {
  const list = {};
  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const cookieArray = cookieHeader.split(';');
    for (const cookie of cookieArray) {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    }
  }
  return list;
}

function serveUnauthorized(res) {
  res.writeHead(401, {'Content-Type': 'text/html'});
  res.end('<meta http-equiv="refresh" content="0; URL=./login" />');
}

// Function to serve a not found response
function serveNotFound(res) {
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('404 Not Found');
}

// Function to serve a file
function serveFile(res, filename) {
  const filePath = path.join(__dirname, filename);
  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      return serveNotFound(res);
    }
    res.writeHead(200);
    res.end(data);
  });
}

// Function to handle login request
function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const Gotusername = params.get('username');
    const Gotpassword = params.get('password');
    if (Gotusername === username && Gotpassword === password) {
      res.setHeader('Set-Cookie', `username=${Gotusername}`);
      res.writeHead(302, {'Location': '/'});
      res.end();
    } else {
      serveFile(res, 'failed-login.html');
    }
  });
}


// Handle errors
process.on('unhandledRejection', (reason, p) => {
  console.log(' [Error_Handling] :: Unhandled Rejection/Catch');
  console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
  console.log(' [Error_Handling] :: Uncaught Exception/Catch');
  console.log(err, origin);
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.log(' [Error_Handling] :: Uncaught Exception/Catch (MONITOR)');
  console.log(err, origin);
});