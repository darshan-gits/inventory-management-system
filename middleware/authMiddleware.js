function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.redirect('/login.html');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.loggedIn && req.session.role === 'admin') {
    return next();
  }

  res.status(403).json({ message: 'Admins only' });
}

module.exports = { requireLogin, requireAdmin };