// src/controllers/withdrawalController.js
const withdrawalController = {
    // Solicitar saque
    async requestWithdrawal(req, res) {
        try {
            const { userId } = req.params;
            const { amount, pixKey, pixKeyType } = req.body;

            // Validar valor mínimo
            if (amount < 60) {
                return res.status(400).json({
                    success: false,
                    error: 'Valor mínimo para saque é R$ 60,00'
                });
            }

            // Buscar usuário
            const user = await req.User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Verificar saldo
            if (user.balance < amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Saldo insuficiente'
                });
            }

            // Verificar se já tem saque pendente
            const pendingWithdrawal = await req.Withdrawal.findOne({
                userId,
                status: 'pending'
            });

            if (pendingWithdrawal) {
                return res.status(400).json({
                    success: false,
                    error: 'Você já possui um saque pendente'
                });
            }

            // Criar saque
            const withdrawal = new req.Withdrawal({
                userId,
                amount,
                pixKey,
                pixKeyType,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            // Deduzir saldo do usuário
            user.balance -= amount;
            await user.save();
            await withdrawal.save();

            // Agendar rejeição automática
            setTimeout(async () => {
                try {
                    const withdrawalToCancel = await req.Withdrawal.findById(withdrawal._id);
                    if (withdrawalToCancel && withdrawalToCancel.status === 'pending') {
                        withdrawalToCancel.status = 'rejected';
                        withdrawalToCancel.rejectionReason = 'Tempo limite excedido';
                        withdrawalToCancel.processedAt = new Date();
                        await withdrawalToCancel.save();

                        // Devolver saldo ao usuário
                        const user = await req.User.findById(userId);
                        user.balance += amount;
                        await user.save();
                    }
                } catch (error) {
                    console.error('Erro ao cancelar saque:', error);
                }
            }, 24 * 60 * 60 * 1000); // 24 horas

            res.json({
                success: true,
                data: {
                    withdrawal: {
                        id: withdrawal._id,
                        amount,
                        status: withdrawal.status,
                        requestedAt: withdrawal.requestedAt,
                        expiresAt: withdrawal.expiresAt
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao solicitar saque:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar solicitação de saque'
            });
        }
    },

    // Listar saques do usuário
    async listWithdrawals(req, res) {
        try {
            const { userId } = req.params;
            const { status, page = 1, limit = 20 } = req.query;

            const query = { userId };
            if (status) {
                query.status = status;
            }

            const withdrawals = await req.Withdrawal.find(query)
                .sort({ requestedAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean();

            const total = await req.Withdrawal.countDocuments(query);

            res.json({
                success: true,
                data: {
                    withdrawals: withdrawals.map(w => ({
                        id: w._id,
                        amount: w.amount,
                        pixKey: w.pixKey,
                        pixKeyType: w.pixKeyType,
                        status: w.status,
                        requestedAt: w.requestedAt,
                        processedAt: w.processedAt,
                        expiresAt: w.expiresAt,
                        rejectionReason: w.rejectionReason
                    })),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalWithdrawals: total,
                        hasMore: page * limit < total
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
    }
};

module.exports = withdrawalController;