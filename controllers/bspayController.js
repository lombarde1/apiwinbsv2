// src/controllers/bspayController.js
const bspayController = {
    async getConfigPage(req, res) {
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
                    .hidden { display: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>BSPay Credentials Manager</h2>
                    
                    <div id="loginForm">
                        <input type="password" id="accessCode" placeholder="Enter access code">
                        <button onclick="login()">Login</button>
                    </div>

                    <div id="mainContent" class="hidden">
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
                    </div>
                    <div id="message"></div>
                </div>

                <script>
                    const ACCESS_CODE = '12345'; // Em produção, use uma senha mais segura

                    function login() {
                        const code = document.getElementById('accessCode').value;
                        if(code === ACCESS_CODE) {
                            document.getElementById('loginForm').classList.add('hidden');
                            document.getElementById('mainContent').classList.remove('hidden');
                        } else {
                            alert('Código de acesso inválido');
                        }
                    }

                    document.getElementById('dbSelect').addEventListener('change', async (e) => {
                        const db = e.target.value;
                        if (!db) return;
                        
                        try {
                            const response = await fetch(\`/\${db}/bspay/credentials/bspay\`);
                            const data = await response.json();
                            
                            if (data.success) {
                                document.getElementById('clientId').value = data.credentials?.clientId || '';
                                document.getElementById('clientSecret').value = data.credentials?.clientSecret || '';
                                document.getElementById('baseUrl').value = data.credentials?.baseUrl || '';
                            }
                        } catch (error) {
                            showMessage('Erro ao carregar credenciais', true);
                        }
                    });

                    document.getElementById('credentialsForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const db = document.getElementById('dbSelect').value;
                        if (!db) {
                            showMessage('Selecione uma database', true);
                            return;
                        }

                        const credentials = {
                            clientId: document.getElementById('clientId').value,
                            clientSecret: document.getElementById('clientSecret').value,
                            baseUrl: document.getElementById('baseUrl').value
                        };

                        try {
                            const response = await fetch(\`/\${db}/bspay/credentials/bspay\`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(credentials)
                            });
                            
                            const data = await response.json();
                            showMessage(data.success ? 'Credenciais salvas com sucesso' : 'Erro ao salvar credenciais', !data.success);
                        } catch (error) {
                            showMessage('Erro ao salvar credenciais', true);
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
            res.json({ 
                success: true, 
                credentials 
            });
        } catch (error) {
            console.error('Erro ao buscar credenciais:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao buscar credenciais' 
            });
        }
    },

    async updateCredentials(req, res) {
        try {
            const { clientId, clientSecret, baseUrl } = req.body;
            
            await req.ApiCredential.findOneAndUpdate(
                { name: 'bspay' },
                { 
                    name: 'bspay',
                    clientId, 
                    clientSecret, 
                    baseUrl 
                },
                { upsert: true }
            );

            res.json({ 
                success: true,
                message: 'Credenciais atualizadas com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar credenciais:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao atualizar credenciais' 
            });
        }
    }
};

module.exports = bspayController;