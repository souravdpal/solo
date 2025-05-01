document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) {
    console.error('Login form not found');
    alert('Login form not found. Please check the HTML.');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (!usernameInput || !passwordInput) {
      console.error('Form elements not found');
      alert('Form elements not found. Please check the HTML.');
      return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      console.warn('Missing username or password');
      alert('Please enter both username and password.');
      return;
    }

    if (password.length < 6) {
      console.warn('Password too short');
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      console.log('Sending login request for:', username);
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok && data.success) {
        console.log('Login successful. Setting sessionStorage and redirecting...');
        sessionStorage.setItem('username', username);
        alert('Login successful! Redirecting to quests...');
        window.location.href = '/quests.html';
        setTimeout(() => window.location.assign('/quests.html'), 100);
      } else {
        const errorText = data.error || 'Invalid username or password. Please try again.';
        console.warn('Login failed:', errorText);
        alert(errorText);
      }
    } catch (error) {
      console.error('Error during login:', error.message);
      alert('An error occurred while logging in: ' + error.message);
    }
  });
});