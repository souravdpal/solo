const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'sourav-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve dashboard.html on root
app.get('/', (req, res) => {
  console.log('Accessing root route, session:', req.session);
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Get session username with detailed logging
app.get('/api/get-session-username', (req, res) => {
  console.log('Session on /api/get-session-username:', req.session);
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'No user logged in', sessionId: req.sessionID });
  }
});

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password, country } = req.body;
  const userFilePath = path.join(__dirname, 'js/json/user.json');

  if (!username || !password || !country) {
    return res.status(400).send('All fields (username, password, country) are required');
  }

  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading user.json: ${err.message}`);
      return res.status(500).send('Server error');
    }

    let users = {};
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      console.warn(`user.json is empty or invalid, initializing new: ${parseErr.message}`);
      users = {};
    }

    if (users[username]) {
      return res.status(400).send('Username already exists');
    }

    const userData = {
      username,
      country,
      password,
      xp: 0,
      rank: 'E-Rank',
      inventory: ['Novice Hunter'],
      achievements: [],
      coins: 100,
      skin: 'default'
    };

    users[username] = userData;

    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (writeErr) => {
      if (writeErr) {
        console.error(`Error writing user.json: ${writeErr.message}`);
        return res.status(500).send('Server error');
      }
      console.log(`Successfully wrote user ${username} to user.json`);
      updateLeaderboard(username, country);
      req.session.authorized = true;
      req.session.username = username;
      console.log(`Session set after register:`, req.session);
      res.redirect('/quests.html');
    });
  });
});

// Emoji Signup endpoint with country name conversion
app.post('/signup-emoji', (req, res) => {
  const { username, password, country } = req.body;
  const userFilePath = path.join(__dirname, 'js/json/user.json');
  const dataFilePath = path.join(__dirname, 'js/json/data.json');

  console.log('Received request body:', req.body);

  if (!username || !password || !country) {
    return res.status(400).send('All fields (username, password, country) are required');
  }

  const countryMap = {
    '\ud83c\uddfa\ud83c\uddf8': 'united states',
    '\ud83c\uddee\ud83c\uddf3': 'india',
    '\ud83c\uddec\ud83c\udde7': 'united kingdom',
    '\ud83c\uddef\ud83c\uddf5': 'japan',
    '\ud83c\uddf0\ud83c\uddf7': 'south korea',
    '\ud83c\udde8\ud83c\uddf3': 'china',
    '\ud83c\uddeb\ud83c\uddf7': 'france',
    '\ud83c\udde9\ud83c\uddea': 'germany',
    '\ud83c\udde8\ud83c\udde6': 'canada',
    '\ud83c\udde6\ud83c\uddfa': 'australia',
    '\ud83c\uddf9\ud83c\udde8': 'turks and caicos islands',
    '\ud83c\uddf9\ud83c\udde9': 'chad',
    '\ud83c\uddf9\ud83c\uddec': 'togo',
    '\ud83c\uddf9\ud83c\udded': 'thailand',
    '\ud83c\uddf9\ud83c\uddef': 'tajikistan',
    '\ud83c\uddf9\ud83c\uddf0': 'tokelau',
    '\ud83c\uddf9\ud83c\uddf2': 'turkmenistan',
    '\ud83c\uddf9\ud83c\uddf1': 'timor-leste',
    '\ud83c\uddf9\ud83c\uddf4': 'tonga',
    '\ud83c\uddf9\ud83c\uddf9': 'trinidad and tobago',
    '\ud83c\uddf9\ud83c\uddf3': 'tunisia',
    '\ud83c\uddf9\ud83c\uddf7': 'turkey',
    '\ud83c\uddf9\ud83c\uddfb': 'tuvalu',
    '\ud83c\uddf9\ud83c\uddfc': 'taiwan'
  };

  const unescapedCountry = country.replace(/\\u([\dA-Fa-f]{4})/g, (_, group) => String.fromCharCode(parseInt(group, 16)));
  console.log(`Received country: ${country}, Unescaped: ${unescapedCountry}`);

  const countryName = countryMap[unescapedCountry] || unescapedCountry;
  console.log(`Converted country: ${countryName}`);

  fs.readFile(userFilePath, 'utf8', (err, fileData) => {
    if (err) {
      console.error(`Error reading user.json: ${err.message}`);
      return res.status(500).send('Server error');
    }

    let users = {};
    try {
      users = JSON.parse(fileData);
    } catch (parseErr) {
      console.warn(`user.json is empty or invalid, initializing new: ${parseErr.message}`);
      users = {};
    }

    if (users[username]) {
      return res.status(400).send('Username already exists');
    }

    const newUserData = {
      username,
      country: countryName,
      password,
      xp: 0,
      rank: 'E-Rank',
      inventory: ['Novice Hunter'],
      achievements: [],
      coins: 100,
      skin: 'default'
    };

    users[username] = newUserData;

    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (writeErr) => {
      if (writeErr) {
        console.error(`Error writing user.json: ${writeErr.message}`);
        return res.status(500).send('Server error');
      }
      console.log(`Successfully wrote user ${username} to user.json`);
      updateLeaderboard(username, countryName);
      req.session.authorized = true;
      req.session.username = username;
      console.log(`Session set after signup:`, req.session);
      res.redirect('/quests.html');
    });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const userFilePath = path.join(__dirname, 'js/json/user.json');

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading user.json: ${err.message}`);
      return res.status(500).send('Server error');
    }

    let users = {};
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      console.error(`Error parsing user.json: ${parseErr.message}`);
      return res.status(500).send('Server error');
    }

    const user = users[username];
    if (!user || user.password !== password) {
      console.log(`Login failed for ${username}: Invalid credentials`);
      return res.status(401).send('Invalid username or password');
    }

    console.log(`Login successful for ${username}`);
    req.session.authorized = true;
    req.session.username = username;
    console.log(`Session set after login:`, req.session);
    res.redirect('/quests.html');
  });
});

