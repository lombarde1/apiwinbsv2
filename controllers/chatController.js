// No início do arquivo src/controllers/chatController.js
const verificarEProcessarTexto = require('../utils/messageFormatter');
const axios = require('axios');

const DIFY_API_URL = 'http://difyconsole.hocketzap.com/v1/chat-messages';
const DIFY_API_KEY = 'app-sQ1OG9H9mHIok2M9dO0NPzDm';

const MAX_MESSAGES_PER_MINUTE = 8;
const SPAM_TIMEOUT_MINUTES = 5;

const chatController = {

    async getChatHistory(req, res) {
        try {
            const { dbNumber } = req.params; // Pegando dbNumber dos params
            
            // Verificar se dbNumber é 3
            if (dbNumber != 3) {   
                return res.status(429).json({
                    success: false,
                    error: 'Suporte Offline'
                });
            }
            
            const { userId } = req.params;
            const { page = 1, limit = 50 } = req.query;
    
            const chat = await req.Chat.findOne({ 
                userId,
                status: 'active'
            })
            .select('messages conversationId lastMessageAt')
            .lean();
    
            if (!chat) {
                return res.json({
                    success: true,
                    data: {
                        messages: [],
                        conversationId: null,
                        hasMore: false,
                        total: 0
                    }
                });
            }
    
            // Calcular paginação
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const totalMessages = chat.messages.length;
    
            // Garantir que mensagens estejam ordenadas por timestamp
            const messages = chat.messages
                .sort((a, b) => {
                    // Se timestamps são iguais, user vem antes do assistant
                    if (a.timestamp.getTime() === b.timestamp.getTime()) {
                        return a.type === 'user' ? -1 : 1;
                    }
                    return a.timestamp.getTime() - b.timestamp.getTime();
                })
                .slice(startIndex, endIndex)
                .map(msg => ({
                    type: msg.type,
                    content: msg.content,
                    timestamp: msg.timestamp
                }));
    
            res.json({
                success: true,
                data: {
                    messages,
                    conversationId: chat.conversationId,
                    lastMessageAt: chat.lastMessageAt,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalMessages / limit),
                        totalMessages,
                        hasMore: endIndex < totalMessages
                    }
                }
            });
    
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar histórico de mensagens'
            });
        }
    },

    // API para buscar múltiplas conversas (se o usuário tiver mais de uma)
    async getAllChats(req, res) {
        try {
            const { dbNumber } = req.params; // Pegando dbNumber dos params
            
            // Verificar se dbNumber é 3
            if (dbNumber != 3) {   
                return res.status(429).json({
                    success: false,
                    error: 'Suporte Offline'
                });
            }
            
            const { userId } = req.params;

            const chats = await req.Chat.find({ 
                userId 
            })
            .select('conversationId lastMessageAt status messages')
            .sort({ lastMessageAt: -1 })
            .lean();

            const formattedChats = chats.map(chat => ({
                conversationId: chat.conversationId,
                lastMessageAt: chat.lastMessageAt,
                status: chat.status,
                lastMessage: chat.messages[chat.messages.length - 1]?.content || null,
                messageCount: chat.messages.length
            }));

            res.json({
                success: true,
                data: {
                    chats: formattedChats,
                    total: formattedChats.length
                }
            });

        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar conversas'
            });
        }
    },

    async sendMessage(req, res) {
        try {
            const { dbNumber } = req.params; // Pegando dbNumber dos params
            
            // Verificar se dbNumber é 3
            if (dbNumber != 3) {   
                return res.status(429).json({
                    success: false,
                    error: 'Suporte Offline'
                });
            }
            
            const { userId, message } = req.body;

            // Verificar spam
            const isSpamming = await checkSpam(req.Chat, userId);
            if (isSpamming) {
                return res.status(429).json({
                    success: false,
                    error: 'Você está enviando muitas mensagens. Por favor, aguarde alguns minutos.'
                });
            }
    
            // Buscar ou criar chat
            let chat = await req.Chat.findOne({ userId, status: 'active' });
            if (!chat) {
                chat = new req.Chat({ userId });
            }
    
            // Adicionar mensagem do usuário com timestamp atual
            const userMessageTime = new Date();
            chat.messages.push({
                type: 'user',
                content: message,
                timestamp: userMessageTime
            });
    
            // Enviar mensagem para a IA
            const difyResponse = await axios.post(DIFY_API_URL, {
                inputs: {},
                query: message,
                response_mode: 'streaming',
                conversation_id: chat.conversationId || '',
                user: userId,
                files: []
            }, {
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
    
            // Processar resposta da IA
            const iaResponse = processIAResponse(difyResponse.data);
            
            // Extrair conversationId da resposta
            const conversationId = extractConversationId(difyResponse.data);
            
            // Adicionar resposta da IA com timestamp 1 segundo depois
            const iaMessageTime = new Date(userMessageTime.getTime() + 1000);
            chat.messages.push({
                type: 'assistant',
                content: iaResponse,
                timestamp: iaMessageTime
            });
    
            // Atualizar chat
            chat.conversationId = conversationId;
            chat.lastMessageAt = iaMessageTime;
    
            await chat.save();
    
            res.json({
                success: true,
                data: {
                    message: iaResponse,
                    conversationId
                }
            });
    
        } catch (error) {
            console.error('Erro no chat:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar mensagem'
            });
        }
    }
}

// Funções auxiliares
async function checkSpam(Chat, userId) {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const userChat = await Chat.findOne({ userId });

    if (!userChat) return false;

    // Verificar timeout
    if (userChat.spamTimeout && userChat.spamTimeout > new Date()) {
        return true;
    }

    // Contar mensagens no último minuto
    const recentMessages = userChat.messages.filter(
        msg => msg.timestamp > oneMinuteAgo && msg.type === 'user'
    ).length;

    if (recentMessages >= MAX_MESSAGES_PER_MINUTE) {
        userChat.spamCount++;
        userChat.spamTimeout = new Date(Date.now() + (SPAM_TIMEOUT_MINUTES * 60000));
        await userChat.save();
        return true;
    }

    return false;
}

function processIAResponse(rawResponse) {
    try {
        // Extrair mensagens da IA
        const messages = rawResponse.split('\n')
            .filter(line => line.includes('"agent_message"'))
            .map(line => JSON.parse(line.replace('data: ', '')).answer)
            .join('');

        // Formatar mensagem usando a função fornecida
        const formattedMessage = verificarEProcessarTexto(messages);
        
        return formattedMessage.join('\n');
    } catch (error) {
        console.error('Erro ao processar resposta da IA:', error);
        return 'Desculpe, ocorreu um erro ao processar a resposta.';
    }
}


function extractConversationId(rawResponse) {
    try {
        const dataLine = rawResponse.split('\n')
            .find(line => line.includes('"conversation_id"'));
        
        if (dataLine) {
            const data = JSON.parse(dataLine.replace('data: ', ''));
            return data.conversation_id;
        }
        return '';
    } catch (error) {
        console.error('Erro ao extrair conversationId:', error);
        return '';
    }
}

module.exports = chatController;
