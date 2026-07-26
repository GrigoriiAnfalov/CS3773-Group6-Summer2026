const Database = require('better-sqlite3');

// Allow tests (or other environments) to point at a different database file
// (e.g. ':memory:' or a temp file) via DB_PATH, without changing normal
// production behavior which still defaults to ./database.sqlite.
const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new Database(dbPath);
module.exports = db;
