const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refund_controller');
const { authenticate } = require('../middleware/auth');
const { validateRefund } = require('../middleware/validation');

router.use(authenticate);

router.post('/', validateRefund, refundController.processRefund.bind(refundController));
router.get('/:refundId', refundController.getRefundStatus.bind(refundController));

module.exports = router;
