// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Adicione mergeParams: true
const paymentController = require('../controllers/paymentController');

router.post('/generate-pix/:userId', paymentController.generatePix);
router.post('/callback', paymentController.callback);
router.get('/check-status/:transactionId', paymentController.checkStatus);
router.get('/payment/transactions/:userId', paymentController.getTransactions);
router.get('/payment/transaction/:transactionId', paymentController.getTransactionDetails);


module.exports = router;