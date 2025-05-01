document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) {
    console.error('Signup form not found');
    alert('Signup form not found. Please check the HTML.');
    return;
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const countryInput = document.getElementById('country');
    if (!usernameInput || !passwordInput || !countryInput) {
      console.error('Form elements not found');
      alert('Form elements not found. Please check the HTML.');
      return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const country = countryInput.value;

    if (!username || !password || !country) {
      console.warn('Missing fields');
      alert('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      console.warn('Password too short');
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      console.log('Sending signup request for:', username);
      const response = await fetch('/signup-emoji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password, country })
      });

      console.log('Signup response status:', response.status);
      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok && data.success) {
        console.log('Signup successful. Setting sessionStorage and redirecting...');
        sessionStorage.setItem('username', username);
        alert('Signup successful! Redirecting to login...');
        window.location.href = '/login.html'; // Redirect to login.html
        setTimeout(() => window.location.assign('/login.html'), 100); // Fallback
      } else {
        const errorText = data.error || 'Signup failed. Please try again.';
        console.warn('Signup failed:', errorText);
        alert(errorText);
      }
    } catch (error) {
      console.error('Error during signup:', error.message);
      alert('An error occurred while signing up: ' + error.message);
    }
  });
});