const db = require('../config/database');

// Find a user by username — used during login
function findByUsername(username) {
  return db.prepare('SELECT * FROM user WHERE username = ?').get(username);
}

// Get all users — handy for an admin view or just for testing
function getAllUsers() {
  return db.prepare('SELECT * FROM user').all();
}

module.exports = {
  findByUsername,
  getAllUsers
};
