// src/routes/alertRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const alertController = require('../controllers/alertController');

router.post('/alerts', alertController.createAlert);
router.get('/alerts/:userId', alertController.getAlerts);
router.put('/alerts/:alertId/resolve', alertController.resolveAlert);

module.exports = router;