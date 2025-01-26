// src/routes/bspayRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const apiCredentialSchema = require('../models/ApiCredential');

// Função auxiliar para conectar ao banco
async function connectToDatabase(dbNumber) {
    try {
        const dbName = `winbase${dbNumber}`;
        const connectionString = `mongodb://darkvips:lombarde1@147.79.111.143:27017/${dbName}?authSource=admin`;
        return await mongoose.createConnection(connectionString);
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// GET credentials
router.get('/:dbNumber/bspay/credentials', async (req, res) => {
    let connection;
    try {
        const { dbNumber } = req.params;
        
        // Conectar diretamente ao banco
        connection = await connectToDatabase(dbNumber);
        const ApiCredential = connection.model('ApiCredential', apiCredentialSchema);
        
        const credentials = await ApiCredential.findOne({ name: 'bspay' });
        
        res.json({
            success: true,
            credentials: credentials || null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching credentials'
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// POST credentials
router.post('/:dbNumber/bspay/credentials', async (req, res) => {
    let connection;
    try {
        const { dbNumber } = req.params;
        const { clientId, clientSecret, baseUrl } = req.body;

        // Validar campos
        if (!clientId || !clientSecret || !baseUrl) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Conectar diretamente ao banco
        connection = await connectToDatabase(dbNumber);
        const ApiCredential = connection.model('ApiCredential', apiCredentialSchema);
        
        await ApiCredential.findOneAndUpdate(
            { name: 'bspay' },
            {
                name: 'bspay',
                clientId,
                clientSecret,
                baseUrl
            },
            { upsert: true }
        );

        res.json({
            success: true,
            message: 'Credentials updated successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating credentials'
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;