// middleware/trackingMiddleware.js
const Redis = require('ioredis');
const redisClient = new Redis({
  host: '147.79.111.143',
  port: 6379,
  password: 'darklindo',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Rota para salvar UTMs
const saveUTMs = async (req, res) => {
  console.log('Salvando UTMs...');
  const { ip, ...utmData } = req.body;

  if (!ip) {
    return res.status(400).json({ 
      success: false, 
      error: 'IP não fornecido' 
    });
  }

  console.log('Salvando UTMs para IP:', ip);

  try {
    const key = `utmwinbs:${ip}`;
    const data = {
      ...utmData,
      timestamp: Date.now()
    };

    console.log('Dados a serem salvos:', data);
    await redisClient.setex(key, 24 * 60 * 60, JSON.stringify(data));
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar UTMs:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar UTMs' });
  }
};

// Rota para recuperar UTMs
const getUTMs = async (req, res) => {
  const { ip } = req.query;

  if (!ip) {
    return res.status(400).json({ 
      success: false, 
      error: 'IP não fornecido na query' 
    });
  }

  console.log('Recuperando UTMs para IP:', ip);

  try {
    const key = `utmwinbs:${ip}`;
    const utmData = await redisClient.get(key);
    
    if (!utmData) {
      console.log('Nenhum dado encontrado para o IP:', ip);
      return res.json({ success: true, found: false, data: null });
    }

    const parsedData = JSON.parse(utmData);
    console.log('Dados encontrados:', parsedData);
    res.json({ success: true, found: true, data: parsedData });
  } catch (error) {
    console.error('Erro ao recuperar UTMs:', error);
    res.status(500).json({ success: false, error: 'Erro ao recuperar UTMs' });
  }
};

// Middleware para injetar UTMs em todas as respostas
const trackingMiddleware = async (req, res, next) => {
  try {
    const { ip } = req.query;
    if (!ip) {
      next();
      return;
    }

    const utmData = await redisClient.get(`utmwinbs:${ip}`);
    if (utmData) {
      req.utmData = JSON.parse(utmData);
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de tracking:', error);
    next();
  }
};

module.exports = {
  trackingMiddleware,
  trackingRoutes: {
    saveUTMs,
    getUTMs
  }
};