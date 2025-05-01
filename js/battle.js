document.addEventListener('DOMContentLoaded', () => {
  const usernameDisplay = document.getElementById('username');
  const xpDisplay = document.getElementById('xp');
  const rankDisplay = document.getElementById('rank');
  const coinsDisplay = document.getElementById('coins');
  const battleBtn = document.getElementById('battle-btn');
  const battleResult = document.getElementById('battle-result');

  // Fetch username from session
  fetch('/api/get-session-username')
    .then(response => response.json())
    .then(data => {
      if (data.username) {
        usernameDisplay.textContent = data.username;
        loadUserStats(data.username);
      } else {
        console.error('No user logged in');
        alert('Please log in to access the battle.');
        window.location.href = '/login.html';
      }
    })
    .catch(error => console.error('Error fetching username:', error));

  // Load user stats from user.json
  function loadUserStats(username) {
    fetch('/js/json/user.json')
      .then(response => response.json())
      .then(users => {
        const user = users[username];
        if (user) {
          xpDisplay.textContent = user.xp;
          rankDisplay.textContent = user.rank;
          coinsDisplay.textContent = user.coins;
        } else {
          console.warn('User data not found');
        }
      })
      .catch(error => console.error('Error loading user stats:', error));
  }

  // Handle battle button click
  battleBtn.addEventListener('click', () => {
    battleBtn.disabled = true;
    battleResult.textContent = 'Battling...';

    fetch('/js/json/user.json')
      .then(response => response.json())
      .then(users => {
        const username = usernameDisplay.textContent;
        const user = users[username];
        if (!user) {
          throw new Error('User not found');
        }

        // Simulate battle (random outcome)
        const isWin = Math.random() > 0.3; // 70% chance to win
        let xpGain = 0;
        let coinGain = 0;

        if (isWin) {
          xpGain = Math.floor(Math.random() * 50) + 10; // 10-60 XP
          coinGain = Math.floor(Math.random() * 20) + 5; // 5-25 coins
          user.xp += xpGain;
          user.coins += coinGain;
          battleResult.textContent = `Victory! Gained ${xpGain} XP and ${coinGain} coins.`;
          battleResult.className = 'result win';
        } else {
          const xpLoss = Math.floor(Math.random() * 20) + 5; // 5-25 XP loss
          const coinLoss = Math.floor(Math.random() * 10) + 2; // 2-12 coins loss
          user.xp = Math.max(0, user.xp - xpLoss);
          user.coins = Math.max(0, user.coins - coinLoss);
          battleResult.textContent = `Defeat! Lost ${xpLoss} XP and ${coinLoss} coins.`;
          battleResult.className = 'result lose';
        }

        // Update user.json
        fetch('/js/json/user.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users)
        })
          .then(response => {
            if (response.ok) {
              loadUserStats(username); // Refresh stats
            } else {
              throw new Error('Failed to update user data');
            }
          })
          .catch(error => {
            console.error('Error updating user stats:', error);
            battleResult.textContent = 'Error updating battle result.';
            battleResult.className = 'result error';
          })
          .finally(() => {
            battleBtn.disabled = false;
          });
      })
      .catch(error => {
        console.error('Error during battle:', error);
        battleResult.textContent = 'Error initiating battle.';
        battleResult.className = 'result error';
        battleBtn.disabled = false;
      });
  });
});