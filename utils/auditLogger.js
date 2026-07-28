const pool = require('../config/db');

// Call this from any route to record an action.
// Example: logAction('admin', 'DELETE', 'products', 5, 'Deleted product: Laptop')
async function logAction(username, action, table_affected, record_id, details) {
  try {
    await pool.query(
      'INSERT INTO audit_log (username, action, table_affected, record_id, details) VALUES (?, ?, ?, ?, ?)',
      [username, action, table_affected, record_id, details]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // We intentionally don't throw here — a logging failure shouldn't break the actual feature
  }
}

module.exports = logAction;