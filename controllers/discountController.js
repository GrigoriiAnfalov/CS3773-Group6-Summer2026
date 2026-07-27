const discountModel = require('../models/discountModel');

// Multiplier is a fraction of the original price: 0.80 means 20% off.
// Anything at or below 0, or above 1, is not a valid discount.
function isValidMultiplier(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0 && n <= 1;
}

// GET /discounts — management page: list every code with edit/delete actions
function showDiscountsPage(req, res) {
  const discounts = discountModel.getAllDiscountCodes();
  res.render('discounts', {
    discounts,
    error: req.query.error || ''
  });
}

// POST /discounts/add — create a new code.
// Still reachable from the products page form as well as the new page.
function addDiscount(req, res) {
  const { code, multiplier } = req.body;

  if (!code || multiplier === undefined) {
    return res.status(400).redirect('/discounts');
  }

  if (!isValidMultiplier(multiplier)) {
    return res.status(400).redirect('/discounts');
  }

  const existing = discountModel.getDiscountByCode(code);
  if (existing) {
    return res.status(409).redirect('/discounts');
  }

  discountModel.createDiscountCode({
    code,
    multiplier: Number(multiplier)
  });

  res.redirect('/discounts');
}

// GET /discounts/edit/:code — show the edit form for one code
function showEditDiscountPage(req, res) {
  const discount = discountModel.getDiscountByCode(req.params.code);
  if (!discount) {
    return res.status(404).redirect('/discounts');
  }
  res.render('editDiscount', { discount, error: '' });
}

// POST /discounts/edit/:code — update the multiplier for an existing code.
// The code itself is the primary key and stays fixed; only the multiplier
// changes, which keeps the row stable for anything that references it later.
function updateDiscount(req, res) {
  const { code } = req.params;
  const { multiplier } = req.body;

  const existing = discountModel.getDiscountByCode(code);
  if (!existing) {
    return res.status(404).redirect('/discounts');
  }

  if (!isValidMultiplier(multiplier)) {
    return res.status(400).render('editDiscount', {
      discount: existing,
      error: 'Multiplier must be between 0 and 1 (e.g. 0.80 for 20% off).'
    });
  }

  discountModel.updateDiscountCode(code, Number(multiplier));
  res.redirect('/discounts');
}

// POST /discounts/remove/:code — delete a code
function removeDiscount(req, res) {
  discountModel.deleteDiscountCode(req.params.code);
  res.redirect('/discounts');
}

module.exports = {
  showDiscountsPage,
  addDiscount,
  showEditDiscountPage,
  updateDiscount,
  removeDiscount
};
