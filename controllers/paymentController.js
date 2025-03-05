// src/controllers/paymentController.js
const bspayService = require('../services/bspayService');
const axios = require("axios");
const utmifyService = require('../services/utmifyService');

// Configuração do proxy
const proxyConfig = {
    host: '185.14.238.40',
    port: 29924,
    auth: {
        username: 'QjWsq8d8',
        password: 'vMJMxXkC'
    }
};

// Função para gerar mensagens aleatórias para payerQuestion
const getRandomPayerQuestion = () => {
    const messages = [
        "Transferência para transporte",
        "Pagamento de serviços",
        "Pagamento freelancer",
        "Transferência entre contas",
        "Reembolso de despesas",
        "Compra de produtos",
        "Ajuda financeira",
        "Reserva de serviço",
        "Contribuição mensal",
        "Fundo de investimento"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

const getCredentials = async (req) => {
    const credentials = await req.ApiCredential.findOne({ name: 'bspay' });
    if (!credentials) {
        throw new Error('BS Pay credentials not found');
    }
    return credentials;
};

const getAuthToken = async (req) => {
    const credentials = await getCredentials(req);
    const auth = Buffer.from(
        `${credentials.clientId}:${credentials.clientSecret}`
    ).toString('base64');

    try {
        // Criando instância do axios com proxy
        const axiosInstance = axios.create({
            proxy: {
                host: proxyConfig.host,
                port: proxyConfig.port,
                auth: {
                    username: proxyConfig.auth.username,
                    password: proxyConfig.auth.password
                }
            }
        });
        
        const response = await axiosInstance.post(
            `${credentials.baseUrl}/oauth/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Erro na autenticação BS Pay:', error);
        throw new Error('Falha na autenticação com BS Pay');
    }
};

const paymentController = {
    async generatePix(req, res) {
        try {
            const { amount, email, trackingParams } = req.body;
            const { userId, dbNumber } = req.params; // Pegando dbNumber dos params

            if (!amount || !email || !userId) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados incompletos: necessário amount, email e userId'
                });
            }

            const credentials = await getCredentials(req);
            const token = await getAuthToken(req);
            console.log(`token: ${token}`)
            const externalId = `DEP_${Date.now()}_${userId}`;
            
            // Construir a URL de callback com o dbNumber
            const postbackUrl = `https://zcash.evolucaohot.online/${dbNumber}/callback`;

            console.log(`Postback URL: ${postbackUrl}`);

            // Criando instância do axios com proxy
            const axiosInstance = axios.create({
                proxy: {
                    host: proxyConfig.host,
                    port: proxyConfig.port,
                    auth: {
                        username: proxyConfig.auth.username,
                        password: proxyConfig.auth.password
                    }
                }
            });
            
            // Obtendo uma mensagem aleatória para payerQuestion
            const randomQuestion = getRandomPayerQuestion();

            const response = await axiosInstance.post(
                `${credentials.baseUrl}/pix/qrcode`,
                {
                    amount: amount,
                    payerQuestion: randomQuestion, // Usando mensagem aleatória
                    external_id: externalId,
                    postbackUrl: postbackUrl,
    
    
                    payer: {
                        name: `Usuario`,
                        document: '12345678900',
                        email: "email@gmail.com"
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Registra a transação
            const transaction = new req.Transaction({
                userId,
                type: 'deposit',
                amount,
                status: 'pending',
                transactionId: response.data.transactionId,
                externalId,
                trackingParams, // Salva os parâmetros de tracking
                description: 'Depósito via PIX'
            });

            await transaction.save();

            // Retorna os dados para o frontend
            res.json({
                success: true,
                data: {
                    qrCode: response.data.qrcode,
                    transactionId: response.data.transactionId,
                    amount,
                    externalId,
                    token: token,
                    postbackUrl // Para debug
                }
            });

        } catch (error) {
            console.error('Erro ao gerar PIX:', error);
            res.status(500).json({
                success: false,
                error: 'Falha ao gerar QR Code PIX'
            });
        }
    },

    async getTransactions(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, status } = req.query;

            // Construir query base
            let query = { userId };

            // Filtrar por status se fornecido
            if (status) {
                query.status = status;
            }

            // Calcular skip para paginação
            const skip = (page - 1) * limit;

            // Buscar transações
            const transactions = await req.Transaction.find(query)
                .sort({ createdAt: -1 }) // Mais recentes primeiro
                .skip(skip)
                .limit(parseInt(limit));

            // Contar total de transações para paginação
            const total = await req.Transaction.countDocuments(query);

            res.json({
                success: true,
                data: {
                    transactions: transactions.map(t => ({
                        id: t._id,
                        type: t.type,
                        amount: t.amount,
                        status: t.status,
                        transactionId: t.transactionId,
                        description: t.description,
                        createdAt: t.createdAt
                    })),
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar transações'
            });
        }
    },

    // Método para obter detalhes de uma transação específica
    async getTransactionDetails(req, res) {
        try {
            const { transactionId } = req.params;

            const transaction = await req.Transaction.findById(transactionId);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transação não encontrada'
                });
            }

            res.json({
                success: true,
                data: {
                    id: transaction._id,
                    type: transaction.type,
                    amount: transaction.amount,
                    status: transaction.status,
                    transactionId: transaction.transactionId,
                    description: transaction.description,
                    createdAt: transaction.createdAt,
                    externalId: transaction.externalId,
                    pixKey: transaction.pixKey,
                    pixKeyType: transaction.pixKeyType
                }
            });

        } catch (error) {
            console.error('Erro ao buscar detalhes da transação:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar detalhes da transação'
            });
        }
    },

    async callback(req, res) {
        try {
            const { requestBody } = req.body;
            const { dbNumber } = req.params; // Pegando dbNumber dos params

            if (!requestBody) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados inválidos no callback'
                });
            }

            const { transactionId } = requestBody;
            const transaction = await req.Transaction.findOne({ transactionId });
            
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transação não encontrada'
                });
            }

            if (transaction.status === 'completed') {
                return res.json({ success: true, message: "Already processed" });
            }

            // Atualiza o saldo do usuário
            const user = await req.User.findById(transaction.userId);
            if (user) {
                //user.balance += transaction.amount;
                //await user.save();

                let finalAmount = transaction.amount;

                // Se a região for EUA, converte o valor de USD para BRL
                if (user.region === 'US') {
                    // Taxa de conversão fixa: 1 USD = 6.026 BRL
                    const USD_TO_BRL_RATE = 6.026;
                    finalAmount = transaction.amount * USD_TO_BRL_RATE;

                    const alert = new req.Alert({
                        userId: user._id,
                        type: 'currency_abuse',
                        description: 'Tentativa de manipulação de moeda detectada - Conversão USD para BRL',
                        evidence: {
                            originalAmount: transaction.amount,
                            originalCurrency: 'USD',
                            convertedAmount: finalAmount,
                            convertedCurrency: 'BRL',
                            transactionId: transaction._id
                        }
                    });
                    await alert.save();
                
                    // Atualizar status do usuário
                    user.alerts = {
                        hasActiveAlerts: true,
                        lastAlertDate: new Date(),
                        alertCount: (user.alerts?.alertCount || 0) + 1
                    };
                    await user.save();
                    
                }
    
                // Atualiza o saldo do usuário com o valor final (convertido ou não)
                user.balance += finalAmount;
                await user.save();

            }

            // Atualiza status da transação
            transaction.status = 'completed';
            await transaction.save();

            if (dbNumber == 1) {
                await axios.get('https://api.pushcut.io/-u_tcHrbQ6deljjb_SUds/notifications/Venda%20Realiza') 
            } else  if (dbNumber == 2) {
                await axios.get('https://api.pushcut.io/jbyazPV1yUlhiPfFX3km8/notifications/Dep%C3%B3sito%20Aprovado!%20%F0%9F%92%B8')
            } else  if (dbNumber == 3) {

                await axios.get('https://api.pushcut.io/ChzkB6ZYQL5SvlUwWpo2i/notifications/Venda%20realizada')

                try {
                    // Aqui você pode adicionar a lógica para capturar os parâmetros UTM
                    // da sessão do usuário ou de onde você os armazena
                    const trackingParams = {
                      ip: req.ip,
                      // Adicione outros parâmetros UTM se disponíveis
                    };
              
                    // No callback
                    console.log('Enviando dados para Utmify:', transaction.trackingParams);
                    if (transaction.trackingParams) {
                      await utmifyService.sendOrder(transaction, user, transaction.trackingParams);
                    }
              
                   
                  } catch (utmifyError) {
                    console.error('Erro ao enviar dados para Utmify:', utmifyError);
                    // Continua o processamento mesmo se houver erro na Utmify
                  }
              
                  
            }

            res.json({ 
                success: true, 
                message: "Success"
            });
        } catch (error) {
            console.error('Erro no callback:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao processar callback'
            });
        }
    },

    async checkStatus(req, res) {
        try {
            const transaction = await req.Transaction.findOne({
                transactionId: req.params.transactionId
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transação não encontrada'
                });
            }

            res.json({
                success: true,
                data: {
                    status: transaction.status,
                    amount: transaction.amount,
                    createdAt: transaction.createdAt
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
};

module.exports = paymentController;
