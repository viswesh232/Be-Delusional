const express = require('express');
const router = express.Router();
const { getAllReturns, getMyReturns, updateReturnStatus, refundReturn, fulfillExchange } = require('../controllers/returnController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/',           protect, admin, getAllReturns);
router.get('/my',         protect,        getMyReturns);
router.put('/:id/status', protect, admin, updateReturnStatus);
router.post('/:id/refund', protect, admin, refundReturn);
router.post('/:id/exchange-fulfillment', protect, admin, fulfillExchange);

module.exports = router;
