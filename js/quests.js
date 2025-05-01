document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements (unchanged)
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

  // Validate DOM elements (unchanged)
  const requiredElements = {
    dashboard, questList, addQuestBtn, modal, closeModalBtn, saveQuestBtn,
    newQuestName, newQuestCategory, newQuestMinutes, searchBar, greeting,
    streak, liveRanking, xpProgress, xpText, leaderboardBtn, profileBtn,
    notificationBtn, unseenCountEl, toast, dailyGoal, dailyProgress,
    dailyReward, weeklyGoal, weeklyProgress, weeklyReward
  };
  for (const [id, element] of Object.entries(requiredElements)) {
    if (!element) {
      console.error(`Missing DOM element: ${id}`);
      return;
    }
  }

  let user = null;
  let quests = [];
  let xp = 0;
  const XP_PER_MINUTE = 10;

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

  // Fetch user with retry logic (unchanged)
  async function fetchUser(maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const sessionResponse = await fetch('/api/get-session-username', { credentials: 'include' });
        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          throw new Error(errorData.error || `Failed to fetch session (Attempt ${attempt})`);
        }
        const { username } = await sessionResponse.json();
        if (!username) throw new Error('No username in session');

        const userResponse = await fetch('/js/json/user.json', { credentials: 'include' });
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const data = await userResponse.json();
        const userData = data[username];
        if (!userData) throw new Error('User not found');
        console.log('User fetched successfully:', username);
        return userData;
      } catch (error) {
        console.warn(`Fetch user attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) {
          console.error('Max retries reached for fetching user:', error.message);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // Fetch quests (unchanged)
  async function fetchQuests() {
    if (!user || !user.username) {
      console.error('Cannot fetch quests: User not initialized');
      return [];
    }
    try {
      const response = await fetch('/js/json/task.json', { credentials: 'include' });
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

  // Save quests (unchanged)
  async function saveQuests(questsData) {
    if (!user || !user.username) {
      console.error('Cannot save quests: User not initialized');
      return false;
    }
    try {
      const response = await fetch('/js/json/task.json', { credentials: 'include' });
      let data = {};
      if (response.ok) data = await response.json();
      data[user.username] = { tasks: questsData };
      const putResponse = await fetch('/js/json/task.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!putResponse.ok) throw new Error(`Failed to save tasks: ${putResponse.status}`);
      console.log('Tasks saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error.message);
      showToast('Failed to save task. Check server or permissions.');
      return false;
    }
  }

  // Save user data (unchanged)
  async function saveUserData(userData) {
    if (!user || !user.username) return;
    try {
      const response = await fetch('/js/json/user.json', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user.json');
      const data = await response.json();
      data[user.username] = userData;
      const putResponse = await fetch('/js/json/user.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!putResponse.ok) throw new Error('Failed to save user data');
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error.message);
    }
  }

  // Fetch leaderboard data (unchanged)
  async function fetchUsersFromData() {
    try {
      const response = await fetch('/js/json/data.json', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return Array.isArray(data.leaderboard) ? data.leaderboard : [];
    } catch (error) {
      console.error('Error fetching users:', error.message);
      return [];
    }
  }

  // Get live ranking (unchanged)
  async function getLiveRanking(user, allUsers) {
    const sortedUsers = Array.isArray(allUsers) ? allUsers.map(u => ({ ...u, xp: u.xp || 0 })).sort((a, b) => b.xp - a.xp) : [];
    const rank = sortedUsers.findIndex(u => u.username === user.username) + 1;
    return rank > 0 ? `Live Rank: #${rank}` : 'Live Rank: #1';
  }

  // Toast notification (unchanged)
  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  // Get timer display
  function getTimerDisplay(quest) {
    if (!quest.timerEnd || quest.completed) return 'Completed';
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
        updateDashboard(quest); // Pass the completed quest
      }
      return 'Completed';
    }
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // Update timer display
  function updateTimerDisplay() {
    console.log('Updating timer display...'); // Debug log
    const timers = questList.querySelectorAll('.quest-timer');
    quests.forEach((quest, index) => {
      if (quest.timerEnd && !quest.completed) {
        const remaining = new Date(quest.timerEnd) - new Date();
        console.log(`Quest: ${quest.name}, Remaining: ${remaining}ms`); // Debug log
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
            updateDashboard(quest); // Pass the completed quest
          }
          if (timers[index]) {
            timers[index].textContent = 'Completed';
          }
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          if (timers[index]) {
            timers[index].textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          }
        }
      }
    });
  }

  // Update dashboard stats with quest parameter
  function updateDashboard(completedQuest = null) {
    console.log('Updating dashboard, XP:', xp); // Debug log
    const rank = getRank(xp);
    xpText.textContent = `${xp} / 100000 XP`;
    xpProgress.style.width = `${(xp / 100000) * 100}%`;
    dailyGoal.textContent = 'Daily Goal: 500 XP';
    dailyProgress.textContent = `${Math.min(xp, 500)} XP`;
    dailyReward.textContent = xp >= 500 ? '50 Coins' : '0 Coins';
    weeklyGoal.textContent = 'Weekly Goal: 2000 XP';
    weeklyProgress.textContent = `${Math.min(xp, 2000)} XP`;
    weeklyReward.textContent = xp >= 2000 ? '200 Coins' : '0 Coins';
    if (completedQuest && completedQuest.xp) {
      showToast(`Quest Completed! +${completedQuest.xp} XP`);
    }
  }

  // Render quests
  function renderQuests() {
    console.log('Rendering quests:', quests); // Debug log
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

  // Start quest
  async function startQuest(quest) {
    if (quest.started) return;
    quest.started = true;
    const now = new Date();
    const timerEnd = new Date(now.getTime() + quest.minutes * 60000);
    quest.timerEnd = timerEnd;
    quest.xp = quest.minutes * XP_PER_MINUTE;
    console.log(`Started ${quest.name} - End Time: ${timerEnd}, XP: ${quest.xp}`);
    await saveQuests(quests);
    renderQuests();
    showToast(`Started quest: ${quest.name}`);
  }

  // Delete quest
  async function deleteQuest(questId) {
    quests = quests.filter(q => q.id !== questId);
    await saveQuests(quests);
    renderQuests();
    showToast('Quest deleted');
  }

  // Event Listeners (unchanged)
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
      xp: minutes * XP_PER_MINUTE,
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
        You are not logged in. Please <a href="/login.html" style="color: #00b7eb; text-decoration: underline;">log in</a> to continue.
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
  updateDashboard(); // Initial dashboard update without quest
  renderQuests();

  // Update timer every second
  setInterval(updateTimerDisplay, 1000);
});