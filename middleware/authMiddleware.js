function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }

  // If it's an API request, send JSON 401 instead of redirecting
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.redirect('/login.html');
}

module.exports = requireLogin;