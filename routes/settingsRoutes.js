// src/routes/settingsRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const settingsController = require('../controllers/settingsController');

router.get('/settings/:userId', settingsController.getSettings);
router.put('/settings/:userId/region', settingsController.updateRegion);
router.put('/settings/:userId/name', settingsController.updateName);
router.put('/settings/:userId/email', settingsController.updateEmail);
router.put('/settings/:userId/password', settingsController.updatePassword);

module.exports = router;