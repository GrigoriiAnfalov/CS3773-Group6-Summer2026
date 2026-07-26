const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { mockRequest, mockResponse, withMocks } = require('../helpers/mockReqRes');
const orderModel = require('../../models/orderModel');
const orderController = require('../../controllers/orderController');

let restore = () => {};
afterEach(() => restore());

// Every browseOrders call also fetches getOrdersSortedByAmount() once, to
// build the totalAmount lookup used to decorate whichever list was rendered.
function baseMocks(overrides = {}) {
  return {
    getAllOrders: () => [],
    getOrdersSortedByCustomer: () => [],
    getOrdersSortedByTime: () => [],
    getOrdersSortedByAmount: () => [],
    ...overrides,
  };
}

test('browseOrders defaults to getAllOrders when no sortBy is given', () => {
  let called = false;
  restore = withMocks(orderModel, baseMocks({
    getAllOrders: () => { called = true; return [{ id: 1, status: 0 }]; },
  }));

  const req = mockRequest({ query: {} });
  const res = mockResponse();
  orderController.browseOrders(req, res);

  assert.equal(called, true);
  assert.equal(res.view, 'orders');
  assert.equal(res.viewData.orders[0].status, 'Pending');
});

test('browseOrders?sortBy=user calls getOrdersSortedByCustomer', () => {
  let called = false;
  restore = withMocks(orderModel, baseMocks({
    getOrdersSortedByCustomer: () => { called = true; return []; },
  }));

  const req = mockRequest({ query: { sortBy: 'user' } });
  const res = mockResponse();
  orderController.browseOrders(req, res);

  assert.equal(called, true);
});

test('browseOrders?sortBy=order_date_asc calls getOrdersSortedByTime with ASC', () => {
  let receivedDirection;
  restore = withMocks(orderModel, baseMocks({
    getOrdersSortedByTime: (dir) => { receivedDirection = dir; return []; },
  }));

  const req = mockRequest({ query: { sortBy: 'order_date_asc' } });
  const res = mockResponse();
  orderController.browseOrders(req, res);

  assert.equal(receivedDirection, 'ASC');
});

test('browseOrders?sortBy=amount_desc calls getOrdersSortedByAmount with DESC', () => {
  const calls = [];
  restore = withMocks(orderModel, baseMocks({
    getOrdersSortedByAmount: (dir) => { calls.push(dir); return []; },
  }));

  const req = mockRequest({ query: { sortBy: 'amount_desc' } });
  const res = mockResponse();
  orderController.browseOrders(req, res);

  assert.ok(calls.includes('DESC'));
});

test('browseOrders decorates orders with a human-readable status and totalAmount', () => {
  restore = withMocks(orderModel, baseMocks({
    getAllOrders: () => [{ id: 1, status: 0 }, { id: 2, status: 1 }],
    getOrdersSortedByAmount: () => [{ id: 1, total_amount: 12.5 }, { id: 2, total_amount: 7 }],
  }));

  const req = mockRequest({ query: {} });
  const res = mockResponse();
  orderController.browseOrders(req, res);

  assert.deepEqual(res.viewData.orders, [
    { id: 1, status: 'Pending', totalAmount: '12.50' },
    { id: 2, status: 'Completed', totalAmount: '7.00' },
  ]);
});

test('browseOrders falls back to totalAmount 0.00 when an order has no matching total', () => {
  restore = withMocks(orderModel, baseMocks({
    getAllOrders: () => [{ id: 1, status: 0 }],
    getOrdersSortedByAmount: () => [], // no line items, so no total row exists
  }));

  const req = mockRequest({ query: {} });
  const res = mockResponse();
  orderController.browseOrders(req, res);

  assert.equal(res.viewData.orders[0].totalAmount, '0.00');
});

test('orderDetails returns 404 for a missing order', () => {
  restore = withMocks(orderModel, { getOrderById: () => null });

  const req = mockRequest({ params: { id: '999' } });
  const res = mockResponse();
  orderController.orderDetails(req, res);

  assert.equal(res.statusCode, 404);
});

test('orderDetails computes the line-item total and human status', () => {
  restore = withMocks(orderModel, {
    getOrderById: () => ({
      id: 1,
      status: 0,
      items: [
        { item_quantity: 2, price: 3 },
        { item_quantity: 1, price: 4.5 },
      ],
    }),
  });

  const req = mockRequest({ params: { id: '1' } });
  const res = mockResponse();
  orderController.orderDetails(req, res);

  assert.equal(res.view, 'orderDetails');
  assert.equal(res.viewData.order.status, 'Pending');
  assert.equal(res.viewData.order.totalAmount, '10.50');
});

test('executeOrder redirects to /orders on success', () => {
  restore = withMocks(orderModel, { executeOrder: () => {} });

  const req = mockRequest({ params: { id: '1' } });
  const res = mockResponse();
  const next = () => { throw new Error('next should not be called'); };
  orderController.executeOrder(req, res, next);

  assert.equal(res.redirectedTo, '/orders');
});

test('executeOrder responds 409 for an expected business-rule failure', () => {
  restore = withMocks(orderModel, {
    executeOrder: () => { throw new Error('Insufficient stock for item 3'); },
  });

  const req = mockRequest({ params: { id: '1' } });
  const res = mockResponse();
  let nextCalled = false;
  orderController.executeOrder(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 409);
  assert.match(res.body, /Insufficient stock/);
  assert.equal(nextCalled, false);
});

test('executeOrder passes unexpected errors to next()', () => {
  const unexpected = new Error('database is on fire');
  restore = withMocks(orderModel, {
    executeOrder: () => { throw unexpected; },
  });

  const req = mockRequest({ params: { id: '1' } });
  const res = mockResponse();
  let passedError;
  orderController.executeOrder(req, res, (err) => { passedError = err; });

  assert.equal(passedError, unexpected);
  assert.equal(res.redirectedTo, undefined);
});
