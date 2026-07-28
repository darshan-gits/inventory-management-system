// Run this ONCE with: node createUsers.js
// It creates one admin and one staff user with hashed passwords.
// After running it successfully, you can delete this file (or keep it for reference).

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

async function createUsers() {
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'staff1', password: 'staff123', role: 'staff' }
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10); // 10 = hashing strength
    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [user.username, hash, user.role]
    );
    console.log(`Created user: ${user.username} (${user.role})`);
  }

  process.exit();
}

createUsers();