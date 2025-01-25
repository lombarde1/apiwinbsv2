// src/controllers/alertController.js
const alertController = {
    async createAlert(req, res) {
        try {
            const { userId, type, description, evidence } = req.body;

            // Criar alerta
            const alert = new req.Alert({
                userId,
                type,
                description,
                evidence
            });
            await alert.save();

            // Atualizar status do usuário
            const user = await req.User.findById(userId);
            if (user) {
                user.alerts = {
                    hasActiveAlerts: true,
                    lastAlertDate: new Date(),
                    alertCount: (user.alerts?.alertCount || 0) + 1
                };
                await user.save();
            }

            res.json({
                success: true,
                data: alert
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao criar alerta'
            });
        }
    },

    async getAlerts(req, res) {
        try {
            const { userId } = req.params;
            const alerts = await req.Alert.find({ userId })
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar alertas'
            });
        }
    },

    async resolveAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { resolutionNotes } = req.body;

            const alert = await req.Alert.findByIdAndUpdate(
                alertId,
                {
                    status: 'resolved',
                    resolvedAt: new Date(),
                    resolutionNotes
                },
                { new: true }
            );

            // Atualizar status do usuário se não houver mais alertas ativos
            const activeAlerts = await req.Alert.findOne({
                userId: alert.userId,
                status: 'active'
            });

            if (!activeAlerts) {
                await req.User.findByIdAndUpdate(alert.userId, {
                    'alerts.hasActiveAlerts': false
                });
            }

            res.json({
                success: true,
                data: alert
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao resolver alerta'
            });
        }
    }
};

module.exports = alertController;