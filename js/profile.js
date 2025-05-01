document.addEventListener('DOMContentLoaded', () => {
  const usernameDisplay = document.getElementById('username');
  const nameDisplay = document.getElementById('name');
  const rankDisplay = document.getElementById('rank');
  const xpDisplay = document.getElementById('xp');
  const countryDisplay = document.getElementById('country');
  const coinsDisplay = document.getElementById('coins');
  const xpProgress = document.getElementById('xp-progress');
  const inventoryList = document.getElementById('inventory-list');
  const friendsDisplay = document.getElementById('friends');
  const nameInput = document.getElementById('name-input');
  const setNameBtn = document.getElementById('set-name-btn');
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const logoutBtn = document.getElementById('logout-btn');

  // Fetch username from session
  fetch('/api/get-session-username')
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch session username');
      return response.json();
    })
    .then(data => {
      if (data.username) {
        usernameDisplay.textContent = data.username;
        loadUserData(data.username);
      } else {
        console.error('No user logged in:', data.error || 'Unknown error');
        alert('Please log in to view your profile.');
        window.location.href = '/login.html';
      }
    })
    .catch(error => {
      console.error('Error fetching username:', error.message);
      alert('An error occurred while loading your profile. Please try again.');
    });

  // Load user data from user.json
  function loadUserData(username) {
    fetch('/js/json/user.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch user data');
        return response.json();
      })
      .then(users => {
        const user = users[username];
        if (!user) {
          console.warn('User data not found for:', username);
          return;
        }

        // Update stats
        xpDisplay.textContent = `XP: ${user.xp}`;
        rankDisplay.textContent = `Rank: ${user.rank || 'E-Rank'}`;
        coinsDisplay.textContent = `Coins: ${user.coins}`;
        nameDisplay.textContent = user.name ? `Name: ${user.name}` : 'Name: Not Set';
        updateXPBar(user.xp);

        // Update country with proper HTML rendering
        const countryName = user.country || 'Unknown';
        const flagEmoji = getFlagEmoji(countryName);
        countryDisplay.innerHTML = ''; // Clear existing content
        const countryText = document.createTextNode(`Country: ${countryName} `);
        const flagSpan = document.createElement('span');
        flagSpan.className = 'flag';
        flagSpan.textContent = flagEmoji;
        countryDisplay.appendChild(countryText);
        countryDisplay.appendChild(flagSpan);

        // Populate inventory
        inventoryList.innerHTML = user.inventory
          ? user.inventory.map(item => `<li>${item}</li>`).join('')
          : '<li>No items</li>';

        // Populate friends from team array
        const team = user.team || [];
        if (team.length === 0) {
          friendsDisplay.innerHTML = '<p>No friends in team.</p>';
        } else {
          friendsDisplay.innerHTML = '<ul>' + team
            .map(friend => `<li>${friend}</li>`)
            .join('') + '</ul>';
        }
      })
      .catch(error => {
        console.error('Error loading user data:', error.message);
        xpDisplay.textContent = 'XP: Error';
        countryDisplay.textContent = 'Country: Error';
        coinsDisplay.textContent = 'Coins: Error';
        friendsDisplay.textContent = 'Friends: Error loading data.';
      });
  }

  // Update XP progress bar
  function updateXPBar(xp) {
    const maxXP = 1000; // Adjust max XP as per your rank system
    const progress = Math.min((xp / maxXP) * 100, 100);
    xpProgress.style.width = `${progress}%`;
    if (xp >= 243) xpProgress.style.backgroundColor = '#4caf50'; // Green for progress
  }

  // Get flag emoji based on country name
  function getFlagEmoji(country) {
    const countryFlags = {
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
    return countryFlags[country.toLowerCase()] || '🌍';
  }

  // Set display name
  setNameBtn.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    if (newName && newName.length <= 20) {
      fetch('/js/json/user.json')
        .then(response => response.json())
        .then(users => {
          const username = usernameDisplay.textContent;
          if (users[username]) {
            users[username].name = newName;
            return fetch('/js/json/user.json', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(users)
            });
          }
        })
        .then(response => {
          if (response.ok) {
            nameDisplay.textContent = `Name: ${newName}`;
            nameInput.value = '';
          } else {
            throw new Error('Failed to update name');
          }
        })
        .catch(error => console.error('Error setting name:', error.message));
    } else {
      alert('Name must be 20 characters or less and cannot be empty.');
    }
  });

  // Back to quests button
  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });

  // Logout button
  logoutBtn.addEventListener('click', () => {
    fetch('/logout', { method: 'GET' })
      .then(() => window.location.href = '/login.html')
      .catch(error => console.error('Error logging out:', error.message));
  });
});