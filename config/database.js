// src/config/database.js
const mongoose = require('mongoose');

class DatabaseManager {
    constructor() {
        this.connections = new Map();
        this.connectionPromises = new Map();
        this.maxConnections = 50; // Limite máximo de conexões
        this.connectionTimeout = 30000; // 30 segundos
        this.lastUsed = new Map();
        
        // Iniciar limpeza periódica de conexões inativas
        setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000); // A cada 5 minutos
    }

    async getConnection(dbName, connectionString) {
        const now = Date.now();
        
        // Atualizar timestamp de último uso
        this.lastUsed.set(dbName, now);

        // Verificar se já existe uma conexão ativa
        if (this.connections.has(dbName)) {
            const connection = this.connections.get(dbName);
            if (connection.readyState === 1) { // Conectado
                return connection;
            }
            // Se a conexão não estiver ativa, remover para reconectar
            this.connections.delete(dbName);
        }

        // Verificar se já existe uma promessa de conexão em andamento
        if (this.connectionPromises.has(dbName)) {
            return await this.connectionPromises.get(dbName);
        }

        // Criar nova promessa de conexão
        const connectionPromise = this.createConnection(dbName, connectionString);
        this.connectionPromises.set(dbName, connectionPromise);

        try {
            const connection = await connectionPromise;
            this.connections.set(dbName, connection);
            return connection;
        } finally {
            this.connectionPromises.delete(dbName);
        }
    }

    async createConnection(dbName, connectionString) {
        // Verificar limite de conexões
        if (this.connections.size >= this.maxConnections) {
            await this.removeOldestConnection();
        }

        const connection = await mongoose.createConnection(connectionString, {
            authSource: 'admin',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: this.connectionTimeout,
            heartbeatFrequencyMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10, // Limite de conexões por instância
            minPoolSize: 2,  // Manter algumas conexões ativas
            maxIdleTimeMS: 30000, // Tempo máximo de conexão ociosa
        });

        // Configurar listeners de eventos
        connection.on('error', (error) => {
            console.error(`Erro na conexão ${dbName}:`, error);
            this.connections.delete(dbName);
        });

        connection.on('disconnected', () => {
            console.log(`Conexão ${dbName} desconectada`);
            this.connections.delete(dbName);
        });

        return connection;
    }

    async removeOldestConnection() {
        let oldest = null;
        let oldestTime = Date.now();

        for (const [dbName, timestamp] of this.lastUsed.entries()) {
            if (timestamp < oldestTime) {
                oldest = dbName;
                oldestTime = timestamp;
            }
        }

        if (oldest && this.connections.has(oldest)) {
            const connection = this.connections.get(oldest);
            await connection.close();
            this.connections.delete(oldest);
            this.lastUsed.delete(oldest);
        }
    }

    async cleanupInactiveConnections() {
        const now = Date.now();
        const inactiveThreshold = 10 * 60 * 1000; // 10 minutos

        for (const [dbName, timestamp] of this.lastUsed.entries()) {
            if (now - timestamp > inactiveThreshold) {
                if (this.connections.has(dbName)) {
                    const connection = this.connections.get(dbName);
                    await connection.close();
                    this.connections.delete(dbName);
                    this.lastUsed.delete(dbName);
                }
            }
        }
    }
}

const databaseManager = new DatabaseManager();

module.exports = databaseManager;