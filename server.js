// server.js
const express = require('express');
const app = express();

// Configure Express to use EJS
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    // Renders views/index.ejs and passes dynamic data
    res.render('login');
});

app.listen(3000, () => console.log('Server running on port 3000'));

