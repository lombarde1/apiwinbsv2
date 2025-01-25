// src/middleware/database.js
const mongoose = require('mongoose');
const connectToDatabase = require('../config/database');
const userSchema = require('../models/User');
const gameSchema = require('../models/Game');
const scratchSchema = require('../models/Scratch');
const notificationSchema = require('../models/Notification'); 
const transactionSchema = require('../models/Transaction');
const apiCredentialSchema = require('../models/ApiCredential');
const chatSchema = require('../models/Chat');
const alertSchema = require('../models/Alert');
const withdrawalSchema = require('../models/Withdrawal');
const DEFAULT_GAMES = require('../config/defaultGames');

// Função para garantir jogos padrão
async function ensureDefaultGames(Game) {
    try {
        for (const defaultGame of DEFAULT_GAMES) {
            const existingGame = await Game.findOne({ name: defaultGame.name });
            if (!existingGame) {
                await Game.create(defaultGame);
                console.log(`Jogo padrão criado: ${defaultGame.name}`);
            }
        }
    } catch (error) {
        console.error('Erro ao criar jogos padrão:', error);
    }
}

// src/middleware/database.js
const databaseMiddleware = async (req, res, next) => {
    try {
        const dbNumber = req.params.dbNumber;
        const dbName = `winbase${dbNumber}`;
        const connectionString = `mongodb://darkvips:lombarde1@147.79.111.143:27017/${dbName}`;
        
        const connection = await connectToDatabase(connectionString);
        
        // Define os modelos
        req.dbConnection = connection;
        req.User = connection.model('User', userSchema);
        req.Game = connection.model('Game', gameSchema);
        req.Scratch = connection.model('Scratch', scratchSchema);
        req.Notification = connection.model('Notification', notificationSchema);
        req.Transaction = connection.model('Transaction', transactionSchema);
        req.ApiCredential = connection.model('ApiCredential', apiCredentialSchema);
        req.Alert = connection.model('Alert', alertSchema);
        req.Chat = connection.model('Chat', chatSchema);
        req.Withdrawal = connection.model('Withdrawal', withdrawalSchema);

        // Garante que os jogos padrão existam
        await ensureDefaultGames(req.Game);
        
        next();
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Erro ao conectar ao banco de dados' 
        });
    }
};

module.exports = databaseMiddleware;