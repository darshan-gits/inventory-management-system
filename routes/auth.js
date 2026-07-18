const express = require('express');
const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.json({ message: 'Login successful' });
  }

  res.status(401).json({ message: 'Invalid username or password' });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// Check current login status
router.get('/status', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

module.exports = router;