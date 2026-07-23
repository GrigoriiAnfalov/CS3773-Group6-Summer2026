const db = require('../config/database');

// Get all discount codes
function getAllDiscountCodes() {
  return db.prepare('SELECT * FROM discount_codes').all();
}

// Look up a single code (used to validate/apply it)
function getDiscountByCode(code) {
  return db.prepare(
    'SELECT * FROM discount_codes WHERE code = ?'
  ).get(code);
}

// Create a new discount code
function createDiscountCode({ code, multiplier }) {
  const result = db.prepare(
    `INSERT INTO discount_codes (code, multiplier)
     VALUES (?, ?)`
  ).run(code, multiplier);

  return result.lastInsertRowid;
}

function deleteDiscountCode(code) {
  return db.prepare('DELETE FROM discount_codes WHERE code = ?').run(code);
}

module.exports = {
  getAllDiscountCodes,
  getDiscountByCode,
  createDiscountCode,
  deleteDiscountCode
};
