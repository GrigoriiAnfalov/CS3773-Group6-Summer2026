const discountModel = require('../models/discountModel');

// POST /discounts/add — create a new discount code from the products page form
function addDiscount(req, res) {
  const { code, multiplier } = req.body;

  if (!code || multiplier === undefined) {
    return res.status(400).redirect('/products');
  }

  const existing = discountModel.getDiscountByCode(code);
  if (existing) {
    return res.status(409).redirect('/products');
  }

  discountModel.createDiscountCode({
    code,
    multiplier: Number(multiplier)
  });

  res.redirect('/products');
}

module.exports = {
  addDiscount
};
