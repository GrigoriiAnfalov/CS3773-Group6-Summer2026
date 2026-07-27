const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { mockRequest, mockResponse, withMocks } = require('../helpers/mockReqRes');
const discountModel = require('../../models/discountModel');
const discountController = require('../../controllers/discountController');

let restore = () => {};
afterEach(() => restore());

test('addDiscount rejects a request missing the code', () => {
  const req = mockRequest({ body: { multiplier: '0.9' } });
  const res = mockResponse();

  discountController.addDiscount(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.redirectedTo, '/discounts');
});

test('addDiscount rejects a request missing the multiplier', () => {
  const req = mockRequest({ body: { code: 'SAVE10' } });
  const res = mockResponse();

  discountController.addDiscount(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.redirectedTo, '/discounts');
});

test('addDiscount rejects a code that already exists', () => {
  restore = withMocks(discountModel, {
    getDiscountByCode: () => ({ code: 'SAVE10', multiplier: 0.9 }),
    createDiscountCode: () => { throw new Error('should not be called'); },
  });

  const req = mockRequest({ body: { code: 'SAVE10', multiplier: '0.9' } });
  const res = mockResponse();

  discountController.addDiscount(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.redirectedTo, '/discounts');
});

test('addDiscount creates a new code and redirects on success', () => {
  let created;
  restore = withMocks(discountModel, {
    getDiscountByCode: () => undefined,
    createDiscountCode: (payload) => { created = payload; return 1; },
  });

  const req = mockRequest({ body: { code: 'NEW20', multiplier: '0.8' } });
  const res = mockResponse();

  discountController.addDiscount(req, res);

  assert.deepEqual(created, { code: 'NEW20', multiplier: 0.8 });
  assert.equal(res.redirectedTo, '/discounts');
  assert.equal(res.statusCode, 200);
});
