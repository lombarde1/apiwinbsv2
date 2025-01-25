// src/controllers/userController.js
const userController = {
    async register(req, res) {
        try {
            const { fullName, email, password } = req.body;
            const User = req.User;

            // Validações
            if (!fullName) {
                return res.status(400).json({
                    success: false,
                    error: 'O nome completo é obrigatório'
                });
            }

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'O email é obrigatório'
                });
            }

            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: 'A senha é obrigatória'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'A senha deve ter no mínimo 6 caracteres'
                });
            }

            // Verifica email
            const existingUser = await User.findOne({ email: email.toLowerCase() });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Este email já está cadastrado'
                });
            }

            const user = new User({
                fullName,
                email,
                password,
                lastLogin: new Date()
            });
            await user.save();

            res.json({
                success: true,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    balance: user.balance,
                    status: user.status,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor'
            });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const User = req.User;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'O email é obrigatório'
                });
            }

            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: 'A senha é obrigatória'
                });
            }

            const user = await User.findOne({ 
                email: email.toLowerCase(), 
                password 
            });
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Email ou senha incorretos' 
                });
            }

            if (user.status === 'blocked') {
                return res.status(403).json({
                    success: false,
                    error: 'Sua conta está bloqueada'
                });
            }

            // Atualiza último login
            user.lastLogin = new Date();
            await user.save();

            res.json({
                success: true,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    balance: user.balance,
                    status: user.status,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor'
            });
        }
    },

    async getUser(req, res) {
        try {
            const User = req.User;
            const user = await User.findById(req.params.userId);
            
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Usuário não encontrado' 
                });
            }

            res.json({
                success: true,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    balance: user.balance,
                    status: user.status,
                    role: user.role,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
    },

    async updateBalance(req, res) {
        try {
            const { balance } = req.body;
            const User = req.User;

            if (typeof balance !== 'number') {
                return res.status(400).json({
                    success: false,
                    error: 'O saldo deve ser um número'
                });
            }
            
            const user = await User.findByIdAndUpdate(
                req.params.userId,
                { balance },
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
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    balance: user.balance,
                    status: user.status
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
    }
};

module.exports = userController;