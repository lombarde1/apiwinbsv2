// app.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://darkvips:lombarde1@147.79.111.143:27017/spotify1?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// BSPay Credentials Schema
const ApiCredentialSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    clientSecret: { type: String, required: true },
    baseUrl: { type: String, required: true }
});

const ApiCredential = mongoose.model('ApiCredential', ApiCredentialSchema);

// HTML Config Page Route
app.get('/config', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>BSPay Config</title>
            <style>
                body { padding: 20px; font-family: Arial; }
                .container { max-width: 600px; margin: 0 auto; }
                input { margin: 10px 0; padding: 5px; width: 100%; }
                button { padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; }
                .message { padding: 10px; margin: 10px 0; }
                .error { background: #ffebee; }
                .success { background: #e8f5e9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>BSPay Credentials Manager</h2>
                <form id="credentialsForm">
                    <input type="text" id="clientId" placeholder="Client ID" required>
                    <input type="text" id="clientSecret" placeholder="Client Secret" required>
                    <input type="text" id="baseUrl" placeholder="Base URL" required>
                    <button type="submit">Save Credentials</button>
                </form>
                <div id="message"></div>
            </div>

            <script>
                document.getElementById('credentialsForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const credentials = {
                        clientId: document.getElementById('clientId').value,
                        clientSecret: document.getElementById('clientSecret').value,
                        baseUrl: document.getElementById('baseUrl').value
                    };

                    try {
                        const response = await fetch('/api/credentials', {
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

                // Load existing credentials
                async function loadCredentials() {
                    try {
                        const response = await fetch('/api/credentials');
                        const data = await response.json();
                        
                        if (data.credentials) {
                            document.getElementById('clientId').value = data.credentials.clientId;
                            document.getElementById('clientSecret').value = data.credentials.clientSecret;
                            document.getElementById('baseUrl').value = data.credentials.baseUrl;
                        }
                    } catch (error) {
                        showMessage('Error loading credentials', true);
                    }
                }

                loadCredentials();
            </script>
        </body>
        </html>
    `);
});

// API Routes
// Get Credentials
app.get('/api/credentials', async (req, res) => {
    try {
        const credentials = await ApiCredential.findOne({ name: 'bspay' });
        res.json({ success: true, credentials });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Credentials
app.post('/api/credentials', async (req, res) => {
    try {
        const { clientId, clientSecret, baseUrl } = req.body;
        
        await ApiCredential.findOneAndUpdate(
            { name: 'bspay' },
            { name: 'bspay', clientId, clientSecret, baseUrl },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate PIX
app.post('/api/generate-pix', async (req, res) => {
    try {
        const { amount, email } = req.body;
        
        if (!amount || !email) {
            return res.status(400).json({
                success: false,
                error: 'Amount and email are required'
            });
        }

        // Get BSPay credentials
        const credentials = await ApiCredential.findOne({ name: 'bspay' });
        if (!credentials) {
            return res.status(400).json({
                success: false,
                error: 'BSPay credentials not configured'
            });
        }

        // Get auth token
        const auth = Buffer.from(
            `${credentials.clientId}:${credentials.clientSecret}`
        ).toString('base64');

        const tokenResponse = await axios.post(
            `${credentials.baseUrl}/oauth/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const token = tokenResponse.data.access_token;
        const externalId = `PIX_${Date.now()}`;
console.log(`Token: ${token}`)
        // Generate PIX
        const pixResponse = await axios.post(
            `${credentials.baseUrl}/pix/qrcode`,
            {
                amount: Math.round(parseFloat(amount) * 100), // Convert to cents
                description: "PIX Payment",
                external_id: externalId,
                payer: {
                    name: "User",
                    email: email,
                    document: "12345678909",
                    document_type: "cpf"
                },
                expires_in: 3600
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            data: {
                qrCode: pixResponse.data.qrcode,
                transactionId: pixResponse.data.transactionId,
                externalId: externalId,
                token: token
            }
        });

    } catch (error) {
        console.error('Error generating PIX:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to generate PIX QR Code'
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
