const apiUrl = 'http://localhost:3000';

// Function to sign in the user
function signIn(username, password) {
  fetch(`${apiUrl}/signin`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  })
  .then(res => {
    if (res.ok) {
      // Redirect to the main page if the sign-in was successful
      window.location.href = '/';
    } else {
      // Display an error message if the sign-in failed
      alert('Sign-in failed. Please try again.');
    }
  })
  .catch(err => {
    console.error(`Error signing in: ${err}`);
    alert('An error occurred. Please try again.');
  });
}

// Function to sign out the user
function signOut() {
  fetch(`${apiUrl}/signout`)
  .then(() => {
    // Redirect to the sign-in page after signing out
    window.location.href = '/signin.html';
  })
  .catch(err => {
    console.error(`Error signing out: ${err}`);
    alert('An error occurred. Please try again.');
  });
}

// Function to get the list of files for the signed-in user
function getFiles() {
  fetch(`${apiUrl}/files`)
  .then(res => {
    if (res.ok) {
      // Display the list of files if the request was successful
      res.json().then(files => {
        const fileContainer = document.getElementById('file-container');
        fileContainer.innerHTML = '';
        files.forEach(file => {
          const li = document.createElement('li');
          li.textContent = file;
          fileContainer.appendChild(li);
        });
      });
    } else {
      // Display an error message if the request failed
      alert('An error occurred. Please try again.');
    }
  })
  .catch(err => {
    console.error(`Error getting files: ${err}`);
    alert('An error occurred. Please try again.');
  });
}

// Get the sign-in form element
const signInForm = document.getElementById('sign-in-form');

