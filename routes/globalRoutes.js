// src/routes/globalRoutes.js
const express = require('express');
const router = express.Router();
const globalController = require('../controllers/globalController');

router.get('/global/user/:email', globalController.findUserByEmail);
router.get('/global/alerts/:email', globalController.findAlertsByEmail);
router.get('/global/check-email/:email', globalController.checkEmailStatus);

module.exports = router;