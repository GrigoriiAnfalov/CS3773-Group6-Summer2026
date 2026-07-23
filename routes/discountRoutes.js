const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.post('/discounts/add', discountController.addDiscount);
router.post('/discounts/remove/:code', discountController.removeDiscount);

module.exports = router;