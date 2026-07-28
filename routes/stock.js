const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// STOCK IN — increases quantity, logs the movement
router.post('/in', async (req, res) => {
  const { product_id, quantity, reason } = req.body;
  const performed_by = req.session.username;

  try {
    // Update the product's quantity
    await pool.query(
      'UPDATE products SET quantity = quantity + ? WHERE id = ?',
      [quantity, product_id]
    );

    // Log the movement
    await pool.query(
      'INSERT INTO stock_movements (product_id, type, quantity, reason, performed_by) VALUES (?, "in", ?, ?, ?)',
      [product_id, quantity, reason, performed_by]
    );

    res.json({ message: 'Stock in recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// STOCK OUT — decreases quantity, logs the movement
router.post('/out', async (req, res) => {
  const { product_id, quantity, reason } = req.body;
  const performed_by = req.session.username;

  try {
    // Check current stock first, so we never go negative
    const [rows] = await pool.query('SELECT quantity FROM products WHERE id = ?', [product_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (rows[0].quantity < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    await pool.query(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [quantity, product_id]
    );

    await pool.query(
      'INSERT INTO stock_movements (product_id, type, quantity, reason, performed_by) VALUES (?, "out", ?, ?, ?)',
      [product_id, quantity, reason, performed_by]
    );

    res.json({ message: 'Stock out recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET movement history (for a report/log view)
router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sm.id, p.name AS product_name, sm.type, sm.quantity, sm.reason, sm.performed_by, sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;