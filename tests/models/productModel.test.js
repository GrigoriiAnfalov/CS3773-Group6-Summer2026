const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { db, resetDb } = require('../helpers/testDb');
const productModel = require('../../models/productModel');

beforeEach(() => {
  resetDb();
});

function seedProducts() {
  productModel.createProduct({ name: 'Apple Pie', description: 'Sweet dessert', image_url: 'Apple_pie.webp', quantity: 5, price: 12.5 });
  productModel.createProduct({ name: 'Baguette', description: 'French bread', image_url: 'Baguette.webp', quantity: 0, price: 3.0 });
  productModel.createProduct({ name: 'Kebab', description: 'Meat wrap', image_url: 'Kebab.webp', quantity: 10, price: 8.25 });
}

test('createProduct inserts a row and returns its new id', () => {
  const id = productModel.createProduct({ name: 'Tomato', description: 'Red and juicy', image_url: 'Tomato.webp', quantity: 20, price: 1.5 });
  assert.equal(typeof id, 'number');

  const product = productModel.getProductById(id);
  assert.equal(product.name, 'Tomato');
  assert.equal(product.quantity, 20);
  assert.equal(product.price, 1.5);
});

test('getAllProducts returns every seeded product', () => {
  seedProducts();
  const products = productModel.getAllProducts();
  assert.equal(products.length, 3);
});

test('getProductById returns undefined for a missing id', () => {
  seedProducts();
  const product = productModel.getProductById(9999);
  assert.equal(product, undefined);
});

test('searchProducts matches on name', () => {
  seedProducts();
  const results = productModel.searchProducts('baguette');
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Baguette');
});

test('searchProducts matches on description', () => {
  seedProducts();
  const results = productModel.searchProducts('meat');
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Kebab');
});

test('getSortedByPrice defaults to ascending', () => {
  seedProducts();
  const results = productModel.getSortedByPrice();
  assert.deepEqual(results.map(p => p.name), ['Baguette', 'Kebab', 'Apple Pie']);
});

test('getSortedByPrice supports descending', () => {
  seedProducts();
  const results = productModel.getSortedByPrice('DESC');
  assert.deepEqual(results.map(p => p.name), ['Apple Pie', 'Kebab', 'Baguette']);
});

test('getSortedByPrice guards against invalid direction values', () => {
  seedProducts();
  // Anything other than 'DESC' (case-insensitive) should fall back to ASC,
  // rather than being interpolated directly into the SQL.
  const results = productModel.getSortedByPrice("DESC; DROP TABLE item;--");
  assert.deepEqual(results.map(p => p.name), ['Baguette', 'Kebab', 'Apple Pie']);
});

test('getSortedByAvailability orders by quantity ascending', () => {
  seedProducts();
  const results = productModel.getSortedByAvailability();
  assert.deepEqual(results.map(p => p.name), ['Baguette', 'Apple Pie', 'Kebab']);
});

test('getFilteredProducts with no options returns everything', () => {
  seedProducts();
  const results = productModel.getFilteredProducts();
  assert.equal(results.length, 3);
});

test('getFilteredProducts filters by searchQuery', () => {
  seedProducts();
  const results = productModel.getFilteredProducts({ searchQuery: 'pie' });
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Apple Pie');
});

test('getFilteredProducts filters by in_stock availability', () => {
  seedProducts();
  const results = productModel.getFilteredProducts({ availability: 'in_stock' });
  assert.deepEqual(results.map(p => p.name).sort(), ['Apple Pie', 'Kebab']);
});

test('getFilteredProducts filters by out_of_stock availability', () => {
  seedProducts();
  const results = productModel.getFilteredProducts({ availability: 'out_of_stock' });
  assert.deepEqual(results.map(p => p.name), ['Baguette']);
});

test('getFilteredProducts combines search, availability, and sort', () => {
  seedProducts();
  productModel.createProduct({ name: 'Pineapple Pizza', description: 'Controversial', image_url: 'x.webp', quantity: 2, price: 9.0 });
  const results = productModel.getFilteredProducts({ searchQuery: 'p', availability: 'in_stock', sortBy: 'price_asc' });
  // 'p' matches: Apple Pie (name), Kebab ("wrap" in its description), and
  // Pineapple Pizza. Baguette is excluded by the in_stock filter (qty 0).
  assert.deepEqual(results.map(p => p.name), ['Kebab', 'Pineapple Pizza', 'Apple Pie']);
});

test('getFilteredProducts ignores unknown sortBy values', () => {
  seedProducts();
  const results = productModel.getFilteredProducts({ sortBy: 'not_a_real_option' });
  assert.equal(results.length, 3);
});

test('updateProduct changes the stored fields', () => {
  const id = productModel.createProduct({ name: 'Lemon', description: 'Sour', image_url: 'Lemon.webp', quantity: 4, price: 0.5 });
  productModel.updateProduct(id, { name: 'Lemon (large)', description: 'Extra sour', image_url: 'Lemon.webp', quantity: 6, price: 0.75 });

  const updated = productModel.getProductById(id);
  assert.equal(updated.name, 'Lemon (large)');
  assert.equal(updated.description, 'Extra sour');
  assert.equal(updated.quantity, 6);
  assert.equal(updated.price, 0.75);
});

test('deleteProduct removes the row', () => {
  const id = productModel.createProduct({ name: 'Garlic', description: '', image_url: 'Garlic.webp', quantity: 1, price: 0.2 });
  productModel.deleteProduct(id);
  assert.equal(productModel.getProductById(id), undefined);
});

test('reduceQuantity subtracts stock when enough is available', () => {
  const id = productModel.createProduct({ name: 'Orange', description: '', image_url: 'Orange.webp', quantity: 10, price: 1.0 });
  productModel.reduceQuantity(id, 4);
  assert.equal(productModel.getProductById(id).quantity, 6);
});

test('reduceQuantity throws when there is not enough stock, and leaves quantity unchanged', () => {
  const id = productModel.createProduct({ name: 'Watermelon', description: '', image_url: 'Watermelon.webp', quantity: 2, price: 5.0 });
  assert.throws(() => productModel.reduceQuantity(id, 5), /Insufficient stock/);
  assert.equal(productModel.getProductById(id).quantity, 2);
});
