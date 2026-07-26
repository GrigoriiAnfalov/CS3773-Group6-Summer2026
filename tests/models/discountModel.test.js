const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { resetDb } = require('../helpers/testDb');
const discountModel = require('../../models/discountModel');

beforeEach(() => {
  resetDb();
});

test('createDiscountCode inserts a row and returns its rowid', () => {
  const rowid = discountModel.createDiscountCode({ code: 'SAVE10', multiplier: 0.9 });
  assert.equal(typeof rowid, 'number');

  const found = discountModel.getDiscountByCode('SAVE10');
  assert.equal(found.multiplier, 0.9);
});

test('getDiscountByCode returns undefined for an unknown code', () => {
  assert.equal(discountModel.getDiscountByCode('NOPE'), undefined);
});

test('getAllDiscountCodes returns every code that was created', () => {
  discountModel.createDiscountCode({ code: 'A', multiplier: 0.5 });
  discountModel.createDiscountCode({ code: 'B', multiplier: 0.75 });

  const all = discountModel.getAllDiscountCodes();
  assert.equal(all.length, 2);
  assert.deepEqual(all.map(d => d.code).sort(), ['A', 'B']);
});

test('deleteDiscountCode removes the matching code', () => {
  discountModel.createDiscountCode({ code: 'GONE', multiplier: 1 });
  discountModel.deleteDiscountCode('GONE');
  assert.equal(discountModel.getDiscountByCode('GONE'), undefined);
});
