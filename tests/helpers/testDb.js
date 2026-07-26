// Sets DB_PATH to an isolated in-memory database *before* anything requires
// config/database.js, then builds the schema so model tests run against a
// clean, disposable database instead of the real database.sqlite file.
//
// IMPORTANT: this module must be required at the very top of a test file,
// before requiring any model (or config/database directly), otherwise the
// models could pick up a different, already-cached connection.
process.env.DB_PATH = ':memory:';

const db = require('../../config/database');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS "order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS order_contents (
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_quantity INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS discount_codes (
    code TEXT PRIMARY KEY,
    multiplier REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
  );
`;

function resetDb() {
  db.exec('DROP TABLE IF EXISTS item;');
  db.exec('DROP TABLE IF EXISTS "order";');
  db.exec('DROP TABLE IF EXISTS order_contents;');
  db.exec('DROP TABLE IF EXISTS discount_codes;');
  db.exec('DROP TABLE IF EXISTS user;');
  db.exec(SCHEMA);
}

module.exports = { db, resetDb };
