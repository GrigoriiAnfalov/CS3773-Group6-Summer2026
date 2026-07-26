const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

// Wrap multer so upload errors (bad file type, too large, etc.) redirect
// back to the form with a message instead of throwing/crashing the request.
function handleImageUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).redirect(`/products?uploadError=${encodeURIComponent(err.message)}`);
    }
    next();
  });
}

router.get('/products', productController.showProductsPage);
router.post('/products/add', handleImageUpload, productController.addProduct);
router.post('/products/remove/:id', productController.removeProduct);

module.exports = router;
