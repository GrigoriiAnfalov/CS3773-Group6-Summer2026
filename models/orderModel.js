const db = require('../config/database');
const productModel = require('./productModel');

// All order, most recent first by default
function getAllOrders() {
  return db.prepare('SELECT * FROM "order" ORDER BY order_date DESC').all();
}

// Single order with full detail, including its line items joined to product info
function getOrderById(id) {
  const order = db.prepare('SELECT * FROM "order" WHERE id = ?').get(id);
  if (!order) return null;

  const items = db.prepare(
    `SELECT order_contents.item_quantity, item.name, item.price
     FROM order_contents
     JOIN item ON item.id = order_contents.item_id
     WHERE order_contents.order_id = ?`
  ).all(id);

  return { ...order, items };
}

// Direction is DESC by default, unless specified otherwise
function getOrdersSortedByTime(direction = 'DESC') {
  const dir = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return db.prepare(`SELECT * FROM "order" ORDER BY order_date ${dir}`).all();
}

function getOrdersSortedByCustomer() {
  return db.prepare('SELECT * FROM "order" ORDER BY user ASC').all();
}

function getOrdersSortedByStatus() {
  return db.prepare('SELECT * FROM "order" ORDER BY status DESC').all();
}

// Direction is DESC by default, unless specified otherwise
function getOrdersSortedByAmount(direction = 'DESC') {
  const dir = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return db.prepare(`
  SELECT "order".*, SUM(order_contents.item_quantity * item.price) AS total_amount
  FROM "order"
  JOIN order_contents ON order_contents.order_id = "order".id
  JOIN item ON item.id = order_contents.item_id
  GROUP BY "order".id
  ORDER BY total_amount ${dir}
  `).all();
}

// Executing an order: mark it executed + reduce stock for every item in it.
// Wrapped in a transaction so it's all-or-nothing.
// throws an error if an order is already executed
function executeOrder(orderId) {
  const items = db.prepare(
    'SELECT item_id, item_quantity FROM order_contents WHERE order_id = ?'
  ).all(orderId);

  const runExecution = db.transaction(() => {
    const order = db.prepare('SELECT status FROM "order" WHERE id = ?').get(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (order.status !== 0) {
      throw new Error(`Order ${orderId} cannot be executed: expected status 0, got ${order.status}`);
    }

    for (const item of items) {
      productModel.reduceQuantity(item.item_id, item.item_quantity);
    }
    db.prepare('UPDATE "order" SET status = ? WHERE id = ?').run(1, orderId);
  });

  runExecution();
}

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersSortedByTime,
  getOrdersSortedByCustomer,
  getOrdersSortedByAmount,
  getOrdersSortedByStatus,
  executeOrder
};
