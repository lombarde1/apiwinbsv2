// src/models/Withdrawal.js
const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 60 // Valor mínimo para saque
    },
    pixKey: {
        type: String,
        required: true
    },
    pixKeyType: {
        type: String,
        enum: ['cpf', 'email', 'phone', 'random'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    rejectionReason: String,
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    }
});

module.exports = withdrawalSchema;