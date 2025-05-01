document.addEventListener('DOMContentLoaded', async () => {
  const dashboard = document.getElementById('dashboard');
  const questList = document.getElementById('quest-list');
  const addQuestBtn = document.getElementById('add-quest');
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('close-modal');
  const saveQuestBtn = document.getElementById('save-quest');
  const newQuestName = document.getElementById('new-quest-name');
  const newQuestCategory = document.getElementById('new-quest-category');
  const newQuestMinutes = document.getElementById('new-quest-minutes');
  const searchBar = document.getElementById('search');
  const greeting = document.getElementById('greeting');
  const streak = document.getElementById('streak');
  const liveRanking = document.getElementById('live-ranking');
  const xpProgress = document.getElementById('xp-progress');
  const xpText = document.getElementById('xp-text');
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const profileBtn = document.getElementById('profile-btn');
  const notificationBtn = document.getElementById('notification-btn');
  const unseenCountEl = document.getElementById('unseen-count');
  const toast = document.getElementById('toast');
  const dailyGoal = document.getElementById('daily-goal');
  const dailyProgress = document.getElementById('daily-progress');
  const dailyReward = document.getElementById('daily-reward');
  const weeklyGoal = document.getElementById('weekly-goal');
  const weeklyProgress = document.getElementById('weekly-progress');
  const weeklyReward = document.getElementById('weekly-reward');

  if (!dashboard || !questList || !addQuestBtn || !modal || !closeModalBtn || !saveQuestBtn ||
      !newQuestName || !newQuestCategory || !newQuestMinutes || !searchBar || !greeting ||
      !streak || !liveRanking || !xpProgress || !xpText || !leaderboardBtn || !profileBtn ||
      !notificationBtn || !unseenCountEl || !toast || !dailyGoal || !dailyProgress ||
      !dailyReward || !weeklyGoal || !weeklyProgress || !weeklyReward) {
    console.error('One or more required DOM elements are missing!');
    return;
  }

  let user = null;
  let quests = [];
  let xp = 0;
  const XP_PER_MINUTE = 10; // 100 XP for 10 minutes = 10 XP per minute

  const rankThresholds = [
    { rank: 'E-Rank', xp: 0, badge: 'Novice Hunter' },
    { rank: 'D-Rank', xp: 1000, badge: 'Apprentice Hunter' },
    { rank: 'C-Rank', xp: 5000, badge: 'Skilled Hunter' },
    { rank: 'B-Rank', xp: 15000, badge: 'Elite Hunter' },
    { rank: 'A-Rank', xp: 40000, badge: 'Master Hunter' },
    { rank: 'S-Rank', xp: 100000, badge: 'Shadow Monarch' },
    { rank: 'SS-Rank', xp: 250000, badge: 'Legendary Hunter' },
    { rank: 'SS++-Rank', xp: 500000, badge: 'Supreme Sovereign' },
  ];

  function getRank(xp) {
    return rankThresholds.find(r => xp < (rankThresholds[rankThresholds.length - 1].xp || Infinity) && xp >= r.xp) || rankThresholds[0];
  }

  async function fetchUser(e) { e.preventDefault();
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

  async function fetchQuests() {
    if (!user || !user.username) {
      console.error('Cannot fetch quests: User not initialized');
      return [];
    }
    try {
      const response = await fetch('/js/json/task.json');
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('task.json not found, initializing empty');
          return [];
        }
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      return Array.isArray(data[user.username]?.tasks) ? data[user.username].tasks : [];
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      return [];
    }
  }

  async function saveQuests(questsData) {
    if (!user || !user.username) {
      console.error('Cannot save quests: User not initialized');
      return false;
    }
    try {
      const response = await fetch('/js/json/task.json');
      let data = {};
      if (response.ok) {
        data = await response.json();
      }
      data[user.username] = { tasks: questsData };
      const putResponse = await fetch('/js/json/task.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        throw new Error(`Failed to save tasks: ${putResponse.status} - ${errorText}`);
      }
      console.log('Tasks saved successfully to task.json');
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error.message);
      showToast('Failed to save task. Check server or permissions.');
      return false;
    }
  }

  async function saveUserData(userData) {
    if (!user || !user.username) {
      console.error('Cannot save user data: User not initialized');
      return;
    }
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
    } catch (error) {
      console.error('Error saving user data:', error.message);
    }
  }

  async function fetchUsersFromData() {
    try {
      const response = await fetch('/js/json/data.json');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return Array.isArray(data.leaderboard) ? data.leaderboard : [];
    } catch (error) {
      console.error('Error fetching users:', error.message);
      return [];
    }
  }

  async function getLiveRanking(user, allUsers) {
    const sortedUsers = Array.isArray(allUsers) ? allUsers.map(u => ({ ...u, xp: u.xp || 0 })).sort((a, b) => b.xp - a.xp) : [];
    const rank = sortedUsers.findIndex(u => u.username === user.username) + 1;
    return rank > 0 ? `Live Rank: #${rank}` : 'Live Rank: #1';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function getTimerDisplay(quest) {
    if (!quest.timerEnd || quest.completed) return 'Completed';
    const remaining = new Date(quest.timerEnd) - new Date();
    console.log(`Timer for ${quest.name}: ${remaining} ms`); // Debug log
    if (remaining <= 0) {
      if (!quest.completed) {
        quest.completed = true;
        xp += quest.xp;
        user.xp = xp;
        const rank = getRank(xp);
        user.rank = rank.rank;
        user.inventory = user.inventory || [];
        if (!user.inventory.includes(rank.badge)) {
          user.inventory.push(rank.badge);
          showToast(`Rank Up! You're now ${rank.rank} - ${rank.badge} unlocked!`);
        }
        saveQuests(quests).then(() => saveUserData(user));
        xpText.textContent = `${xp} / 100000 XP`;
        xpProgress.style.width = `${(xp / 100000) * 100}%`;
        showToast(`Quest Completed! +${quest.xp} XP`);
      }
      return 'Completed';
    }
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function updateTimerDisplay() {
    const timers = questList.querySelectorAll('.quest-timer');
    quests.forEach((quest, index) => {
      if (quest.timerEnd && !quest.completed) {
        const remaining = new Date(quest.timerEnd) - new Date();
        if (remaining <= 0) {
          if (!quest.completed) {
            quest.completed = true;
            xp += quest.xp;
            user.xp = xp;
            const rank = getRank(xp);
            user.rank = rank.rank;
            user.inventory = user.inventory || [];
            if (!user.inventory.includes(rank.badge)) {
              user.inventory.push(rank.badge);
              showToast(`Rank Up! You're now ${rank.rank} - ${rank.badge} unlocked!`);
            }
            saveQuests(quests).then(() => saveUserData(user));
            xpText.textContent = `${xp} / 100000 XP`;
            xpProgress.style.width = `${(xp / 100000) * 100}%`;
            showToast(`Quest Completed! +${quest.xp} XP`);
          }
          timers[index].textContent = 'Completed';
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          timers[index].textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
      }
    });
  }

  function renderQuests() {
    questList.innerHTML = '';
    const filteredQuests = quests.filter(q => q.name.toLowerCase().includes(searchBar.value.toLowerCase()));
    filteredQuests.forEach(quest => {
      const questItem = document.createElement('div');
      questItem.classList.add('quest-item');
      questItem.innerHTML = `
        <div class="quest-name">${quest.name}</div>
        <div class="quest-timer">${getTimerDisplay(quest)}</div>
        <button class="start-quest" data-id="${quest.id}">Start</button>
        <button class="delete-quest" data-id="${quest.id}">Delete</button>
      `;
      questList.appendChild(questItem);

      questItem.querySelector('.start-quest').addEventListener('click', () => startQuest(quest));
      questItem.querySelector('.delete-quest').addEventListener('click', () => deleteQuest(quest.id));
    });
  }

  async function startQuest(quest) {
    if (quest.started) return;
    quest.started = true;
    const now = new Date();
    const timerEnd = new Date(now.getTime() + quest.minutes * 60000); // Local time
    quest.timerEnd = timerEnd;
    quest.xp = quest.minutes * XP_PER_MINUTE; // 10 XP per minute
    console.log(`Started ${quest.name} - End Time: ${timerEnd}, XP: ${quest.xp}`); // Debug log
    await saveQuests(quests);
    renderQuests();
    showToast(`Started quest: ${quest.name}`);
  }

  async function deleteQuest(questId) {
    quests = quests.filter(q => q.id !== questId);
    await saveQuests(quests);
    renderQuests();
    showToast('Quest deleted');
  }

  // Event Listeners
  addQuestBtn.addEventListener('click', () => {
    if (!user) {
      showToast('Please log in to add quests.');
      return;
    }
    modal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  saveQuestBtn.addEventListener('click', async () => {
    const name = newQuestName.value.trim();
    const category = newQuestCategory.value;
    const minutes = parseInt(newQuestMinutes.value);

    if (!name || !category || isNaN(minutes) || minutes <= 0) {
      showToast('Please fill in all fields correctly');
      return;
    }

    const newQuest = {
      id: Date.now(),
      name,
      category,
      minutes,
      xp: minutes * XP_PER_MINUTE, // 10 XP per minute
      timerEnd: null,
      started: false,
      completed: false
    };

    quests.push(newQuest);
    await saveQuests(quests);
    renderQuests();
    modal.classList.add('hidden');
    newQuestName.value = '';
    newQuestCategory.value = '';
    newQuestMinutes.value = '';
    showToast('Quest added successfully');
  });

  searchBar.addEventListener('input', renderQuests);

  leaderboardBtn.addEventListener('click', () => {
    if (!user) {
      showToast('Please log in to view the leaderboard.');
      return;
    }
    window.location.href = '/leaderboard.html';
  });

  profileBtn.addEventListener('click', () => {
    if (!user) {
      showToast('Please log in to view your profile.');
      return;
    }
    window.location.href = '/profile.html';
  });

  notificationBtn.addEventListener('click', () => {
    if (!user) {
      showToast('Please log in to view notifications.');
      return;
    }
    window.location.href = '/notifications.html';
  });

  // Initialization
  user = await fetchUser();
  if (!user) {
    dashboard.innerHTML = `
      <h1 class="title">Rise, Hunter! <span>⚡</span></h1>
      <p style="color: #ff4d4d; font-size: 16px; margin: 20px 0;">
        You are not logged in. Please <a href="/" style="color: #00b7eb; text-decoration: underline;">log in</a> to continue.
      </p>
    `;
    return;
  }

  quests = await fetchQuests();
  xp = user.xp || 0;
  const users = await fetchUsersFromData();
  greeting.textContent = `Hello, ${user.username}`;
  streak.textContent = `Streak: ${user.streak || 0} days`;
  liveRanking.textContent = await getLiveRanking(user, users);
  xpText.textContent = `${xp} / 100000 XP`;
  xpProgress.style.width = `${(xp / 100000) * 100}%`;
  dailyGoal.textContent = 'Daily Goal: 500 XP';
  dailyProgress.textContent = '0 XP';
  dailyReward.textContent = '0 XP';
  weeklyGoal.textContent = 'Weekly Goal: 2000 XP';
  weeklyProgress.textContent = '0 XP';
  weeklyReward.textContent = '0 XP';
  renderQuests();

  // Update timer every second without full re-render
  setInterval(() => {
    updateTimerDisplay();
  }, 1000);
});