// Middleware to protect authenticated pages
const requireAuth = (req, res, next) => {
  console.log('Checking auth for route:', req.path, 'Session:', req.session);
  if (req.session.authorized && req.session.username) {
    next();
  } else {
    res.redirect('/');
  }
};

app.get('/quests.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'quests.html'));
});
app.get('/notifications.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'notifications.html'));
});
app.get('/profile.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});



app.get('/shop.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "shop.html"));
});
// In server.js, within the requireAuth middleware section
app.get('/leaderboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'leaderboard.html'));
});
// In server.js, within the requireAuth middleware section
app.get('/battle.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'battle.html'));
});

app.get('/team.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'team.html'));
});

app.get('/shop.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

app.get('/skills.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'skills.html'));
});

// GET JSON
app.get('/js/json/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'js/json', file);
  if (!fs.existsSync(filePath)) {
    console.log(`${file} not found, creating empty file`);
    fs.writeFileSync(filePath, JSON.stringify({}), 'utf8');
    return res.json({});
  }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${filePath}: ${err.message}`);
      return res.status(500).send('Error reading file');
    }
    try {
      res.json(JSON.parse(data) || {});
    } catch (parseErr) {
      console.error(`Error parsing ${filePath}: ${parseErr.message}`);
      res.status(500).send('Error parsing JSON');
    }
  });
});

// PUT JSON
app.put('/js/json/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'js/json', file);
  if (!fs.existsSync(filePath)) {
    console.error(`JSON file not found: ${filePath}`);
    return res.status(404).send('File not found');
  }
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), err => {
    if (err) {
      console.error(`Error writing to ${filePath}: ${err.message}`);
      return res.status(500).send('Server error');
    }
    console.log(`Successfully wrote to ${filePath}`);
    res.send('Success');
  });
});

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err.message);
      return res.status(500).send('Server error');
    }
    console.log('Session destroyed, redirected to dashboard');
    res.redirect('/');
  });
});

// Helper function to update leaderboard
function updateLeaderboard(username, country) {
  const dataFilePath = path.join(__dirname, 'js/json/data.json');
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    let leaderboardData = { leaderboard: [] };
    try {
      const parsedData = JSON.parse(data);
      console.log('Parsed data.json:', parsedData); // Debug log
      // Only use the leaderboard array, discard other keys
      if (parsedData && Array.isArray(parsedData.leaderboard)) {
        leaderboardData.leaderboard = parsedData.leaderboard;
      } else {
        console.warn('leaderboard key missing or not an array, initializing new array');
        leaderboardData = { leaderboard: [] };
      }
    } catch (parseErr) {
      console.warn(`data.json is empty or invalid, initializing new: ${parseErr.message}`);
      leaderboardData = { leaderboard: [] };
    }

    console.log('Before update, leaderboardData:', leaderboardData); // Debug log

    // Check for duplicate usernames in leaderboard
    const existingUserIndex = leaderboardData.leaderboard.findIndex(user => user.username === username);
    if (existingUserIndex === -1) {
      leaderboardData.leaderboard.push({ username, xp: 0, country, coins: 100 });
    } else {
      console.log(`User ${username} already exists in leaderboard at index ${existingUserIndex}`);
    }

    console.log('After update, leaderboardData:', leaderboardData); // Debug log

    // Write only the leaderboard data, ensuring no other keys persist
    fs.writeFile(dataFilePath, JSON.stringify({ leaderboard: leaderboardData.leaderboard }, null, 2), (writeErr) => {
      if (writeErr) {
        console.error(`Error writing data.json: ${writeErr.message}`);
      } else {
        console.log(`Updated leaderboard with ${username}`);
      }
    });
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));