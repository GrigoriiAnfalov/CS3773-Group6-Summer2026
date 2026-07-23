// Gate every internal-portal page behind a session.
// Applied in server.js after the /login routes are mounted.
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

module.exports = requireLogin;