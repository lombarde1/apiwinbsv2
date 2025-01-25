// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user/:userId', userController.getUser);
router.put('/user/:userId/balance', userController.updateBalance);

module.exports = router;
