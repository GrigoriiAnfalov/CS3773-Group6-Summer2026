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
console.log(productModel.searchProducts("Test"));

console.log('--- Search Products by Description ---');
console.log(productModel.searchProducts("restores"));

console.log('--- Create Product ---');
//console.log(productModel.searchProducts("Test"));
//console.log(productModel.createProduct({name: "TestItem", description: "Test", image_url: "idk", quantity: 500, price: 100}));
//console.log(productModel.deleteProduct(22));
//console.log(productModel.updateProduct(21, { name: "Test1", description: "desc 2", image_url: "idk.1", quantity: 4, price: 3 }))
//console.log(productModel.searchProducts("Test"));
//console.log(productModel.reduceQuantity(22, 0));
//console.log(productModel.searchProducts("Test"));



// Test order model

console.log('--- List All Orders ---');
console.log(orderModel.getAllOrders());

console.log('--- Get Order by ID ---');
console.log(orderModel.getOrderById(1));

console.log('--- List All Orders Sorted by Time---');
console.log(orderModel.getOrdersSortedByTime());

console.log('--- List All Orders Sorted by Customer---');
console.log(orderModel.getOrdersSortedByCustomer());

console.log('--- List All Orders Sorted by Status---');
console.log(orderModel.getOrdersSortedByStatus());

console.log('--- List All Orders Sorted by Amount---');
console.log(orderModel.getOrdersSortedByAmount());

console.log('--- Execute Order---');
//console.log(orderModel.getOrderById(7));
//console.log(orderModel.executeOrder(7));
//console.log(orderModel.getOrderById(7));
//console.log(productModel.searchProducts("Test"));

