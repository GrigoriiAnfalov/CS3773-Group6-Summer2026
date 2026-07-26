const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { mockRequest, mockResponse, withMocks } = require('../helpers/mockReqRes');
const userModel = require('../../models/userModel');
const authController = require('../../controllers/authController');

let restore = () => {};
afterEach(() => restore());

test('showLoginPage renders the login form when there is no session user', () => {
  const req = mockRequest({ session: {} });
  const res = mockResponse();

  authController.showLoginPage(req, res);

  assert.equal(res.view, 'login');
  assert.equal(res.viewData.error, null);
  assert.equal(res.redirectedTo, undefined);
});

test('showLoginPage redirects to /products when already logged in', () => {
  const req = mockRequest({ session: { user: { username: 'alice' } } });
  const res = mockResponse();

  authController.showLoginPage(req, res);

  assert.equal(res.redirectedTo, '/products');
});

test('login rejects a request missing username or password', () => {
  const req = mockRequest({ body: { username: '', password: '' }, session: {} });
  const res = mockResponse();

  authController.login(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.view, 'login');
  assert.match(res.viewData.error, /required/i);
});

test('login rejects an unknown username', () => {
  restore = withMocks(userModel, { findByUsername: () => undefined });
  const req = mockRequest({ body: { username: 'ghost', password: 'whatever' }, session: {} });
  const res = mockResponse();

  authController.login(req, res);

  assert.equal(res.statusCode, 401);
  assert.match(res.viewData.error, /invalid/i);
});

test('login rejects an incorrect password', () => {
  restore = withMocks(userModel, { findByUsername: () => ({ username: 'alice', password: 'correct-horse' }) });
  const req = mockRequest({ body: { username: 'alice', password: 'wrong' }, session: {} });
  const res = mockResponse();

  authController.login(req, res);

  assert.equal(res.statusCode, 401);
});

test('login regenerates the session and redirects to /products on success', () => {
  restore = withMocks(userModel, { findByUsername: () => ({ username: 'alice', password: 'correct-horse' }) });

  const session = { regenerate: (cb) => cb(null) };
  const req = mockRequest({ body: { username: 'alice', password: 'correct-horse' }, session });
  const res = mockResponse();

  authController.login(req, res);

  assert.deepEqual(session.user, { username: 'alice' });
  assert.equal(res.redirectedTo, '/products');
});

test('login renders an error page if session regeneration fails', () => {
  restore = withMocks(userModel, { findByUsername: () => ({ username: 'alice', password: 'correct-horse' }) });

  const session = { regenerate: (cb) => cb(new Error('boom')) };
  const req = mockRequest({ body: { username: 'alice', password: 'correct-horse' }, session });
  const res = mockResponse();

  authController.login(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.view, 'login');
});

test('logout destroys the session and redirects to /login', () => {
  let destroyed = false;
  const session = { destroy: (cb) => { destroyed = true; cb(); } };
  const req = mockRequest({ session });
  const res = mockResponse();

  authController.logout(req, res);

  assert.equal(destroyed, true);
  assert.equal(res.redirectedTo, '/login');
});

test('logout redirects to /login even without an existing session', () => {
  const req = { session: null };
  const res = mockResponse();

  authController.logout(req, res);

  assert.equal(res.redirectedTo, '/login');
});
