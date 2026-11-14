const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const logAction = require('../utils/auditLogger');
const { requireAdmin } = require('../middleware/authMiddleware');


// =========================================
// GET ALL CATEGORIES
// =========================================

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories ORDER BY name'
    );

    res.json(rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Database error'
    });
  }
});


// =========================================
// ADD A NEW CATEGORY
// ADMIN ONLY
// =========================================

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Category name is required'
      });
    }

    const categoryName = name.trim();

    const [result] = await pool.query(
      'INSERT INTO categories (name) VALUES (?)',
      [categoryName]
    );

    await logAction(
      req.session.username,
      'CREATE',
      'categories',
      result.insertId,
      `Added category: ${categoryName}`
    );

    res.json({
      message: 'Category added successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Database error (name may already exist)'
    });
  }
});


// =========================================
// EDIT A CATEGORY
// ADMIN ONLY
// =========================================

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const categoryId = req.params.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Category name is required'
      });
    }

    const categoryName = name.trim();

    // Get old category name
    const [oldCategory] = await pool.query(
      'SELECT name FROM categories WHERE id = ?',
      [categoryId]
    );

    if (oldCategory.length === 0) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    const oldName = oldCategory[0].name;

    await pool.query(
      'UPDATE categories SET name = ? WHERE id = ?',
      [categoryName, categoryId]
    );

    await logAction(
      req.session.username,
      'UPDATE',
      'categories',
      categoryId,
      `Updated category: ${oldName} → ${categoryName}`
    );

    res.json({
      message: 'Category updated successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Database error (name may already exist)'
    });
  }
});


// =========================================
// DELETE A CATEGORY
// ADMIN ONLY
// =========================================

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Get category name before deleting
    const [category] = await pool.query(
      'SELECT name FROM categories WHERE id = ?',
      [categoryId]
    );

    if (category.length === 0) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    const categoryName = category[0].name;

    await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [categoryId]
    );

    await logAction(
      req.session.username,
      'DELETE',
      'categories',
      categoryId,
      `Deleted category: ${categoryName}`
    );

    res.json({
      message: 'Category deleted successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Database error'
    });
  }
});


module.exports = router;