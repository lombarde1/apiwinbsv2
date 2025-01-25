// src/controllers/notificationController.js
const notificationController = {
    // Listar notificações do usuário
    async listNotifications(req, res) {
        try {
            const userId = req.params.userId;
            const Notification = req.Notification;

            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);

            const unreadCount = await Notification.countDocuments({
                userId,
                read: false
            });

            res.json({
                success: true,
                notifications,
                unreadCount
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar notificações'
            });
        }
    },

    // Marcar notificação como lida
    async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            const Notification = req.Notification;

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { read: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notificação não encontrada'
                });
            }

            res.json({
                success: true,
                notification
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                error: 'Erro ao marcar notificação como lida'
            });
        }
    },

    // Marcar todas como lidas
    async markAllAsRead(req, res) {
        try {
            const userId = req.params.userId;
            const Notification = req.Notification;

            await Notification.updateMany(
                { userId, read: false },
                { read: true }
            );

            res.json({
                success: true,
                message: 'Todas as notificações foram marcadas como lidas'
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                error: 'Erro ao marcar notificações como lidas'
            });
        }
    }
};

// Função auxiliar para criar notificações
async function createNotification(req, type, title, message, data = {}) {
    try {
        const Notification = req.Notification;
        const notification = new Notification({
            userId: req.params.userId,
            type,
            title,
            message,
            data
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.log('Erro ao criar notificação:', error);
        return null;
    }
}

module.exports = {
    notificationController,
    createNotification
};