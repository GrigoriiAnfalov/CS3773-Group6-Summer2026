const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { db, resetDb } = require('../helpers/testDb');
const productModel = require('../../models/productModel');
const orderModel = require('../../models/orderModel');

beforeEach(() => {
  resetDb();
});

// Orders aren't created through a model function (there isn't one), so
// tests insert directly, mirroring how the app's data actually gets there.
function insertOrder({ user, date, status = 0 }) {
  return db.prepare('INSERT INTO "order" (user, order_date, status) VALUES (?, ?, ?)').run(user, date, status).lastInsertRowid;
}

function addOrderItem(orderId, itemId, quantity) {
  db.prepare('INSERT INTO order_contents (order_id, item_id, item_quantity) VALUES (?, ?, ?)').run(orderId, itemId, quantity);
}

test('getAllOrders returns orders ordered by date, most recent first', () => {
  insertOrder({ user: 'alice', date: '2026-01-01' });
  insertOrder({ user: 'bob', date: '2026-03-01' });
  insertOrder({ user: 'carol', date: '2026-02-01' });

  const orders = orderModel.getAllOrders();
  assert.deepEqual(orders.map(o => o.user), ['bob', 'carol', 'alice']);
});

test('getOrderById returns null for a missing order', () => {
  assert.equal(orderModel.getOrderById(9999), null);
});

test('getOrderById returns the order with its joined line items', () => {
  const itemId = productModel.createProduct({ name: 'Bread', description: '', image_url: 'Bread.webp', quantity: 10, price: 2 });
  const orderId = insertOrder({ user: 'alice', date: '2026-01-01' });
  addOrderItem(orderId, itemId, 3);

  const order = orderModel.getOrderById(orderId);
  assert.equal(order.user, 'alice');
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].name, 'Bread');
  assert.equal(order.items[0].item_quantity, 3);
  assert.equal(order.items[0].price, 2);
});

test('getOrdersSortedByTime supports ASC and defaults to DESC', () => {
  insertOrder({ user: 'alice', date: '2026-01-01' });
  insertOrder({ user: 'bob', date: '2026-03-01' });

  const asc = orderModel.getOrdersSortedByTime('ASC');
  assert.deepEqual(asc.map(o => o.user), ['alice', 'bob']);

  const desc = orderModel.getOrdersSortedByTime();
  assert.deepEqual(desc.map(o => o.user), ['bob', 'alice']);
});

test('getOrdersSortedByCustomer orders alphabetically by user', () => {
  insertOrder({ user: 'carol', date: '2026-01-01' });
  insertOrder({ user: 'alice', date: '2026-01-02' });
  insertOrder({ user: 'bob', date: '2026-01-03' });

  const orders = orderModel.getOrdersSortedByCustomer();
  assert.deepEqual(orders.map(o => o.user), ['alice', 'bob', 'carol']);
});

test('getOrdersSortedByStatus orders executed orders first', () => {
  insertOrder({ user: 'alice', date: '2026-01-01', status: 0 });
  insertOrder({ user: 'bob', date: '2026-01-02', status: 1 });

  const orders = orderModel.getOrdersSortedByStatus();
  assert.deepEqual(orders.map(o => o.user), ['bob', 'alice']);
});

test('getOrdersSortedByAmount computes and sorts by total_amount', () => {
  const cheapItem = productModel.createProduct({ name: 'Lemon', description: '', image_url: 'x.webp', quantity: 100, price: 1 });
  const pricyItem = productModel.createProduct({ name: 'Fish Pie', description: '', image_url: 'x.webp', quantity: 100, price: 20 });

  const smallOrder = insertOrder({ user: 'alice', date: '2026-01-01' });
  addOrderItem(smallOrder, cheapItem, 2); // total 2

  const bigOrder = insertOrder({ user: 'bob', date: '2026-01-02' });
  addOrderItem(bigOrder, pricyItem, 3); // total 60

  const desc = orderModel.getOrdersSortedByAmount('DESC');
  assert.deepEqual(desc.map(o => o.user), ['bob', 'alice']);
  assert.equal(desc[0].total_amount, 60);
  assert.equal(desc[1].total_amount, 2);

  const asc = orderModel.getOrdersSortedByAmount('ASC');
  assert.deepEqual(asc.map(o => o.user), ['alice', 'bob']);
});

test('executeOrder marks the order executed and reduces stock for every line item', () => {
  const itemId = productModel.createProduct({ name: 'Egg', description: '', image_url: 'x.webp', quantity: 10, price: 1 });
  const orderId = insertOrder({ user: 'alice', date: '2026-01-01', status: 0 });
  addOrderItem(orderId, itemId, 4);

  orderModel.executeOrder(orderId);

  const order = db.prepare('SELECT status FROM "order" WHERE id = ?').get(orderId);
  assert.equal(order.status, 1);
  assert.equal(productModel.getProductById(itemId).quantity, 6);
});

test('executeOrder throws for an order that does not exist', () => {
  assert.throws(() => orderModel.executeOrder(9999), /not found/);
});

test('executeOrder throws if the order was already executed, and does not touch stock twice', () => {
  const itemId = productModel.createProduct({ name: 'Milk', description: '', image_url: 'x.webp', quantity: 10, price: 1 });
  const orderId = insertOrder({ user: 'alice', date: '2026-01-01', status: 1 });
  addOrderItem(orderId, itemId, 4);

  assert.throws(() => orderModel.executeOrder(orderId), /cannot be executed/);
  assert.equal(productModel.getProductById(itemId).quantity, 10);
});

test('executeOrder rolls back entirely when one line item has insufficient stock', () => {
  const plentifulItem = productModel.createProduct({ name: 'Bread', description: '', image_url: 'x.webp', quantity: 10, price: 1 });
  const scarceItem = productModel.createProduct({ name: 'Truffle', description: '', image_url: 'x.webp', quantity: 1, price: 50 });
  const orderId = insertOrder({ user: 'alice', date: '2026-01-01', status: 0 });
  addOrderItem(orderId, plentifulItem, 2);
  addOrderItem(orderId, scarceItem, 5); // more than available

  assert.throws(() => orderModel.executeOrder(orderId), /Insufficient stock/);

  // Nothing should have been applied: neither item's stock nor the order status.
  assert.equal(productModel.getProductById(plentifulItem).quantity, 10);
  assert.equal(productModel.getProductById(scarceItem).quantity, 1);
  const order = db.prepare('SELECT status FROM "order" WHERE id = ?').get(orderId);
  assert.equal(order.status, 0);
});
