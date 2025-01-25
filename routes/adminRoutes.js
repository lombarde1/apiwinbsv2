// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Aplicar middleware de autenticação admin em todas as rotas
router.use(adminAuthMiddleware);

// Rotas de usuários
router.get('/admin/users', adminController.listUsers);
router.put('/admin/users/:userId/balance', adminController.updateUserBalance);
router.put('/admin/users/:userId/status', adminController.toggleUserStatus);

// Rotas de saques
router.get('/admin/withdrawals/pending', adminController.listPendingWithdrawals);
router.put('/admin/withdrawals/:withdrawalId/process', adminController.processWithdrawal);

// Rotas de suporte
router.get('/admin/support/chats', adminController.listSupportChats);

// Rota do dashboard
router.get('/admin/dashboard/stats', adminController.getDashboardStats);

module.exports = router;