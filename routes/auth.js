const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Store user info in the session
    req.session.loggedIn = true;
    req.session.username = user.username;
    req.session.role = user.role; // 'admin' or 'staff'

    res.json({ message: 'Login successful', role: user.role });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// Check current login status
router.get('/status', (req, res) => {
  res.json({
    loggedIn: !!(req.session && req.session.loggedIn),
    role: req.session ? req.session.role : null
  });
});

module.exports = router;