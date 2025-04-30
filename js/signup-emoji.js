document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const country = document.getElementById('country').value; // Already a Unicode string
  const errorMessage = document.getElementById('error-message');

  try {
    const response = await fetch('/signup-emoji', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
        country // Send the raw Unicode string
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      errorMessage.textContent = errorText;
      errorMessage.classList.remove('hidden');
    } else {
      window.location.href = '/quests.html'; // Redirect on success
    }
  } catch (err) {
    errorMessage.textContent = 'Error during signup: ' + err.message;
    errorMessage.classList.remove('hidden');
  }
});