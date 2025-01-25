// src/tests/apiTests.js
const axios = require('axios');
const colors = require('colors');

// Configurações
const API_URL = 'http://localhost:3000';
const DB_NUMBER = '3';
let testUserId = null;
let testUserCredentials = null;

// Função para formatar o tempo
const formatTime = (startTime) => {
    const duration = Date.now() - startTime;
    return `${duration}ms`;
};

// Função para imprimir o resultado do teste
const printTestResult = (testName, passed, error = null, duration) => {
    if (passed) {
        console.log(`✓ ${testName}`.green, `(${duration})`.gray);
    } else {
        console.log(`✗ ${testName}`.red, `(${duration})`.gray);
        if (error) {
            console.log('  Error:', error.message.red);
        }
    }
};

// Função principal de testes
async function runTests() {
    console.log('\n🚀 Iniciando testes das APIs...\n'.cyan);
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
    };

    // Teste 1: Registro de usuário
    async function testRegister() {
        const startTime = Date.now();
        results.total++;
        
        try {
            const registerData = {
                fullName: "Usuário Teste",
                email: `teste${Date.now()}@example.com`,
                username: `teste${Date.now()}`,
                password: "senha123"
            };

            // Salva as credenciais para usar no login
            testUserCredentials = {
                username: registerData.username,
                password: registerData.password
            };

            const registerResponse = await axios.post(`${API_URL}/${DB_NUMBER}/register`, registerData);
            
            testUserId = registerResponse.data.user.id;
            const success = registerResponse.data.success && registerResponse.data.user.fullName === registerData.fullName;
            
            results[success ? 'passed' : 'failed']++;
            results.tests.push({
                name: 'Registro de usuário',
                passed: success,
                duration: formatTime(startTime)
            });

            printTestResult('Registro de usuário', success, null, formatTime(startTime));
        } catch (error) {
            results.failed++;
            results.tests.push({
                name: 'Registro de usuário',
                passed: false,
                error: error.message,
                duration: formatTime(startTime)
            });
            printTestResult('Registro de usuário', false, error, formatTime(startTime));
        }
    }

    // Teste 2: Login
    async function testLogin() {
        const startTime = Date.now();
        results.total++;
        
        try {
            if (!testUserCredentials) {
                throw new Error('Credenciais de teste não disponíveis');
            }

            const loginResponse = await axios.post(`${API_URL}/${DB_NUMBER}/login`, testUserCredentials);
            const success = loginResponse.data.success;

            results[success ? 'passed' : 'failed']++;
            results.tests.push({
                name: 'Login',
                passed: success,
                duration: formatTime(startTime)
            });

            printTestResult('Login', success, null, formatTime(startTime));
        } catch (error) {
            results.failed++;
            results.tests.push({
                name: 'Login',
                passed: false,
                error: error.message,
                duration: formatTime(startTime)
            });
            printTestResult('Login', false, error, formatTime(startTime));
        }
    }

    // Teste 3: Obter usuário
    async function testGetUser() {
        if (!testUserId) return;
        
        const startTime = Date.now();
        results.total++;

        try {
            const userResponse = await axios.get(`${API_URL}/${DB_NUMBER}/user/${testUserId}`);

            console.log(userResponse.data);
            const success = userResponse.data.success && userResponse.data.user.id === testUserId;

            results[success ? 'passed' : 'failed']++;
            results.tests.push({
                name: 'Obter usuário',
                passed: success,
                duration: formatTime(startTime)
            });

            printTestResult('Obter usuário', success, null, formatTime(startTime));
        } catch (error) {
            results.failed++;
            results.tests.push({
                name: 'Obter usuário',
                passed: false,
                error: error.message,
                duration: formatTime(startTime)
            });
            printTestResult('Obter usuário', false, error, formatTime(startTime));
        }
    }

    // Teste 4: Atualizar saldo
    async function testUpdateBalance() {
        if (!testUserId) return;
        
        const startTime = Date.now();
        results.total++;

        try {
            const updateData = {
                balance: 100
            };

            const updateResponse = await axios.put(`${API_URL}/${DB_NUMBER}/user/${testUserId}/balance`, updateData);
            const success = updateResponse.data.success && updateResponse.data.user.balance === 100;

            results[success ? 'passed' : 'failed']++;
            results.tests.push({
                name: 'Atualizar saldo',
                passed: success,
                duration: formatTime(startTime)
            });

            printTestResult('Atualizar saldo', success, null, formatTime(startTime));
        } catch (error) {
            results.failed++;
            results.tests.push({
                name: 'Atualizar saldo',
                passed: false,
                error: error.message,
                duration: formatTime(startTime)
            });
            printTestResult('Atualizar saldo', false, error, formatTime(startTime));
        }
    }

    // Teste 5: Login com credenciais inválidas
    async function testInvalidLogin() {
        const startTime = Date.now();
        results.total++;
        
        try {
            const invalidLoginData = {
                username: "usuarioinvalido",
                password: "senhainvalida"
            };

            try {
                await axios.post(`${API_URL}/${DB_NUMBER}/login`, invalidLoginData);
                results.failed++;
                results.tests.push({
                    name: 'Login com credenciais inválidas',
                    passed: false,
                    duration: formatTime(startTime)
                });
                printTestResult('Login com credenciais inválidas', false, null, formatTime(startTime));
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    results.passed++;
                    results.tests.push({
                        name: 'Login com credenciais inválidas',
                        passed: true,
                        duration: formatTime(startTime)
                    });
                    printTestResult('Login com credenciais inválidas', true, null, formatTime(startTime));
                } else {
                    throw error;
                }
            }
        } catch (error) {
            results.failed++;
            results.tests.push({
                name: 'Login com credenciais inválidas',
                passed: false,
                error: error.message,
                duration: formatTime(startTime)
            });
            printTestResult('Login com credenciais inválidas', false, error, formatTime(startTime));
        }
    }

    // Executar todos os testes em sequência
    await testRegister();
    await testLogin();
    await testGetUser();
    await testUpdateBalance();
    await testInvalidLogin();

    // Imprimir relatório final
    console.log('\n📊 Relatório Final:'.cyan);
    console.log('Total de testes:', results.total);
    console.log('Testes passados:'.green, results.passed);
    console.log('Testes falhos:'.red, results.failed);
    console.log('Taxa de sucesso:'.cyan, `${((results.passed / results.total) * 100).toFixed(2)}%`);
    
    console.log('\n⏱️  Tempos de resposta:'.cyan);
    results.tests.forEach(test => {
        console.log(`${test.name}:`.gray, test.duration);
    });
}

// Executar testes
runTests().catch(console.error);