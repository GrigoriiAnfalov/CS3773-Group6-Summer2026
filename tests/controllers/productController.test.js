const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { mockRequest, mockResponse, withMocks } = require('../helpers/mockReqRes');
const productModel = require('../../models/productModel');
const productController = require('../../controllers/productController');

let restore = () => {};
afterEach(() => restore());

test('showProductsPage passes filters through to the model and view', () => {
  let receivedArgs;
  restore = withMocks(productModel, {
    getFilteredProducts: (args) => { receivedArgs = args; return [{ id: 1, name: 'Bread' }]; },
  });

  const req = mockRequest({ query: { searchQuery: 'bread', sortBy: 'price_asc', availability: 'in_stock' } });
  const res = mockResponse();

  productController.showProductsPage(req, res);

  assert.deepEqual(receivedArgs, { searchQuery: 'bread', sortBy: 'price_asc', availability: 'in_stock' });
  assert.equal(res.view, 'products');
  assert.deepEqual(res.viewData.products, [{ id: 1, name: 'Bread' }]);
  assert.equal(res.viewData.searchQuery, 'bread');
});

test('showProductsPage defaults query fields to empty strings when absent', () => {
  restore = withMocks(productModel, { getFilteredProducts: () => [] });

  const req = mockRequest({ query: {} });
  const res = mockResponse();

  productController.showProductsPage(req, res);

  assert.equal(res.viewData.searchQuery, '');
  assert.equal(res.viewData.sortBy, '');
  assert.equal(res.viewData.availability, '');
  assert.equal(res.viewData.uploadError, '');
});

test('addProduct rejects a request missing required fields', () => {
  const req = mockRequest({ body: { name: '', quantity: undefined, price: undefined } });
  const res = mockResponse();

  productController.addProduct(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.redirectedTo, '/products');
});

test('addProduct uses the uploaded file name when a file was provided', () => {
  let createdWith;
  restore = withMocks(productModel, { createProduct: (data) => { createdWith = data; return 1; } });

  const req = mockRequest({
    body: { name: 'Tomato', description: 'Red', quantity: '5', price: '1.25' },
    file: { filename: 'abc123.png' },
  });
  const res = mockResponse();

  productController.addProduct(req, res);

  assert.equal(createdWith.image_url, 'abc123.png');
  assert.equal(createdWith.quantity, 5);
  assert.equal(createdWith.price, 1.25);
  assert.equal(res.redirectedTo, '/products');
});

test('addProduct falls back to the default image when no file was uploaded', () => {
  let createdWith;
  restore = withMocks(productModel, { createProduct: (data) => { createdWith = data; return 1; } });

  const req = mockRequest({ body: { name: 'Tomato', description: '', quantity: '5', price: '1.25' } });
  const res = mockResponse();

  productController.addProduct(req, res);

  assert.equal(createdWith.image_url, 'noTexture.png');
});

test('showEditProductPage 404s when the product does not exist', () => {
  restore = withMocks(productModel, { getProductById: () => undefined });

  const req = mockRequest({ params: { id: '999' } });
  const res = mockResponse();

  productController.showEditProductPage(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.redirectedTo, '/products');
});

test('showEditProductPage renders the edit form when the product exists', () => {
  restore = withMocks(productModel, { getProductById: () => ({ id: 1, name: 'Bread' }) });

  const req = mockRequest({ params: { id: '1' }, query: {} });
  const res = mockResponse();

  productController.showEditProductPage(req, res);

  assert.equal(res.view, 'editProduct');
  assert.deepEqual(res.viewData.product, { id: 1, name: 'Bread' });
});

test('updateProduct 404s when the product does not exist', () => {
  restore = withMocks(productModel, { getProductById: () => undefined });

  const req = mockRequest({ params: { id: '999' }, body: { name: 'X', quantity: '1', price: '1' } });
  const res = mockResponse();

  productController.updateProduct(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.redirectedTo, '/products');
});

