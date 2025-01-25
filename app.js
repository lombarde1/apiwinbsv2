// src/app.js
const express = require('express');
const cors = require('cors');
const databaseMiddleware = require('./middleware/database');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const scratchRoutes = require('./routes/scratchRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // Adicionar esta linha
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const globalRoutes = require('./routes/globalRoutes');
const chatRoutes = require('./routes/chatRoutes'); 
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Adicionar esta linha

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Aplica o middleware de database para todas as rotas com dbNumber
app.use('/:dbNumber', databaseMiddleware);
app.use(globalRoutes); // Note que não usamos o /:dbNumber aqui
// Aplica as rotas
app.use('/:dbNumber', userRoutes);
app.use('/:dbNumber', gameRoutes);
app.use('/:dbNumber', scratchRoutes);
app.use('/:dbNumber', notificationRoutes); // Adicionar esta linha
app.use('/:dbNumber', paymentRoutes);
app.use('/:dbNumber', settingsRoutes);
app.use('/:dbNumber', alertRoutes);
app.use('/:dbNumber', chatRoutes);
app.use('/:dbNumber', withdrawalRoutes);
app.use('/:dbNumber', adminRoutes); // Adicionar esta linha


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});