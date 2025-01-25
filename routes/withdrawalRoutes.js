// src/routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const withdrawalController = require('../controllers/withdrawalController');

router.post('/withdrawals/:userId', withdrawalController.requestWithdrawal);
router.get('/withdrawals/:userId', withdrawalController.listWithdrawals);

module.exports = router;