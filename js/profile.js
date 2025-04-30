document.addEventListener('DOMContentLoaded', async () => {
  const usernameEl = document.getElementById('username');
  const nameEl = document.getElementById('name');
  const nameInput = document.getElementById('name-input');
  const setNameBtn = document.getElementById('set-name-btn');
  const rankEl = document.getElementById('rank');
  const xpEl = document.getElementById('xp');
  const countryEl = document.getElementById('country');
  const coinsEl = document.getElementById('coins');
  const inventoryListEl = document.getElementById('inventory-list');
  const friendsEl = document.getElementById('friends');
  const xpProgressEl = document.getElementById('xp-progress');
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const logoutBtn = document.getElementById('logout-btn');

  if (!usernameEl || !nameEl || !nameInput || !setNameBtn || !rankEl || !xpEl || !countryEl || !coinsEl ||
      !inventoryListEl || !friendsEl || !xpProgressEl || !backToQuestsBtn || !logoutBtn) {
    console.error('One or more required DOM elements are missing!');
    return;
  }

  async function fetchUser() {
    try {
      const response = await fetch('/api/get-session-username');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch session username');
      }
      const { username } = await response.json();
      if (!username) throw new Error('No username found in session');

      const userResponse = await fetch('/js/json/user.json');
      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      const data = await userResponse.json();
      const userData = data[username];
      if (!userData) throw new Error('User not found in user.json');
      return userData;
    } catch (error) {
      console.error('Error fetching user:', error.message);
      return null;
    }
  }

  async function saveUserData(userData) {
    try {
      const response = await fetch('/js/json/user.json');
      if (!response.ok) throw new Error('Failed to fetch user.json');
      const data = await response.json();
      data[user.username] = userData;
      const putResponse = await fetch('/js/json/user.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!putResponse.ok) throw new Error('Failed to save user data');
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error.message);
    }
  }

  // Country code to flag emoji mapping
  const countryToFlag = {
    'united states': '🇺🇸',
    'india': '🇮🇳',
    'united kingdom': '🇬🇧',
    'japan': '🇯🇵',
    'south korea': '🇰🇷',
    'china': '🇨🇳',
    'france': '🇫🇷',
    'germany': '🇩🇪',
    'canada': '🇨🇦',
    'australia': '🇦🇺'
  };

  // Capitalize country name
  function capitalizeCountry(country) {
    return country.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Initialize profile
  const user = await fetchUser();
  if (!user) {
    document.getElementById('profile-container').innerHTML = `
      <h1 class="title">Hunter Profile <span>⚡</span></h1>
      <p style="color: #ff4d4d; font-size: 16px; margin: 20px 0;">
        You are not logged in. Please <a href="/" style="color: #00b7eb; text-decoration: underline;">log in</a> to continue.
      </p>
    `;
    return;
  }

  // Display user data
  usernameEl.textContent = user.username;
  nameEl.textContent = `Name: ${user.displayName || 'Not Set'}`;
  rankEl.textContent = `Rank: ${user.rank || 'E-Rank'}`;
  xpEl.textContent = `XP: ${user.xp || 0}`;
  const countryName = user.country.toLowerCase();
  const flag = countryToFlag[countryName] || '🌍';
  countryEl.innerHTML = `Country: <span class="flag">${flag}</span> ${capitalizeCountry(countryName)}`;
  coinsEl.textContent = `Coins: ${user.coins || 0}`;
  inventoryListEl.innerHTML = user.inventory && user.inventory.length > 0
    ? user.inventory.map(item => `<li>${item}</li>`).join('')
    : '<li>No items</li>';
  friendsEl.textContent = 'Coming Soon...';
  xpProgressEl.style.width = `${(user.xp || 0) / 100000 * 100}%`;

  // Set display name
  setNameBtn.addEventListener('click', async () => {
    const newName = nameInput.value.trim();
    if (!newName) {
      alert('Please enter a display name');
      return;
    }
    if (newName.length > 20) {
      alert('Display name must be 20 characters or less');
      return;
    }
    user.displayName = newName;
    await saveUserData(user);
    nameEl.textContent = `Name: ${user.displayName}`;
    nameInput.value = '';
  });

  // Event listeners for navigation
  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/logout');
      if (response.ok) {
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  });
});