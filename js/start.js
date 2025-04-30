document.getElementById('start-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const goal = document.getElementById('goal').value;
  const startTime = document.getElementById('start-time').value;

  const leaderboard = getLeaderboard() || [];
  if (leaderboard.some((p) => p.username.toLowerCase() === username.toLowerCase())) {
    showToast('Username taken! Choose another.');
    return;
  }

  saveUserData({
    username,
    goal,
    startTime,
    xp: 0,
    rank: 'E-Rank',
    streak: 0,
    lastActive: new Date().toISOString().split('T')[0],
  });
  saveDailyXP(new Date().toISOString().split('T')[0], 0);
  showToast(`Welcome, ${username}! Your quest begins: ${goal}`);
  setTimeout(() => (window.location.href = 'quests.html'), 1000);
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}