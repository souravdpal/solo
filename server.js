const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Optional: Redis for persistent session storage (uncomment if using Redis)
// const RedisStore = require('connect-redis')(session);
// const redis = require('redis');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Configure session store based on environment
let sessionStore;
if (isProduction) {
  // Use in-memory store for Render (temporary solution for free tier)
  sessionStore = new session.MemoryStore();
  console.log('Using in-memory session store for production');
  // Uncomment to use Redis in production (recommended for persistence)
  /*
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.on('error', (err) => console.error('Redis error:', err));
  sessionStore = new RedisStore({ client: redisClient });
  console.log('Using Redis session store for production');
  */
} else {
  // Use SQLite for local development
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'session.sqlite')
  });
  sessionStore = new SequelizeStore({
    db: sequelize
  });
  sessionStore.sync();
  console.log('Using SQLite session store for development');
}

// Session setup with cookies
app.use(session({
  secret: process.env.SESSION_SECRET || 'sourav-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: isProduction, // True for HTTPS on Render, false for local HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Prevent CSRF
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

// Initialize JSON files if they don't exist
const userFilePath = path.join(__dirname, 'js/json/user.json');
const notifFilePath = path.join(__dirname, 'js/json/notifications.json');
const taskFilePath = path.join(__dirname, 'js/json/task.json');
const dataFilePath = path.join(__dirname, 'js/json/data.json');

// Ensure directories exist
const jsonDir = path.join(__dirname, 'js/json');
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
  console.log('Created js/json directory');
}

// Initialize files
if (!fs.existsSync(userFilePath)) {
  fs.writeFileSync(userFilePath, JSON.stringify({}, null, 2), 'utf8');
  console.log('Initialized user.json');
}
if (!fs.existsSync(notifFilePath)) {
  fs.writeFileSync(notifFilePath, JSON.stringify({ notifications: [] }, null, 2), 'utf8');
  console.log('Initialized notifications.json');
}
if (!fs.existsSync(taskFilePath)) {
  fs.writeFileSync(taskFilePath, JSON.stringify({}, null, 2), 'utf8');
  console.log('Initialized task.json');
}
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify({ leaderboard: [] }, null, 2), 'utf8');
  console.log('Initialized data.json');
}

// Define requireAuth middleware
const requireAuth = (req, res, next) => {
  console.log('Checking auth for:', req.path, 'Session:', {
    authorized: req.session.authorized,
    username: req.session.username,
    sessionId: req.session.id
  });
  if (req.session.authorized && req.session.username) {
    next();
  } else {
    console.warn('Unauthorized, redirecting to /login.html. Session:', req.session);
    res.redirect('/login.html');
  }
};

// Routes for HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/quests.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'quests.html')));
app.get('/notifications.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'notifications.html')));
app.get('/profile.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/shop.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'shop.html')));
app.get('/leaderboard.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'leaderboard.html')));
app.get('/battle.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'battle.html')));
app.get('/team.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'team.html')));
app.get('/skills.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'skills.html')));

// Get session username
app.get('/api/get-session-username', (req, res) => {
  console.log('Session check:', {
    sessionId: req.session.id,
    username: req.session.username,
    authorized: req.session.authorized
  });
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'No user logged in', sessionId: req.session.id });
  }
});

const hashMD5 = (password) => crypto.createHash('md5').update(password).digest('hex');
const hashSHA256 = (password) => crypto.createHash('sha256').update(password).digest('hex');

app.post('/register', (req, res) => {
  const { username, password, country } = req.body;

  if (!username || !password || !country) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading user.json:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    let users = {};
    try {
      users = JSON.parse(data) || {};
    } catch (parseErr) {
      console.warn('Invalid user.json, initializing:', parseErr.message);
      users = {};
    }
    if (users[username]) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = hashSHA256(password);
    users[username] = {
      username, country, password: hashedPassword, xp: 0, rank: 'E-Rank',
      inventory: ['Novice Hunter'], achievements: [], coins: 100, skin: 'default', team: []
    };
    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing user.json:', writeErr.message);
        return res.status(500).json({ error: 'Server error' });
      }
      req.session.username = username;
      req.session.authorized = true;
      console.log('Session after register:', {
        sessionId: req.session.id,
        username: req.session.username,
        authorized: req.session.authorized
      });
      res.json({ success: true });
    });
  });
});

app.post('/signup-emoji', (req, res) => {
  const { username, password, country } = req.body;

  if (!username || !password || !country) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const countryMap = {
    '🇺🇸': 'united states', '🇮🇳': 'india', '🇬🇧': 'united kingdom',
    '🇯🇵': 'japan', '🇰🇷': 'south korea', '🇨🇳': 'china',
    '🇫🇷': 'france', '🇩🇪': 'germany', '🇨🇦': 'canada', '🇦🇺': 'australia'
  };
  const countryName = countryMap[country] || country;

  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading user.json:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    let users = {};
    try {
      users = JSON.parse(data) || {};
    } catch (parseErr) {
      console.warn('Invalid user.json, initializing:', parseErr.message);
      users = {};
    }
    if (users[username]) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = hashSHA256(password);
    users[username] = {
      username, country: countryName, password: hashedPassword, xp: 0, rank: 'E-Rank',
      inventory: ['Novice Hunter'], achievements: [], coins: 100, skin: 'default', team: []
    };
    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing user.json:', writeErr.message);
        return res.status(500).json({ error: 'Server error' });
      }
      req.session.username = username;
      req.session.authorized = true;
      console.log('Session after signup:', {
        sessionId: req.session.id,
        username: req.session.username,
        authorized: req.session.authorized
      });
      res.json({ success: true });
    });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading user.json:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    let users = {};
    try {
      users = JSON.parse(data) || {};
    } catch (parseErr) {
      console.error('Error parsing user.json:', parseErr.message);
      return res.status(500).json({ error: 'Server error' });
    }
    const user = users[username];
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const md5Hash = hashMD5(password);
    const sha256Hash = hashSHA256(password);
    if (user.password !== md5Hash && user.password !== sha256Hash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.username = username;
    req.session.authorized = true;
    console.log('Session after login:', {
      sessionId: req.session.id,
      username: req.session.username,
      authorized: req.session.authorized
    });
    res.json({ success: true });
  });
});

app.get('/notifications.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'notifications.html')));
app.get('/profile.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/shop.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'shop.html')));
app.get('/leaderboard.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'leaderboard.html')));
app.get('/battle.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'battle.html')));
app.get('/team.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'team.html')));
app.get('/skills.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'skills.html')));

app.get('/js/json/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'js/json', file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}), 'utf8');
    return res.json({});
  }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading', filePath, ':', err.message);
      return res.status(500).send('Error reading file');
    }
    try {
      res.json(JSON.parse(data) || {});
    } catch (parseErr) {
      console.error('Error parsing', filePath, ':', parseErr.message);
      res.status(500).send('Error parsing JSON');
    }
  });
});

app.put('/js/json/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'js/json', file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
    if (err) {
      console.error('Error writing to', filePath, ':', err.message);
      return res.status(500).send('Server error');
    }
    res.send('Success');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err.message);
      return res.status(500).send('Server error');
    }
    console.log('Session destroyed, redirecting to /login.html');
    res.clearCookie('connect.sid');
    res.redirect('/login.html');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));