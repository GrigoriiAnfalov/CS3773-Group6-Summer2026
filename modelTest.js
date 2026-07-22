const productModel = require('./models/productModel');
const userModel = require('./models/userModel');
const orderModel = require('./models/orderModel');

// Test user lookup
console.log('--- User lookup ---');
console.log(userModel.findByUsername('User1'));

console.log('--- List All Users ---');
console.log(userModel.getAllUsers());

// Test product model
console.log('--- List All Products ---');
console.log(productModel.getAllProducts());

console.log('--- Search Products by Name ---');
console.log(productModel.searchProducts("Bread"));

console.log('--- Search Products by Description ---');
console.log(productModel.searchProducts("restores"));

// Test order model

console.log('--- List All Orders ---');
console.log(orderModel.getAllOrders());

console.log('--- Get Order by ID ---');
console.log(orderModel.getOrderById(1));

console.log('--- List All Orders Sorted by Time---');
console.log(orderModel.getOrdersSortedByTime());

console.log('--- List All Orders Sorted by Customer---');
console.log(orderModel.getOrdersSortedByCustomer());

console.log('--- List All Orders Sorted by Amount---');
console.log(orderModel.getOrdersSortedByAmount());

