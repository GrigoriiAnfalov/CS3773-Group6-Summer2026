const productModel = require('../models/productModel');

// GET /products — the internal-portal catalog page
// Supports optional search (?searchQuery=), price sort (?sortBy=price_asc|price_desc),
// and availability filter (?availability=in_stock|out_of_stock), all combinable.
function showProductsPage(req, res) {
  const { searchQuery, sortBy, availability } = req.query;

  const products = productModel.getFilteredProducts({ searchQuery, sortBy, availability });

  // Pass the current filter state back so the form can re-select the user's choices
  res.render('products', {
    products,
    searchQuery: searchQuery || '',
    sortBy: sortBy || '',
    availability: availability || ''
  });
}

// POST /products/add — create a new product from the "Add New Product" form
function addProduct(req, res) {
  const { name, description, image_url, quantity, price } = req.body;

  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).redirect('/products');
  }

  productModel.createProduct({
    name,
    description: description || '',
    image_url: image_url || 'noTexture.png',
    quantity: Number(quantity),
    price: Number(price)
  });

  res.redirect('/products');
}

// POST /products/remove/:id — delete a product from the catalog
function removeProduct(req, res) {
  const { id } = req.params;

  productModel.deleteProduct(id);

  res.redirect('/products');
}

module.exports = {
  showProductsPage,
  addProduct,
  removeProduct
};
