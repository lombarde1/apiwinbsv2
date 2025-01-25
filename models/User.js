// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    balance: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'blocked', 'pending'],
        default: 'active'
    },
    region: {
        type: String,
        enum: ['BR', 'US'],
        default: 'BR'
    },
    settings: {
        language: {
            type: String,
            enum: ['pt-BR', 'en-US'],
            default: 'pt-BR'
        },
        currency: {
            type: String,
            enum: ['BRL', 'USD'],
            default: 'BRL'
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user'
    },
    alerts: {
        hasActiveAlerts: {
            type: Boolean,
            default: false
        },
        lastAlertDate: {
            type: Date
        },
        alertCount: {
            type: Number,
            default: 0
        },
        lastAlertType: {
            type: String,
            enum: ['currency_abuse', 'suspicious_activity', 'terms_violation', 'multiple_accounts']
        }
    }
});

// Método para verificar se o usuário tem alertas ativos
userSchema.methods.hasAlerts = function() {
    return this.alerts.hasActiveAlerts;
};

// Método para adicionar um alerta
userSchema.methods.addAlert = function(alertType) {
    this.alerts.hasActiveAlerts = true;
    this.alerts.lastAlertDate = new Date();
    this.alerts.alertCount += 1;
    this.alerts.lastAlertType = alertType;
};

// Método para limpar alertas
userSchema.methods.clearAlerts = function() {
    this.alerts.hasActiveAlerts = false;
    this.alerts.lastAlertType = null;
};

module.exports = userSchema;