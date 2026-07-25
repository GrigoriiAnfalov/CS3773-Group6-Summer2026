const productModel = require('../models/productModel');

// GET /products — the internal-portal catalog page
// Supports optional search (?searchQuery=) and sort (?sortBy=price|availability)
function showProductsPage(req, res) {
  const { searchQuery, sortBy } = req.query;

  let products;
  if (searchQuery) {
    products = productModel.searchProducts(searchQuery);
  } else if (sortBy === 'price') {
    products = productModel.getSortedByPrice();
  } else if (sortBy === 'availability') {
    products = productModel.getSortedByAvailability();
  } else {
    products = productModel.getAllProducts();
  }

  res.render('products', { products });
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
