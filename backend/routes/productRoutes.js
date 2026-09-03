const express  = require('express');
const router   = express.Router();
const upload   = require('../middleware/Upload');
const { 
    getProducts, 
    getProductByIdOrSlug, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/',           getProducts);
router.get('/:idOrSlug',  getProductByIdOrSlug);
router.post('/',          protect, admin, upload.array('images', 20), createProduct);
router.put('/:id',        protect, admin, upload.array('images', 20), updateProduct);
router.delete('/:id',     protect, admin, deleteProduct);

module.exports = router;