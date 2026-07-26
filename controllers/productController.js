const productModel = require('../models/productModel');

// GET /products — the internal-portal catalog page
// Supports optional search (?searchQuery=), price sort (?sortBy=price_asc|price_desc),
// and availability filter (?availability=in_stock|out_of_stock), all combinable.
function showProductsPage(req, res) {
  const { searchQuery, sortBy, availability, uploadError } = req.query;   // add uploadError here
  const products = productModel.getFilteredProducts({ searchQuery, sortBy, availability });
  res.render('products', {
    products,
    searchQuery: searchQuery || '',
    sortBy: sortBy || '',
    availability: availability || '',
    uploadError: uploadError || ''   // and add this line
  });
}

// POST /products/add — create a new product from the "Add New Product" form
function addProduct(req, res) {
  const { name, description, quantity, price } = req.body;
  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).redirect('/products');
  }
  const image_url = req.file ? req.file.filename : 'noTexture.png';
  productModel.createProduct({
    name,
    description: description || '',
    image_url,
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
