// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { notificationController } = require('../controllers/notificationController');

router.get('/notifications/:userId', notificationController.listNotifications);
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
router.put('/notifications/:userId/read-all', notificationController.markAllAsRead);

module.exports = router;