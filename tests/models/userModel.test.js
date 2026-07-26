const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { db, resetDb } = require('../helpers/testDb');
const userModel = require('../../models/userModel');

beforeEach(() => {
  resetDb();
});

function seedUsers() {
  db.prepare('INSERT INTO user (username, password) VALUES (?, ?)').run('alice', 'hunter2');
  db.prepare('INSERT INTO user (username, password) VALUES (?, ?)').run('bob', 'swordfish');
}

test('findByUsername returns the matching user', () => {
  seedUsers();
  const user = userModel.findByUsername('alice');
  assert.equal(user.password, 'hunter2');
});

test('findByUsername returns undefined for an unknown username', () => {
  seedUsers();
  assert.equal(userModel.findByUsername('nobody'), undefined);
});

test('getAllUsers returns every seeded user', () => {
  seedUsers();
  const users = userModel.getAllUsers();
  assert.equal(users.length, 2);
  assert.deepEqual(users.map(u => u.username).sort(), ['alice', 'bob']);
});
