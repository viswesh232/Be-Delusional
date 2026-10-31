const express = require('express');
const router = express.Router();
const { getAllReturns, getMyReturns, updateReturnStatus, refundReturn } = require('../controllers/returnController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/',           protect, admin, getAllReturns);
router.get('/my',         protect,        getMyReturns);
router.put('/:id/status', protect, admin, updateReturnStatus);
router.post('/:id/refund', protect, admin, refundReturn);

module.exports = router;
