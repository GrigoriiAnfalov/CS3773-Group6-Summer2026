const orderModel = require('../models/orderModel');

// --- Status bridge -----------------------------------------------------
// The DB stores status as an integer (0 = not yet executed, 1 = executed)
// but orders.ejs compares against the string 'Pending'. Map here so the
// view keeps working without touching the schema. If the team migrates to
// the full state machine from the UML (Pending/Paid/Processing/Shipped/
// Completed/Cancelled), replace this map and drop the conversion.
const STATUS_LABELS = {
  0: 'Pending',
  1: 'Completed'
};

function labelStatus(order) {
  return { ...order, status: STATUS_LABELS[order.status] ?? String(order.status) };
}

// getOrdersSortedByAmount is the only model function that returns
// total_amount, and the view wants totalAmount on every row regardless of
// sort. Build a lookup once, then decorate whichever list we rendered.
function buildTotalsLookup() {
  const totals = new Map();
  for (const row of orderModel.getOrdersSortedByAmount()) {
    totals.set(row.id, row.total_amount);
  }
  return totals;
}

function decorate(orders) {
  const totals = buildTotalsLookup();
  return orders.map(order => ({
    ...labelStatus(order),
    totalAmount: (totals.get(order.id) ?? 0).toFixed(2)
  }));
}

// GET /orders — browse with sorting
// UML: browseOrders(): void — "will render, as well as include sorting and filters"
function browseOrders(req, res) {
  const { sortBy, direction } = req.query;

  let orders;
  switch (sortBy) {
    case 'user':
      orders = orderModel.getOrdersSortedByCustomer();
      break;
    case 'totalAmount':
      orders = orderModel.getOrdersSortedByAmount(direction);
      break;
    case 'status':
      orders = orderModel.getOrdersSortedByStatus();
      break;
    case 'order_date':
      orders = orderModel.getOrdersSortedByTime(direction);
      break;
    default:
      orders = orderModel.getAllOrders();
  }

  res.render('orders', { orders: decorate(orders), sortBy: sortBy || '' });
}

// GET /orders/details/:id
function orderDetails(req, res) {
  const order = orderModel.getOrderById(req.params.id);
  if (!order) return res.status(404).send('Order not found');

  const lineTotal = order.items.reduce(
    (sum, item) => sum + item.item_quantity * item.price,
    0
  );

  res.render('orderDetails', {
    order: { ...labelStatus(order), totalAmount: lineTotal.toFixed(2) }
  });
}

// POST /orders/execute/:id
// UML: executeOrder(order: Order): void
// The model wraps this in a transaction and throws on insufficient stock or
// on an order that is not in status 0, so a failure leaves nothing partially
// applied.
function executeOrder(req, res, next) {
  try {
    orderModel.executeOrder(req.params.id);
    res.redirect('/orders');
  } catch (err) {
    // Expected business-rule failures get a readable message; anything
    // else is a real bug and goes to the error handler.
    if (/not found|cannot be executed|Insufficient stock/i.test(err.message)) {
      return res.status(409).send(`Could not execute order: ${err.message}`);
    }
    next(err);
  }
}

module.exports = { browseOrders, orderDetails, executeOrder };
