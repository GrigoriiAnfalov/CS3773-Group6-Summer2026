const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.showProductsPage);
router.post('/products/add', productController.addProduct);
router.post('/products/remove/:id', productController.removeProduct);

module.exports = router;
