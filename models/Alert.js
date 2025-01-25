// src/models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['currency_abuse', 'suspicious_activity', 'terms_violation', 'multiple_accounts'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'ignored'],
        default: 'active'
    },
    evidence: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: String,
    resolutionNotes: String
});

module.exports = alertSchema;