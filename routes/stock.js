const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const logAction = require('../utils/auditLogger');

// ==========================================
// STOCK IN
// ==========================================
router.post('/in', async (req, res) => {
  const { product_id, quantity, reason } = req.body;
  const performed_by = req.session.username;

  try {
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Invalid product or quantity'
      });
    }

    // Check product
    const [products] = await pool.query(
      'SELECT id, name FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const productName = products[0].name;

    // Increase stock
    await pool.query(
      'UPDATE products SET quantity = quantity + ? WHERE id = ?',
      [quantity, product_id]
    );

    // Save stock movement
    await pool.query(
      `INSERT INTO stock_movements
      (product_id, type, quantity, reason, performed_by)
      VALUES (?, 'in', ?, ?, ?)`,
      [product_id, quantity, reason || 'Stock Added', performed_by]
    );

    // Audit log
    await logAction(
      performed_by,
      'STOCK IN',
      'products',
      product_id,
      `Added ${quantity} units to ${productName}`
    );

    res.json({
      message: 'Stock in recorded successfully'
    });

  } catch (err) {
    console.error('Stock In Error:', err);

    res.status(500).json({
      error: 'Database error'
    });
  }
});


// ==========================================
// STOCK OUT
// ==========================================
router.post('/out', async (req, res) => {
  const { product_id, quantity, reason } = req.body;
  const performed_by = req.session.username;

  try {
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Invalid product or quantity'
      });
    }

    // Check current stock
    const [rows] = await pool.query(
      'SELECT id, name, quantity FROM products WHERE id = ?',
      [product_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const currentStock = rows[0].quantity;
    const productName = rows[0].name;

    // Prevent negative stock
    if (quantity > currentStock) {
      return res.status(400).json({
        message: 'Not enough stock available'
      });
    }

    // Decrease stock
    await pool.query(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [quantity, product_id]
    );

    // Save stock movement
    await pool.query(
      `INSERT INTO stock_movements
      (product_id, type, quantity, reason, performed_by)
      VALUES (?, 'out', ?, ?, ?)`,
      [product_id, quantity, reason || 'Stock Removed', performed_by]
    );

    // Audit log
    await logAction(
      performed_by,
      'STOCK OUT',
      'products',
      product_id,
      `Removed ${quantity} units from ${productName}`
    );

    res.json({
      message: 'Stock out recorded successfully'
    });

  } catch (err) {
    console.error('Stock Out Error:', err);

    res.status(500).json({
      error: 'Database error'
    });
  }
});


// ==========================================
// STOCK MOVEMENT HISTORY
// ==========================================
router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        sm.id,
        p.name AS product_name,
        sm.type,
        sm.quantity,
        sm.reason,
        sm.performed_by,
        sm.created_at
      FROM stock_movements sm
      JOIN products p
        ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error('Stock History Error:', err);

    res.status(500).json({
      error: 'Database error'
    });
  }
});

module.exports = router;