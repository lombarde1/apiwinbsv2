const express = require('express');
const router = express.Router({ mergeParams: true });
const chatController = require('../controllers/chatController');

router.post('/chat/message', chatController.sendMessage);
router.get('/chat/history/:userId', chatController.getChatHistory);
router.get('/chat/all/:userId', chatController.getAllChats);

module.exports = router;