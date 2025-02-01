// src/middleware/database.js
const databaseManager = require('../config/database');
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

async function ensureDefaultGames(Game) {
    try {
        const operations = DEFAULT_GAMES.map(defaultGame => ({
            updateOne: {
                filter: { name: defaultGame.name },
                update: { $setOnInsert: defaultGame },
                upsert: true
            }
        }));

        await Game.bulkWrite(operations);
    } catch (error) {
        console.error('Erro ao criar jogos padrão:', error);
    }
}

const databaseMiddleware = async (req, res, next) => {
    try {
        const dbNumber = req.params.dbNumber;
        if (!dbNumber || dbNumber === 'favicon.ico') {
            return next();
        }

        const dbName = `winbase${dbNumber}`;
        const connectionString = `mongodb://darkvips:lombarde1@147.79.111.143:27017/${dbName}`;
        
        try {
            const connection = await databaseManager.getConnection(dbName, connectionString);
            
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
            console.error(`Erro na conexão com ${dbName}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro ao conectar ao banco de dados'
            });
        }
    } catch (error) {
        console.error('Erro no middleware:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

module.exports = databaseMiddleware;