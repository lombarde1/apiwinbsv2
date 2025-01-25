// src/models/Chat.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationId: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'blocked'],
        default: 'active'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    messages: [messageSchema],
    spamCount: {
        type: Number,
        default: 0
    },
    spamTimeout: {
        type: Date
    }
});

module.exports = chatSchema;