const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, quantity, unit_price AS price, reorder_level FROM products'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ADD new product
router.post('/', async (req, res) => {
  try {
    const { name, quantity, price, reorder_level } = req.body;

    await pool.query(
      'INSERT INTO products (name, quantity, unit_price, reorder_level) VALUES (?, ?, ?, ?)',
      [name, quantity, price, reorder_level]
    );

    res.json({ message: 'Product added successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM products WHERE id = ?',
      [id]
    );

    res.json({ message: 'Product deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
// UPDATE product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, reorder_level } = req.body;

    await pool.query(
      `UPDATE products
       SET name=?, quantity=?, unit_price=?, reorder_level=?
       WHERE id=?`,
      [name, quantity, price, reorder_level, id]
    );

    res.json({ message: 'Product updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
module.exports = router;