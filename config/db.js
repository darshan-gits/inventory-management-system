// This file sets up ONE connection pool to MySQL that the rest of our app reuses.
// A "pool" is more efficient than opening a new connection for every request.

const mysql = require('mysql2/promise'); // 'promise' version lets us use async/await
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
module.exports = pool;

pool.getConnection()
  .then(connection => {
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
  })
  .catch(err => {
    console.error("❌ MySQL Connection Error:");
    console.error(err);
  });