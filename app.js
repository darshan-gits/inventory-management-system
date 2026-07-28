require('dotenv').config();

const reportRoutes = require('./routes/report');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const historyRoutes = require('./routes/history');
const auditRoutes = require('./routes/audit');
const express = require('express');
const session = require('express-session');
const stockRoutes = require('./routes/stock');
const path = require('path');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const { requireLogin } = require('./middleware/authMiddleware');
const app = express();

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hours
}));

// --- Auth routes (login/logout/check) - not protected ---
app.use('/api/auth', authRoutes);

app.use('/api/products', requireLogin, productRoutes);
app.use('/api/stock', requireLogin, stockRoutes);
app.use('/api/history', requireLogin, historyRoutes);
app.use('/api/audit', requireLogin, auditRoutes);
app.use('/api/report', requireLogin, reportRoutes);

// --- Protect product API routes ---
app.use('/api/products', requireLogin, productRoutes);
app.use('/api/stock', requireLogin, stockRoutes);
app.use('/api/history', requireLogin, historyRoutes);
app.use('/api/suppliers', requireLogin, supplierRoutes);
app.use('/api/categories', requireLogin, categoryRoutes);

app.get('/api/status', (req, res) => {
  res.json({ message: 'Inventory Management System' });
});

// --- Serve login.html without requiring login ---
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- Protect the main dashboard page ---
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Serve remaining static files (css, js) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Start the server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

