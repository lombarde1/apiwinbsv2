// src/controllers/adminController.js

const adminController = {
    // Listar todos os usuários com paginação e filtros
    async listUsers(req, res) {
        try {
            const { page = 1, limit = 20, status, search } = req.query;
            const query = {};

            // Aplicar filtros
            if (status) {
                query.status = status;
            }

            if (search) {
                query.$or = [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await req.User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await req.User.countDocuments(query);

            res.json({
                success: true,
                data: {
                    users: users.map(user => ({
                        id: user._id,
                        fullName: user.fullName,
                        email: user.email,
                        balance: user.balance,
                        status: user.status,
                        region: user.region,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin,
                        alerts: user.alerts
                    })),
                    pagination: {
                        total,
                        page: parseInt(page),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar usuários'
            });
        }
    },

    // Atualizar saldo do usuário
    async updateUserBalance(req, res) {
        try {
            const { userId } = req.params;
            const { balance, reason } = req.body;

            if (typeof balance !== 'number') {
                return res.status(400).json({
                    success: false,
                    error: 'O saldo deve ser um número'
                });
            }

            const user = await req.User.findByIdAndUpdate(
                userId,
                { balance },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Registrar transação administrativa
            const transaction = new req.Transaction({
                userId,
                type: 'deposit',
                amount: balance - user.balance,
                status: 'completed',
                description: reason || 'Ajuste administrativo de saldo'
            });
            await transaction.save();

            res.json({
                success: true,
                data: {
                    user,
                    transaction
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar saldo:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar saldo'
            });
        }
    },

    // Listar todos os saques pendentes
    async listPendingWithdrawals(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;

            const withdrawals = await req.Withdrawal.find({ status: 'pending' })
                .populate('userId', 'fullName email')
                .sort({ requestedAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await req.Withdrawal.countDocuments({ status: 'pending' });

            res.json({
                success: true,
                data: {
                    withdrawals: withdrawals.map(w => ({
                        id: w._id,
                        user: w.userId,
                        amount: w.amount,
                        pixKey: w.pixKey,
                        pixKeyType: w.pixKeyType,
                        requestedAt: w.requestedAt,
                        expiresAt: w.expiresAt
                    })),
                    pagination: {
                        total,
                        page: parseInt(page),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao listar saques:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar saques'
            });
        }
    },

    // Aprovar ou rejeitar saque
    async processWithdrawal(req, res) {
        try {
            const { withdrawalId } = req.params;
            const { action, rejectionReason } = req.body;

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Ação inválida'
                });
            }

            const withdrawal = await req.Withdrawal.findById(withdrawalId)
                .populate('userId');

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    error: 'Saque não encontrado'
                });
            }

            if (withdrawal.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: 'Este saque já foi processado'
                });
            }

            if (action === 'reject') {
                withdrawal.status = 'rejected';
                withdrawal.rejectionReason = rejectionReason || 'Saque rejeitado pela administração';
                withdrawal.processedAt = new Date();

                // Devolver saldo ao usuário
                const user = withdrawal.userId;
                user.balance += withdrawal.amount;
                await user.save();
            } else {
                withdrawal.status = 'approved';
                withdrawal.processedAt = new Date();
            }

            await withdrawal.save();

            res.json({
                success: true,
                data: withdrawal
            });
        } catch (error) {
            console.error('Erro ao processar saque:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar saque'
            });
        }
    },

    async getCredentialsPage(req, res) {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>BSPay Config</title>
                <style>
                    body { padding: 20px; font-family: Arial; }
                    .container { max-width: 600px; margin: 0 auto; }
                    select, input { margin: 10px 0; padding: 5px; width: 100%; }
                    button { padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; }
                    .message { padding: 10px; margin: 10px 0; }
                    .error { background: #ffebee; }
                    .success { background: #e8f5e9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>BSPay Credentials Manager</h2>
                    <select id="dbSelect">
                        <option value="">Select Database</option>
                        ${Array.from({length: 6}, (_, i) => `<option value="${i}">Database ${i}</option>`)}
                    </select>
                    
                    <form id="credentialsForm">
                        <input type="text" id="clientId" placeholder="Client ID" required>
                        <input type="text" id="clientSecret" placeholder="Client Secret" required>
                        <input type="text" id="baseUrl" placeholder="Base URL" required>
                        <button type="submit">Save Credentials</button>
                    </form>
                    <div id="message"></div>
                </div>

                <script>
                    document.getElementById('dbSelect').addEventListener('change', async (e) => {
                        const db = e.target.value;
                        if (!db) return;
                        
                        try {
                            const response = await fetch(\`/\${db}/admin/credentials/bspay\`);
                            const data = await response.json();
                            
                            if (data.success) {
                                document.getElementById('clientId').value = data.credentials?.clientId || '';
                                document.getElementById('clientSecret').value = data.credentials?.clientSecret || '';
                                document.getElementById('baseUrl').value = data.credentials?.baseUrl || '';
                            }
                        } catch (error) {
                            showMessage('Error loading credentials', true);
                        }
                    });

                    document.getElementById('credentialsForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const db = document.getElementById('dbSelect').value;
                        if (!db) {
                            showMessage('Please select a database', true);
                            return;
                        }

                        const credentials = {
                            clientId: document.getElementById('clientId').value,
                            clientSecret: document.getElementById('clientSecret').value,
                            baseUrl: document.getElementById('baseUrl').value
                        };

                        try {
                            const response = await fetch(\`/\${db}/admin/credentials/bspay\`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(credentials)
                            });
                            
                            const data = await response.json();
                            showMessage(data.success ? 'Credentials saved successfully' : 'Error saving credentials', !data.success);
                        } catch (error) {
                            showMessage('Error saving credentials', true);
                        }
                    });

                    function showMessage(text, isError) {
                        const messageDiv = document.getElementById('message');
                        messageDiv.textContent = text;
                        messageDiv.className = \`message \${isError ? 'error' : 'success'}\`;
                    }
                </script>
            </body>
            </html>
        `);
    },

    async getCredentials(req, res) {
        try {
            const credentials = await req.ApiCredential.findOne({ name: 'bspay' });
            res.json({ success: true, credentials });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error fetching credentials' });
        }
    },

    async updateCredentials(req, res) {
        try {
            const { clientId, clientSecret, baseUrl } = req.body;
            
            await req.ApiCredential.findOneAndUpdate(
                { name: 'bspay' },
                { clientId, clientSecret, baseUrl },
                { upsert: true }
            );

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error updating credentials' });
        }
    },

    // Listar todos os chats de suporte
    async listSupportChats(req, res) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const query = {};

            if (status) {
                query.status = status;
            }

            const chats = await req.Chat.find(query)
                .populate('userId', 'fullName email')
                .sort({ lastMessageAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await req.Chat.countDocuments(query);

            res.json({
                success: true,
                data: {
                    chats: chats.map(chat => ({
                        id: chat._id,
                        user: chat.userId,
                        conversationId: chat.conversationId,
                        status: chat.status,
                        lastMessageAt: chat.lastMessageAt,
                        messageCount: chat.messages.length,
                        lastMessage: chat.messages[chat.messages.length - 1]
                    })),
                    pagination: {
                        total,
                        page: parseInt(page),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao listar chats:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar chats'
            });
        }
    },

    // Bloquear/Desbloquear usuário
    async toggleUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { status, reason } = req.body;

            if (!['active', 'blocked'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Status inválido'
                });
            }

            const user = await req.User.findByIdAndUpdate(
                userId,
                { status },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Criar alerta se o usuário foi bloqueado
            if (status === 'blocked') {
                const alert = new req.Alert({
                    userId,
                    type: 'terms_violation',
                    description: reason || 'Usuário bloqueado pela administração',
                    status: 'active'
                });
                await alert.save();

                // Atualizar status de alertas do usuário
                user.alerts = {
                    hasActiveAlerts: true,
                    lastAlertDate: new Date(),
                    alertCount: (user.alerts?.alertCount || 0) + 1,
                    lastAlertType: 'terms_violation'
                };
                await user.save();
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao alterar status do usuário'
            });
        }
    },

    // Dashboard com estatísticas gerais
    async getDashboardStats(req, res) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const stats = {
                users: {
                    total: await req.User.countDocuments(),
                    active: await req.User.countDocuments({ status: 'active' }),
                    blocked: await req.User.countDocuments({ status: 'blocked' }),
                    newToday: await req.User.countDocuments({ createdAt: { $gte: today } })
                },
                withdrawals: {
                    pending: await req.Withdrawal.countDocuments({ status: 'pending' }),
                    approvedToday: await req.Withdrawal.countDocuments({
                        status: 'approved',
                        processedAt: { $gte: today }
                    })
                },
                transactions: {
                    totalToday: await req.Transaction.countDocuments({
                        createdAt: { $gte: today }
                    }),
                    volumeToday: await req.Transaction.aggregate([
                        { $match: { createdAt: { $gte: today } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]).then(result => result[0]?.total || 0)
                },
                support: {
                    activeChats: await req.Chat.countDocuments({ status: 'active' }),
                    totalMessages: await req.Chat.aggregate([
                        { $unwind: "$messages" },
                        { $group: { _id: null, total: { $sum: 1 } } }
                    ]).then(result => result[0]?.total || 0)
                }
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas'
            });
        }
    }
};

module.exports = adminController;