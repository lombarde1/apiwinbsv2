// src/config/database.js
const mongoose = require('mongoose');

const connections = {};


// src/config/database.js
async function connectToDatabase(connectionString) {
    if (connectionString.includes('favicon.ico')) return;
    try {
        console.log(`Conectando ao banco de dados: ${connectionString}`);

        const connection = await mongoose.createConnection(connectionString, {
            authSource: 'admin',
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`Conexão bem-sucedida ao banco de dados: ${connectionString}`);
        return connection;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}

module.exports = connectToDatabase;