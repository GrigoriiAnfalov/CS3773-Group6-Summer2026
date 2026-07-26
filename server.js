const express = require('express');
const path = require('path');
const session = require('express-session');
const requireLogin = require('./middleware/requireLogin');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const discountRoutes = require('./routes/discountRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Configure Express to use EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false
}));

// /login (GET + POST) and /logout — no auth required to reach these
app.use(authRoutes);

// Everything below this line requires a logged-in session
app.use(requireLogin);


app.get('/', (req, res) => {
  res.redirect('/login');
});

app.use(orderRoutes);
app.use(productRoutes);
app.use(discountRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
