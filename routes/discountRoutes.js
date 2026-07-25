const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.post('/discounts/add', discountController.addDiscount);

module.exports = router;
