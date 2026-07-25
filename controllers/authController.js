const userModel = require('../models/userModel');

// GET /login — show the login form
// If the user already has a session, skip straight to the products page.
function showLoginPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect('/products');
  }
  res.render('login', { error: null });
}

// POST /login — validate credentials and start a session
function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render('login', { error: 'Username and password are required.' });
  }

  const user = userModel.findByUsername(username);

  // NOTE: passwords are stored in plaintext in this project's `user` table
  // (see database.sqlite schema), so we compare directly rather than hashing.
  if (!user || user.password !== password) {
    return res.status(401).render('login', { error: 'Invalid username or password.' });
  }

  // Regenerate the session on login to avoid session fixation
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).render('login', { error: 'Something went wrong logging you in. Please try again.' });
    }

    req.session.user = { username: user.username };
    res.redirect('/products');
  });
}

// POST /logout — destroy the session and send the user back to login
function logout(req, res) {
  if (!req.session) {
    return res.redirect('/login');
  }
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = {
  showLoginPage,
  login,
  logout
};
