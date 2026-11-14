require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');


// =========================================
// ROUTES
// =========================================

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const historyRoutes = require('./routes/history');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/report');
const supplierRoutes = require('./routes/suppliers');
const categoryRoutes = require('./routes/categories');


// =========================================
// MIDDLEWARE
// =========================================

const { requireLogin } = require('./middleware/authMiddleware');


// =========================================
// EXPRESS APP
// =========================================

const app = express();


// =========================================
// BODY PARSER
// =========================================

app.use(express.urlencoded({
  extended: true
}));

app.use(express.json());


// =========================================
// SESSION
// =========================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',

    resave: false,

    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);


// =========================================
// AUTHENTICATION ROUTES
// These routes do NOT require login
// =========================================

app.use('/api/auth', authRoutes);


// =========================================
// PROTECTED API ROUTES
// =========================================

// Products
app.use(
  '/api/products',
  requireLogin,
  productRoutes
);


// Stock
app.use(
  '/api/stock',
  requireLogin,
  stockRoutes
);


// History
app.use(
  '/api/history',
  requireLogin,
  historyRoutes
);


// Suppliers
app.use(
  '/api/suppliers',
  requireLogin,
  supplierRoutes
);


// Categories
app.use(
  '/api/categories',
  requireLogin,
  categoryRoutes
);


// Audit
app.use(
  '/api/audit',
  requireLogin,
  auditRoutes
);


// Reports
app.use(
  '/api/report',
  requireLogin,
  reportRoutes
);


// =========================================
// USER MANAGEMENT
// =========================================
//
// The users.js route already checks:
// 1. User must be logged in
// 2. User must be an admin
//
// Therefore we don't need to add requireLogin here.

app.use(
  '/api/users',
  usersRoutes
);


// =========================================
// BASIC API STATUS
// =========================================

app.get('/api/status', (req, res) => {

  res.json({
    message: 'Inventory Management System'
  });

});


// =========================================
// LOGIN PAGE
// Does NOT require login
// =========================================

app.get('/login.html', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'public',
      'login.html'
    )
  );

});


// =========================================
// MAIN DASHBOARD
// Requires login
// =========================================

app.get('/', requireLogin, (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'public',
      'index.html'
    )
  );

});


// =========================================
// PROTECTED DASHBOARD FILE
// =========================================

app.get('/index.html', requireLogin, (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'public',
      'index.html'
    )
  );

});


// =========================================
// STATIC FILES
// CSS / JS / IMAGES / UPLOADS
// =========================================

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);


// =========================================
// START SERVER
// =========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running at http://localhost:${PORT}`
  );

});