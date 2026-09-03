const express = require('express');
const router = express.Router();
const { getAllReturns, getMyReturns, updateReturnStatus } = require('../controllers/returnController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/',           protect, admin, getAllReturns);
router.get('/my',         protect,        getMyReturns);
router.put('/:id/status', protect, admin, updateReturnStatus);

module.exports = router;
