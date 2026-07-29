# CS3773-Group6-Summer2026

Internal Portal – Online Grocery Store

An internal-facing portal for managing a grocery store's catalog and orders: browse/search/filter products, add or edit products (with image upload), manage discount codes, and browse/execute orders. Access is gated behind a login-protected session.

**Stack:** Node.js, Express, EJS, better-sqlite3 (SQLite), express-session, multer (image uploads).

## Requirements

- Node.js (v18+; developed/tested on v22)
- npm

## Setup

npm install

If better-sqlite3 fails to load with an error like NODE_MODULE_VERSION mismatch, its native binding was built for a different Node version than the one you're running. Fix with:

npm rebuild better-sqlite3

(or delete node_modules and run npm install again).

## Running the app

npm start

This runs the full test suite first, and only starts the server (on http://localhost:3000) if every test passes. See Tests below.

There are 3 users preloaded into the database:
* User1, 1234
* GrigoriiA, Password123
* admin, admin

An optional SESSION_SECRET environment variable can be set to override the default dev session secret:

SESSION_SECRET=your-secret npm start

## Tests

Unit tests use Node's built-in test runner (node:test) — no extra dependencies required.

npm test

- Model tests (tests/models/) run against a real, isolated in-memory SQLite database (via DB_PATH=:memory:) that's created fresh and torn down for every test — your actual database.sqlite is never touched.
- Controller tests (tests/controllers/) mock the model layer to test request handling (validation, redirects, status codes, decorated view data) without needing a database at all.

To run a single file:

node --test tests/models/orderModel.test.js
