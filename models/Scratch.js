// src/models/Scratch.js
const mongoose = require('mongoose');

const scratchSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cost: {
        type: Number,
        default: 5
    },
    result: {
        type: Array,
        required: true
    },
    won: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = scratchSchema;