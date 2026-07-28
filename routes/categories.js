const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Add a new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.json({ message: 'Category added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error (name may already exist)' });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;