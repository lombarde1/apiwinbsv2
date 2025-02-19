// src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    type: { 
        type: String, 
        required: true, 
        enum: ['deposit', 'withdrawal']
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending' 
    },
    trackingParams: {
        utm_source: String,
        utm_medium: String,
        utm_campaign: String,
        utm_content: String,
        utm_term: String,
        src: String,
        sck: String,
        ip: String,
        user_agent: String,
        page_url: String,
        referrer: String
      },
    transactionId: String,
    externalId: String,
    pixKey: String,
    pixKeyType: { 
        type: String, 
        enum: ['cpf', 'email', 'phone', 'random'] 
    },
    description: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = transactionSchema;