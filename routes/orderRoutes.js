const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/orders', orderController.browseOrders);
router.get('/orders/details/:id', orderController.orderDetails);
router.post('/orders/execute/:id', orderController.executeOrder);

module.exports = router;
