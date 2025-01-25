// src/middleware/adminAuth.js

const adminAuthMiddleware = async (req, res, next) => {
    try {
        const adminId = req.headers.adminid; // Note que é 'adminid' em minúsculo pois os headers são case-insensitive

        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'Acesso não autorizado'
            });
        }

        // Buscar usuário admin pelo ID
        const admin = await req.User.findOne({
            _id: adminId,
            role: { $in: ['admin', 'superadmin'] }
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Acesso não autorizado - usuário não é administrador'
            });
        }

        // Adicionar informações do admin ao request
        req.admin = {
            id: admin._id,
            role: admin.role
        };

        next();
    } catch (error) {
        console.error('Erro na autenticação admin:', error);
        res.status(500).json({
            success: false,
            error: 'Erro na autenticação'
        });
    }
};

module.exports = adminAuthMiddleware;