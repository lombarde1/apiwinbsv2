// src/controllers/globalController.js
const express = require('express');
const databaseMiddleware = require('../middleware/database');

// Função auxiliar para chamar uma rota com diferentes DBs
async function callRouteWithMultipleDBs(req, res, routeHandler) {
    const results = [];
    const errors = [];

    for (let dbNumber = 1; dbNumber <= 5; dbNumber++) {
        console.log(`Executando na DB${dbNumber}...`);
        // Cria um request modificado com o dbNumber
        const modifiedReq = {
            ...req,
            params: {
                ...req.params,
                dbNumber: dbNumber.toString()
            }
        };

        try {
            // Aplica o middleware de database
            await new Promise((resolve, reject) => {
                databaseMiddleware(modifiedReq, res, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            // Executa a função da rota e coleta o resultado
            const result = await routeHandler(modifiedReq);
            
            if (result) {
                results.push({
                    dbNumber,
                    ...result
                });
            }

        } catch (err) {
            console.error(`Erro na DB${dbNumber}:`, err);
            errors.push(`DB${dbNumber}: ${err.message}`);
        } finally {
            // Fecha a conexão atual antes de passar para a próxima
            if (modifiedReq.dbConnection) {
                await modifiedReq.dbConnection.close();
            }
        }
    }

    return { results, errors };
}

const globalController = {
    // Buscar usuário em todas as DBs por email
    async findUserByEmail(req, res) {
        try {
            const { email } = req.params;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
                });
            }

            // Função que será executada para cada DB
            const findUserInDB = async (req) => {
                const user = await req.User.findOne({ 
                    email: email.toLowerCase() 
                }).lean();

                if (user) {
                    return {
                        user: {
                            id: user._id,
                            fullName: user.fullName,
                            email: user.email,
                            status: user.status,
                            region: user.region,
                            createdAt: user.createdAt,
                            hasActiveAlerts: user.alerts?.hasActiveAlerts || false
                        }
                    };
                }
                return null;
            };

            const { results, errors } = await callRouteWithMultipleDBs(req, res, findUserInDB);

            if (results.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        results: [],
                        totalFound: 0,
                        message: 'Nenhum usuário encontrado com este email'
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    results,
                    totalFound: results.length,
                    errors: errors.length > 0 ? errors : undefined
                }
            });

        } catch (error) {
            console.error('Erro global:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar usuário'
            });
        }
    },

    // Buscar alertas em todas as DBs por email
    async findAlertsByEmail(req, res) {
        try {
            const { email } = req.params;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
                });
            }

            // Função que será executada para cada DB
            const findAlertsInDB = async (req) => {
                const user = await req.User.findOne({ 
                    email: email.toLowerCase() 
                }).lean();

                if (user) {
                    const alerts = await req.Alert.find({ 
                        userId: user._id 
                    }).lean();

                    if (alerts.length > 0) {
                        return {
                            userId: user._id,
                            alerts: alerts.map(alert => ({
                                id: alert._id,
                                type: alert.type,
                                description: alert.description,
                                status: alert.status,
                                createdAt: alert.createdAt,
                                evidence: alert.evidence
                            }))
                        };
                    }
                }
                return null;
            };

            const { results, errors } = await callRouteWithMultipleDBs(req, res, findAlertsInDB);

            res.json({
                success: true,
                data: {
                    results,
                    totalAlertsFound: results.reduce((acc, curr) => acc + curr.alerts.length, 0),
                    errors: errors.length > 0 ? errors : undefined
                }
            });

        } catch (error) {
            console.error('Erro global:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar alertas'
            });
        }
    },

    // Verificar se email está banido em alguma DB
    async checkEmailStatus(req, res) {
        try {
            const { email } = req.params;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
                });
            }

            // Função que será executada para cada DB
            const checkStatusInDB = async (req) => {
                const user = await req.User.findOne({ 
                    email: email.toLowerCase(),
                    status: { $in: ['blocked', 'pending'] }
                }).lean();

                if (user) {
                    return {
                        status: user.status,
                        alerts: {
                            hasActiveAlerts: user.alerts?.hasActiveAlerts || false,
                            alertCount: user.alerts?.alertCount || 0,
                            lastAlertType: user.alerts?.lastAlertType
                        }
                    };
                }
                return null;
            };

            const { results, errors } = await callRouteWithMultipleDBs(req, res, checkStatusInDB);

            res.json({
                success: true,
                data: {
                    isRestricted: results.length > 0,
                    restrictions: results,
                    errors: errors.length > 0 ? errors : undefined
                }
            });

        } catch (error) {
            console.error('Erro global:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao verificar status do email'
            });
        }
    }
};

module.exports = globalController;