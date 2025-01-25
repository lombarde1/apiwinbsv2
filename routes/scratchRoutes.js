// src/routes/scratchRoutes.js
const express = require('express');
const router = express.Router();
const scratchController = require('../controllers/scratchController');

router.post('/scratch/:userId/play', scratchController.play);

module.exports = router;