// scripts/setupBsPay.js
const mongoose = require('mongoose');
const ApiCredential = require('../models/ApiCredential');

async function setupDatabase(dbNumber) {
   const dbUrl = `mongodb://darkvips:lombarde1@147.79.111.143:27017/winbase${dbNumber}`;

   try {
       // Tenta conectar à database
       const connection = await mongoose.createConnection(dbUrl, {
           useNewUrlParser: true,
           useUnifiedTopology: true,
           authSource: 'admin'
       });

       // Registra o modelo ApiCredential nesta conexão
       const ApiCredentialModel = connection.model('ApiCredential', ApiCredential);

       // Configura as credenciais
       await ApiCredentialModel.findOneAndUpdate(
           { name: 'bspay' },
           {
            clientId: 'djavan003_6192735811',
            clientSecret: 'f944202c2941fa7bfe03463e933d4a3f54f333df111f6a4aab0aaeac7eb5a12f',
            baseUrl: 'https://api.bspay.co/v2'
           },
           { upsert: true }
       );

       console.log(`Credenciais BS Pay configuradas com sucesso na database winbase${dbNumber}`);
       
       // Fecha a conexão
       await connection.close();

   } catch (error) {
       console.error(`Erro ao configurar database winbase${dbNumber}:`, error);
   }
}

// Função principal para configurar múltiplas databases
async function setupAllDatabases() {
   try {
       // Configura para as primeiras 6 databases (você pode ajustar este número)
       for (let i = 1; i <= 6; i++) {
           await setupDatabase(i);
       }
   } catch (error) {
       console.error('Erro ao configurar databases:', error);
   } finally {
       // Garante que o processo termine
       process.exit(0);
   }
}

// Executa a configuração
setupAllDatabases();