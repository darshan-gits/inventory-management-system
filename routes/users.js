const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const pool = require('../config/db');
const logAction = require('../utils/auditLogger');

const {
  requireLogin,
  requireAdmin
} = require('../middleware/authMiddleware');


// =========================================
// GET ALL USERS
// ADMIN ONLY
// =========================================

router.get('/', requireLogin, requireAdmin, async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        id,
        username,
        role,
        created_at
      FROM users
      ORDER BY id ASC
    `);

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Database error'
    });

  }

});


// =========================================
// ADD NEW USER
// ADMIN ONLY
// =========================================

router.post('/', requireLogin, requireAdmin, async (req, res) => {

  try {

    const {
      username,
      password,
      role
    } = req.body;


    if (!username || !username.trim()) {

      return res.status(400).json({
        message: 'Username is required'
      });

    }


    if (!password || password.length < 6) {

      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });

    }


    if (!['admin', 'staff'].includes(role)) {

      return res.status(400).json({
        message: 'Invalid role'
      });

    }


    const cleanUsername = username.trim();


    // Check duplicate username

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [cleanUsername]
    );


    if (existing.length > 0) {

      return res.status(409).json({
        message: 'Username already exists'
      });

    }


    // Hash password

    const passwordHash = await bcrypt.hash(
      password,
      10
    );


    // Insert user

    const [result] = await pool.query(
      `
      INSERT INTO users
      (username, password_hash, role)
      VALUES (?, ?, ?)
      `,
      [
        cleanUsername,
        passwordHash,
        role
      ]
    );


    // Audit log

    await logAction(
      req.session.username,
      'CREATE',
      'users',
      result.insertId,
      `Added user: ${cleanUsername} (${role})`
    );


    res.json({
      message: 'User added successfully'
    });


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Database error'
    });

  }

});


// =========================================
// EDIT USER
// ADMIN ONLY
// =========================================

router.put('/:id', requireLogin, requireAdmin, async (req, res) => {

  try {

    const {
      username,
      role,
      password
    } = req.body;

    const userId = req.params.id;


    if (!username || !username.trim()) {

      return res.status(400).json({
        message: 'Username is required'
      });

    }


    if (!['admin', 'staff'].includes(role)) {

      return res.status(400).json({
        message: 'Invalid role'
      });

    }


    const cleanUsername = username.trim();


    // Get existing user

    const [oldUser] = await pool.query(
      `
      SELECT username, role
      FROM users
      WHERE id = ?
      `,
      [userId]
    );


    if (oldUser.length === 0) {

      return res.status(404).json({
        message: 'User not found'
      });

    }


    // Prevent duplicate username

    const [existing] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE username = ?
      AND id != ?
      `,
      [
        cleanUsername,
        userId
      ]
    );


    if (existing.length > 0) {

      return res.status(409).json({
        message: 'Username already exists'
      });

    }


    // Prevent removing the last admin

    if (
      oldUser[0].role === 'admin' &&
      role !== 'admin'
    ) {

      const [admins] = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'admin'
        `
      );


      if (admins[0].count <= 1) {

        return res.status(400).json({
          message: 'At least one admin account must remain'
        });

      }

    }


    // Update with new password

    if (password && password.trim()) {

      if (password.length < 6) {

        return res.status(400).json({
          message: 'Password must be at least 6 characters'
        });

      }


      const passwordHash = await bcrypt.hash(
        password,
        10
      );


      await pool.query(
        `
        UPDATE users
        SET username = ?,
            role = ?,
            password_hash = ?
        WHERE id = ?
        `,
        [
          cleanUsername,
          role,
          passwordHash,
          userId
        ]
      );

    } else {

      await pool.query(
        `
        UPDATE users
        SET username = ?,
            role = ?
        WHERE id = ?
        `,
        [
          cleanUsername,
          role,
          userId
        ]
      );

    }


    // Audit log

    await logAction(
      req.session.username,
      'UPDATE',
      'users',
      userId,
      `Updated user: ${oldUser[0].username} → ${cleanUsername}, role: ${oldUser[0].role} → ${role}`
    );


    res.json({
      message: 'User updated successfully'
    });


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Database error'
    });

  }

});


// =========================================
// DELETE USER
// ADMIN ONLY
// =========================================

router.delete('/:id', requireLogin, requireAdmin, async (req, res) => {

  try {

    const userId = req.params.id;


    // Prevent deleting own account

    if (
      Number(userId) ===
      Number(req.session.userId)
    ) {

      return res.status(400).json({
        message: 'You cannot delete your own account'
      });

    }


    // Get user before deleting

    const [users] = await pool.query(
      `
      SELECT username, role
      FROM users
      WHERE id = ?
      `,
      [userId]
    );


    if (users.length === 0) {

      return res.status(404).json({
        message: 'User not found'
      });

    }


    // Prevent deleting last admin

    if (users[0].role === 'admin') {

      const [admins] = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'admin'
        `
      );


      if (admins[0].count <= 1) {

        return res.status(400).json({
          message: 'At least one admin account must remain'
        });

      }

    }


    await pool.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );


    // Audit log

    await logAction(
      req.session.username,
      'DELETE',
      'users',
      userId,
      `Deleted user: ${users[0].username} (${users[0].role})`
    );


    res.json({
      message: 'User deleted successfully'
    });


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Database error'
    });

  }

});


module.exports = router;