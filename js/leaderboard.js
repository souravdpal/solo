document.addEventListener('DOMContentLoaded', async () => {
  const leaderboardList = document.getElementById('leaderboard-list');
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const searchInput = document.getElementById('search-input');

  if (!leaderboardList || !backToQuestsBtn || !searchInput) {
    console.error('One or more required DOM elements are missing!');
    return;
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
    'australia': '🇦🇺',
    'korea': '🇰🇷',
    'uae': '🇦🇪',
    'usa': '🇺🇸'
  };

  async function fetchUserData() {
    try {
      const response = await fetch('/js/json/user.json');
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      return data || {};
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      return {};
    }
  }

  function renderLeaderboard(users) {
    leaderboardList.innerHTML = '';
    const leaderboard = Object.values(users)
      .sort((a, b) => b.xp - a.xp);
    leaderboard.forEach((user, index) => {
      const countryName = user.country.toLowerCase();
      const flag = countryToFlag[countryName] || '🌍';
      const rank = user.rank || 'E-Rank';

      const li = document.createElement('li');
      li.innerHTML = `
        <span class="rank-position">${index + 1}.</span>
        <span class="username">${user.username}</span>
        <span class="xp">XP: ${user.xp}</span>
        <span class="rank">Rank: ${rank}</span>
        <span class="flag">${flag}</span>
      `;
      leaderboardList.appendChild(li);
    });
  }

  // Fetch and render initial data
  const userData = await fetchUserData();
  renderLeaderboard(userData);

  // Search functionality
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.toLowerCase();
    const userData = await fetchUserData();
    const filteredUsers = Object.values(userData).filter(user =>
      user.username.toLowerCase().includes(query)
    );
    renderLeaderboard(filteredUsers);
  });

  // Navigate back
  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });
});