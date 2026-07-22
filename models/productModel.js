const db = require('../config/database');

// Get all item — used for the catalog page
function getAllProducts() {
  return db.prepare('SELECT * FROM item').all();
}

// Get a single product by id — used for edit forms, order detail views, etc.
function getProductById(id) {
  return db.prepare('SELECT * FROM item WHERE id = ?').get(id);
}

// Search by name or description
function searchProducts(query) {
  const term = `%${query}%`;
  return db.prepare(
    'SELECT * FROM item WHERE name LIKE ? OR description LIKE ?'
  ).all(term, term);
}

// Sort by price, ascending or descending
// Direction is ASC by default, unless specified otherwise
function getSortedByPrice(direction = 'ASC') {
  const dir = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'; // guard against SQL injection via ORDER BY
  return db.prepare(`SELECT * FROM item ORDER BY price ${dir}`).all();
}

// Sort by availability (in-stock first, or by quantity)
function getSortedByAvailability() {
  return db.prepare('SELECT * FROM item ORDER BY quantity DESC').all();
}

// Update name, image, price, and/or quantity
function updateProduct(id, { name, image_path, price, quantity }) {
  return db.prepare(
    `UPDATE item
     SET name = ?, image_path = ?, price = ?, quantity = ?
     WHERE id = ?`
  ).run(name, image_path, price, quantity, id);
}


// Reduce quantity — called when an order is executed
function reduceQuantity(id, amountToReduce) {
  return db.prepare(
    'UPDATE item SET quantity = quantity - ? WHERE id = ?'
  ).run(amountToReduce, id);
}

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  getSortedByPrice,
  getSortedByAvailability,
  updateProduct,
  reduceQuantity
};