test('updateProduct rejects a request missing required fields', () => {
  restore = withMocks(productModel, { getProductById: () => ({ id: 1, name: 'Bread', image_url: 'Bread.webp' }) });

  const req = mockRequest({ params: { id: '1' }, body: { name: '', quantity: undefined, price: undefined } });
  const res = mockResponse();

  productController.updateProduct(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.redirectedTo, '/products/modify/1');
});

test('updateProduct keeps the existing image when no new file is uploaded', () => {
  let updatedWith;
  restore = withMocks(productModel, {
    getProductById: () => ({ id: 1, name: 'Bread', image_url: 'Bread.webp' }),
    updateProduct: (id, data) => { updatedWith = data; },
  });

  const req = mockRequest({ params: { id: '1' }, body: { name: 'Bread', description: '', quantity: '2', price: '3' } });
  const res = mockResponse();

  productController.updateProduct(req, res);

  assert.equal(updatedWith.image_url, 'Bread.webp');
  assert.equal(res.redirectedTo, '/products');
});

test('updateProduct replaces the image and cleans up a previously generated upload', () => {
  let unlinkedPath;
  const originalUnlink = fs.unlink;
  fs.unlink = (path, cb) => { unlinkedPath = path; cb(null); };

  restore = withMocks(productModel, {
    getProductById: () => ({ id: 1, name: 'Bread', image_url: '11111111111111111111111111111111.png' }),
    updateProduct: () => {},
  });
  const innerRestore = restore;
  restore = () => { innerRestore(); fs.unlink = originalUnlink; };

  const req = mockRequest({
    params: { id: '1' },
    body: { name: 'Bread', description: '', quantity: '2', price: '3' },
    file: { filename: '22222222222222222222222222222222.png' },
  });
  const res = mockResponse();

  productController.updateProduct(req, res);

  assert.match(unlinkedPath, /11111111111111111111111111111111\.png$/);
});

test('updateProduct does not delete the default image even if replaced', () => {
  let unlinkCalled = false;
  const originalUnlink = fs.unlink;
  fs.unlink = () => { unlinkCalled = true; };

  restore = withMocks(productModel, {
    getProductById: () => ({ id: 1, name: 'Bread', image_url: 'noTexture.png' }),
    updateProduct: () => {},
  });
  const innerRestore = restore;
  restore = () => { innerRestore(); fs.unlink = originalUnlink; };

  const req = mockRequest({
    params: { id: '1' },
    body: { name: 'Bread', description: '', quantity: '2', price: '3' },
    file: { filename: '22222222222222222222222222222222.png' },
  });
  const res = mockResponse();

  productController.updateProduct(req, res);

  assert.equal(unlinkCalled, false);
});

test('removeProduct deletes the product and cleans up its uploaded image', () => {
  let deletedId;
  let unlinkedPath;
  const originalUnlink = fs.unlink;
  fs.unlink = (path, cb) => { unlinkedPath = path; cb(null); };

  restore = withMocks(productModel, {
    getProductById: () => ({ id: 5, image_url: '33333333333333333333333333333333.webp' }),
    deleteProduct: (id) => { deletedId = id; },
  });
  const innerRestore = restore;
  restore = () => { innerRestore(); fs.unlink = originalUnlink; };

  const req = mockRequest({ params: { id: '5' } });
  const res = mockResponse();

  productController.removeProduct(req, res);

  assert.equal(deletedId, '5');
  assert.match(unlinkedPath, /33333333333333333333333333333333\.webp$/);
  assert.equal(res.redirectedTo, '/products');
});

test('removeProduct still redirects even if the product was already gone', () => {
  restore = withMocks(productModel, {
    getProductById: () => undefined,
    deleteProduct: () => {},
  });

  const req = mockRequest({ params: { id: '999' } });
  const res = mockResponse();

  productController.removeProduct(req, res);

  assert.equal(res.redirectedTo, '/products');
});
