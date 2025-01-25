// src/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/games', gameController.listGames);
router.post('/games', gameController.addGame); // Para adicionar novos jogos

module.exports = router;