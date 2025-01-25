// src/controllers/settingsController.js
const bcrypt = require('bcryptjs');

const settingsController = {
    // Buscar configurações atuais
    async getSettings(req, res) {
        try {
            const userId = req.params.userId;
            const user = await req.User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    fullName: user.fullName,
                    email: user.email,
                    region: user.region,
                    settings: user.settings
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar configurações'
            });
        }
    },

    // Atualizar região
    async updateRegion(req, res) {
        try {
            const { region } = req.body;
            const userId = req.params.userId;

            if (!['BR', 'US'].includes(region)) {
                return res.status(400).json({
                    success: false,
                    error: 'Região inválida'
                });
            }

            const user = await req.User.findByIdAndUpdate(
                userId,
                { 
                    region,
                    'settings.language': region === 'BR' ? 'pt-BR' : 'en-US',
                    'settings.currency': region === 'BR' ? 'BRL' : 'USD'
                },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    region: user.region,
                    settings: user.settings
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar região'
            });
        }
    },

    // Atualizar nome
    async updateName(req, res) {
        try {
            const { fullName } = req.body;
            const userId = req.params.userId;

            if (!fullName || fullName.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome inválido'
                });
            }

            const user = await req.User.findByIdAndUpdate(
                userId,
                { fullName },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    fullName: user.fullName
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar nome'
            });
        }
    },

    // Atualizar email
    async updateEmail(req, res) {
        try {
            const { email } = req.body;
            const userId = req.params.userId;

            if (!email || !email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    error: 'Email inválido'
                });
            }

            // Verificar se email já está em uso
            const existingUser = await req.User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email já está em uso'
                });
            }

            const user = await req.User.findByIdAndUpdate(
                userId,
                { email: email.toLowerCase() },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar email'
            });
        }
    },

    // Atualizar senha
    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.params.userId;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Nova senha deve ter no mínimo 6 caracteres'
                });
            }

            const user = await req.User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Verificar senha atual
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: 'Senha atual incorreta'
                });
            }

            // Atualizar senha
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Senha atualizada com sucesso'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar senha'
            });
        }
    }
};

module.exports = settingsController;