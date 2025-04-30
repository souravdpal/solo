let ready = (async () => {
  let initialData = {};
  try {
    const dataResponse = await fetch('/js/json/data.json');
    if (dataResponse.ok) initialData = await dataResponse.json();
    else console.log('Failed to fetch /js/json/data.json, status:', dataResponse.status);
  } catch (e) {
    console.log('No /js/json/data.json found, starting fresh:', e.message);
  }

  try {
    const userResponse = await fetch('/js/json/user.json');
    if (userResponse.ok) {
      const userData = await userResponse.json();
      initialData.users = Array.isArray(userData) ? userData.reduce((acc, user) => ({ ...acc, [user.username]: user }), {}) : userData;
    } else console.log('Failed to fetch /js/json/user.json, status:', userResponse.status);
  } catch (e) {
    console.log('No /js/json/user.json found, starting fresh:', e.message);
  }

  let data = JSON.parse(localStorage.getItem('data')) || {
    users: initialData.users || {},
    quests: initialData.quests || {},
    leaderboard: initialData.leaderboard || [],
    teams: initialData.teams || {},
    shop: initialData.shop || [],
    battles: initialData.battles || { defeated: [] },
    inventory: initialData.inventory || {},
    global: {
      lastReset: initialData.global?.lastReset || new Date().toISOString().split('T')[0],
      dailyXP: initialData.global?.dailyXP || 0,
      streak: initialData.global?.streak || 0,
      notifications: initialData.global?.notifications || []
    }
  };

  localStorage.setItem('data', JSON.stringify(data));

  window.saveUserData = async function(user) {
    data.users[user.username] = user;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getUserData = async function() {
    const username = localStorage.getItem('loggedInUser');
    if (!username || !data.users[username]) {
      console.log('No logged-in user found');
      return null;
    }
    return data.users[username];
  };

  window.getAllUsers = async function() {
    return Object.values(data.users || {});
  };

  window.saveQuests = async function(quests, username) {
    data.quests[username] = quests;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getQuests = async function(username) {
    return data.quests[username] || [];
  };

  window.saveLeaderboard = async function(leaderboard) {
    data.leaderboard = leaderboard;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getLeaderboard = async function() {
    return data.leaderboard;
  };

  window.saveTeams = async function(teams) {
    data.teams = teams;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getTeams = async function() {
    return data.teams || {};
  };

  window.saveShop = async function(shop) {
    data.shop = shop;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getShop = async function() {
    if (!data.shop.length) {
      data.shop = [
        { id: 1, name: 'XP Boost', cost: 100, effect: '+100 XP', category: 'boost' },
        { id: 2, name: 'Health Potion', cost: 150, effect: '+50 HP', category: 'boost' },
        { id: 3, name: 'Shadow Cloak', cost: 200, effect: 'Cosmetic', category: 'cosmetic' },
        { id: 4, name: 'Double XP', cost: 300, effect: 'Skill Unlock', category: 'skill' }
      ];
      localStorage.setItem('data', JSON.stringify(data));
    }
    return data.shop;
  };

  window.saveBattles = async function(battles) {
    data.battles = battles;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getBattles = async function() {
    return data.battles;
  };

  window.saveInventory = async function(inventory) {
    data.inventory = inventory;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getInventory = async function() {
    return data.inventory;
  };

  window.saveLastReset = async function(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format');
    data.global.lastReset = date;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getLastReset = async function() {
    return data.global.lastReset;
  };

  window.saveDailyXP = async function(xp) {
    data.global.dailyXP = xp;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getDailyXP = async function() {
    return data.global.dailyXP || 0;
  };

  window.saveStreak = async function(streak) {
    data.global.streak = streak;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getStreak = async function() {
    return data.global.streak || 0;
  };

  window.saveNotifications = async function(notifications) {
    data.global.notifications = notifications;
    localStorage.setItem('data', JSON.stringify(data));
  };

  window.getNotifications = async function() {
    return data.global.notifications || [];
  };

  window.storageReady = ready;
})();