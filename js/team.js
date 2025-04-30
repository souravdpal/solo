document.addEventListener('DOMContentLoaded', async () => {
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const addTeammateBtn = document.getElementById('add-teammate');
  const teamList = document.getElementById('team-list');

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
      return await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      return {};
    }
  }

  async function renderTeam() {
    const userData = await fetchUserData();
    const username = sessionStorage.getItem('username');
    const team = userData[username]?.team || [];

    teamList.innerHTML = '';
    team.forEach(teammate => {
      const teammateData = userData[teammate];
      if (teammateData) {
        const countryName = teammateData.country.toLowerCase();
        const flag = countryToFlag[countryName] || '🌍';
        const rank = teammateData.rank || 'E-Rank';

        const li = document.createElement('li');
        li.innerHTML = `
          <span class="username">${teammate}</span>
          <span class="rank">Rank: ${rank}</span>
          <span class="flag">${flag}</span>
          <button class="remove-btn">Remove</button>
        `;
        teamList.appendChild(li);
      }
    });
  }

  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });

  addTeammateBtn.addEventListener('click', async () => {
    const newTeammate = prompt('Enter teammate username:');
    if (!newTeammate) return;

    const userData = await fetchUserData();
    const username = sessionStorage.getItem('username');

    if (!userData[newTeammate]) {
      alert('User not found!');
      return;
    }

    if (!userData[username].team) userData[username].team = [];
    if (userData[username].team.includes(newTeammate)) {
      alert('Teammate already added!');
      return;
    }

    userData[username].team.push(newTeammate);
    await fetch('/js/json/user.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    renderTeam();
  });

  teamList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const teammate = e.target.parentElement.querySelector('.username').textContent;
      const userData = await fetchUserData();
      const username = sessionStorage.getItem('username');

      userData[username].team = userData[username].team.filter(t => t !== teammate);
      await fetch('/js/json/user.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      renderTeam();
    }
  });

  renderTeam();
});