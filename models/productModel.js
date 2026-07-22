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
  return db.prepare('SELECT * FROM item ORDER BY quantity ASC').all();
}

// Create a new product for sale
function createProduct({ name, description, image_url, quantity, price }) {
  const result = db.prepare(
    `INSERT INTO item (name, description, image_url, quantity, price)
     VALUES (?, ?, ?, ?, ?)`
  ).run(name, description, image_url, quantity, price);

  return result.lastInsertRowid; // return the new product's id
}

function deleteProduct(id) {
  return db.prepare('DELETE FROM item WHERE id = ?').run(id);
}


// Update name, image, price, and/or quantity
function updateProduct(id, { name, image_url, quantity, price }) {
  return db.prepare(
    `UPDATE item
     SET name = ?, image_url = ?, quantity = ?, price = ?
     WHERE id = ?`
  ).run(name, image_url, quantity, price, id);
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
  createProduct,
  deleteProduct,
  updateProduct,
  reduceQuantity
};
