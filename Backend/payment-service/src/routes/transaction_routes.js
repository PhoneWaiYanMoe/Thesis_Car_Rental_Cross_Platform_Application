const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction_controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', transactionController.getTransactions.bind(transactionController));
router.get('/:id', transactionController.getTransactionById.bind(transactionController));
router.get('/booking/:bookingId', transactionController.getBookingTransactions.bind(transactionController));

module.exports = router;
