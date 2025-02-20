// src/app.js
const express = require('express');
const cors = require('cors');
const databaseMiddleware = require('./middleware/database');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const scratchRoutes = require('./routes/scratchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const globalRoutes = require('./routes/globalRoutes');
const chatRoutes = require('./routes/chatRoutes'); 
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bspayRoutes = require('./routes/bspayRoutes');
const app = express();
const { trackingMiddleware, trackingRoutes } = require('./middleware/trackingMiddleware');

// Middleware
app.use(cors());
app.use(express.json());
app.use(bspayRoutes); 

// Aplicar middleware de tracking
app.use(trackingMiddleware);

// Configurar rotas de tracking (sem restrições de acesso)
app.post('/api/tracking/save-utms', trackingRoutes.saveUTMs);
app.get('/api/tracking/get-utms', trackingRoutes.getUTMs);

// Aplica o middleware de database para todas as rotas com dbNumber
app.use('/:dbNumber', databaseMiddleware);
app.use(globalRoutes); // Note que não usamos o /:dbNumber aqui

// Aplica as rotas
app.use('/:dbNumber', userRoutes);
app.use('/:dbNumber', gameRoutes);
app.use('/:dbNumber', scratchRoutes);
app.use('/:dbNumber', notificationRoutes);
app.use('/:dbNumber', paymentRoutes);
app.use('/:dbNumber', settingsRoutes);
app.use('/:dbNumber', alertRoutes);
app.use('/:dbNumber', chatRoutes);
app.use('/:dbNumber', withdrawalRoutes);
app.use('/:dbNumber', adminRoutes);

const PORT = process.env.PORT || 8010;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});