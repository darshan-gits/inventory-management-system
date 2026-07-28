const logAction = require('../utils/auditLogger');
const { requireAdmin } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// GET all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
          p.id,
          p.name,
          p.quantity,
          p.unit_price AS price,
          p.reorder_level,
          p.category_id,
          p.image,
          c.name AS category_name
      FROM products p
      LEFT JOIN categories c
      ON p.category_id = c.id
`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ADD new product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, quantity, price, reorder_level, category_id } = req.body;
    const image = req.file ? req.file.filename : null;
    
    console.log("req.body:", req.body);
console.log("req.file:", req.file);

   await pool.query(
  'INSERT INTO products (name, quantity, unit_price, reorder_level, category_id, image) VALUES (?, ?, ?, ?, ?, ?)',
  [
    name,
    quantity,
    price,
    reorder_level,
    category_id || null,
    image
  ]
);

    await logAction(req.session.username, 'CREATE', 'products', null, `Added product: ${name}`);

    res.json({ message: 'Product added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
// DELETE product
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    await logAction(req.session.username, 'DELETE', 'products', id, `Deleted product ID ${id}`);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
// UPDATE product
// UPDATE PRODUCT
router.put('/:id', upload.single('image'), async (req, res) => {

  try {

    const { id } = req.params;

    const {
      name,
      quantity,
      price,
      reorder_level,
      category_id
    } = req.body;

    // Get current image
    const [oldProduct] = await pool.query(
      'SELECT image FROM products WHERE id=?',
      [id]
    );

    let imageName = oldProduct[0].image;

    // New image uploaded
    if (req.file) {

      // Delete old image
      if (imageName) {

        const oldPath = path.join(
          __dirname,
          '../public/uploads',
          imageName
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }

      }

      imageName = req.file.filename;

    }

    await pool.query(
      `UPDATE products
       SET
         name=?,
         quantity=?,
         unit_price=?,
         reorder_level=?,
         category_id=?,
         image=?
       WHERE id=?`,
      [
        name,
        quantity,
        price,
        reorder_level,
        category_id || null,
        imageName,
        id
      ]
    );

    await logAction(
      req.session.username,
      'UPDATE',
      'products',
      id,
      `Updated product: ${name}`
    );

    res.json({
      message: 'Product updated successfully'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Database error'
    });

  }

});
   // ==============================
// Stock In
// ==============================
router.put('/:id/stockin', async (req, res) => {

  try {

    const { quantity } = req.body;
    const productId = req.params.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Invalid quantity'
      });
    }

    // Increase product quantity
    await pool.query(
      'UPDATE products SET quantity = quantity + ? WHERE id = ?',
      [quantity, productId]
    );

    // Save history
    await pool.query(
      `INSERT INTO stock_history
      (product_id, quantity, type, remarks)
      VALUES (?, ?, 'IN', 'Stock Added')`,
      [productId, quantity]
    );

    // Get product name
    const [product] = await pool.query(
      'SELECT name FROM products WHERE id = ?',
      [productId]
    );

    // Save audit log
    await logAction(
      req.session.username,
      'STOCK IN',
      'products',
      productId,
      `Added ${quantity} units to ${product[0].name}`
    );

    res.json({
      message: 'Stock added successfully!'
    });

  } catch (err) {

    console.error('Stock In Error:', err);

    res.status(500).json({
      message: err.message
    });

  }

});
// Stock Out
router.put('/:id/stockout', async (req, res) => {

  try {

    const { quantity } = req.body;
    const productId = req.params.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Invalid quantity'
      });
    }

    // Check current stock
    const [rows] = await pool.query(
      'SELECT quantity, name FROM products WHERE id = ?',
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const currentStock = rows[0].quantity;

    if (quantity > currentStock) {
      return res.status(400).json({
        message: 'Insufficient Stock'
      });
    }

    // Reduce stock
    await pool.query(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [quantity, productId]
    );

    // Save history
    await pool.query(
      `INSERT INTO stock_history
      (product_id, quantity, type, remarks)
      VALUES (?, ?, 'OUT', 'Stock Removed')`,
      [productId, quantity]
    );

    // Save audit log
    await logAction(
      req.session.username,
      'STOCK OUT',
      'products',
      productId,
      `Removed ${quantity} units from ${rows[0].name}`
    );

    res.json({
      message: 'Stock removed successfully!'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Server Error'
    });

  }

});
module.exports = router;