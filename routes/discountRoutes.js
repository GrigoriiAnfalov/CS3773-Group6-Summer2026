const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

// Management page
router.get('/discounts', discountController.showDiscountsPage);

// Create (also posted from the products page)
router.post('/discounts/add', discountController.addDiscount);

// Edit
router.get('/discounts/edit/:code', discountController.showEditDiscountPage);
router.post('/discounts/edit/:code', discountController.updateDiscount);

// Delete
router.post('/discounts/remove/:code', discountController.removeDiscount);

module.exports = router;
