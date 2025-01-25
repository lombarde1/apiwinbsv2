// src/controllers/scratchController.js
const { createNotification } = require('./notificationController');

const scratchController = {
    async play(req, res) {
        try {
            const { gameId } = req.body;
            const userId = req.params.userId;
            const User = req.User;
            const Game = req.Game;

            // Verificar se o jogo existe
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    error: 'Jogo não encontrado'
                });
            }

            // Verificar se o usuário existe e tem saldo
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Verificar saldo
            if (user.balance < 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Saldo insuficiente'
                });
            }

            // Calcular probabilidade de vitória baseada no saldo
            const shouldWin = calculateWinProbability(user.balance);

            // Gerar resultado da raspadinha
            const symbols = getGameSymbols(game.name);
            const result = generateScratchResult(symbols, shouldWin);
            
            // Calcular prêmio se houver vitória
            let prize = 0;
            if (result.won) {
                prize = calculatePrize(result.winningSymbol);
            }
            
            // Atualizar saldo do usuário (sempre perde 5, pode ganhar prêmio)
            user.balance -= 5;
            if (prize > 0) {
                user.balance += prize;
            }
            await user.save();
            
            // Salvar resultado
            const scratch = new req.Scratch({
                gameId,
                userId,
                result: result.grid,
                won: result.won,
                prize: prize
            });
            await scratch.save();
            
            // Criar notificação APÓS criar o scratch
            if (result.won) {
                await createNotification(
                    req,
                    'win',
                    'Parabéns! Você ganhou!',
                    `Você ganhou R$ ${prize.toFixed(2)} na raspadinha ${game.name}!`,
                    {
                        gameId: game._id,
                        gameName: game.name,
                        prize,
                        scratchId: scratch._id
                    }
                );
            }

            res.json({
                success: true,
                scratch: {
                    id: scratch._id,
                    grid: result.grid,
                    revealPattern: result.revealPattern,
                    combinations: result.combinations,
                    won: result.won,
                    prize: prize
                },
                newBalance: user.balance
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar jogada'
            });
        }
    }
};

// Funções auxiliares
function getGameSymbols(gameName) {
    const symbolSets = {
        'Carnaval': ['🎭', '🎪', '🎉', '🎊', '🎈', '🎵'],
        'Ganhe Facil': ['💰', '💎', '🎁', '🎲', '🎮', '🎯'],
        'Você Milionario': ['💵', '💶', '💷', '🏆', '👑', '💍']
    };
    return symbolSets[gameName] || symbolSets['Carnaval'];
}

function calculateWinProbability(balance) {
    if (balance <= 10) return 0.25;     // 25% chance com saldo baixo
    if (balance <= 50) return 0.12;     // 12% chance com saldo médio
    if (balance <= 100) return 0.06;    // 6% chance com saldo alto
    return 0.03;                        // 3% chance com saldo muito alto
}

function checkWinningCondition(grid) {
    // Verificar linhas horizontais
    for (let i = 0; i < 3; i++) {
        if (grid[i][0] === grid[i][1] && grid[i][1] === grid[i][2]) {
            return {
                won: true,
                winningSymbol: grid[i][0],
                type: 'horizontal',
                row: i
            };
        }
    }

    // Verificar linhas verticais
    for (let j = 0; j < 3; j++) {
        if (grid[0][j] === grid[1][j] && grid[1][j] === grid[2][j]) {
            return {
                won: true,
                winningSymbol: grid[0][j],
                type: 'vertical',
                col: j
            };
        }
    }

    // Verificar diagonal principal
    if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
        return {
            won: true,
            winningSymbol: grid[0][0],
            type: 'diagonal',
            direction: 'main'
        };
    }

    // Verificar diagonal secundária
    if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) {
        return {
            won: true,
            winningSymbol: grid[0][2],
            type: 'diagonal',
            direction: 'secondary'
        };
    }

    return { won: false, winningSymbol: null };
}


function calculatePrize(symbol) {
    const prizes = {
        // Carnaval
        '🎭': 7, '🎪': 8, '🎉': 9, '🎊': 10, '🎈': 8, '🎵': 7,
        // Ganhe Fácil
        '💰': 7, '💎': 10, '🎁': 8, '🎲': 7, '🎮': 9, '🎯': 8,
        // Você Milionário
        '💵': 7, '💶': 8, '💷': 9, '🏆': 10, '👑': 9, '💍': 8
    };
    return prizes[symbol] || 7;
}

function generateScratchResult(symbols, shouldWin) {
    const grid = [];
    const rows = 3;
    const cols = 3;

    if (shouldWin && Math.random() < shouldWin) {
        // Gerar grade com vitória
        const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];

        // Criar grid base
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                row.push(randomSymbol);
            }
            grid.push(row);
        }

        // Adicionar linha vencedora
        const winType = Math.floor(Math.random() * 3);
        switch (winType) {
            case 0: { // Horizontal
                const row = Math.floor(Math.random() * 3);
                for (let col = 0; col < 3; col++) {
                    grid[row][col] = winningSymbol;
                }
                break;
            }
            case 1: { // Vertical
                const col = Math.floor(Math.random() * 3);
                for (let row = 0; row < 3; row++) {
                    grid[row][col] = winningSymbol;
                }
                break;
            }
            case 2: { // Diagonal
                if (Math.random() < 0.5) {
                    for (let i = 0; i < 3; i++) grid[i][i] = winningSymbol;
                } else {
                    for (let i = 0; i < 3; i++) grid[i][2-i] = winningSymbol;
                }
                break;
            }
        }

        return {
            grid,
            revealPattern: generateRevealPattern(grid),
            combinations: findTeaseCombinations(grid),
            won: true,
            winningSymbol
        };
    } else {
        // Gerar grade perdedora com "quase vitórias"
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                const availableSymbols = [...symbols];
                const symbolCount = {};
                
                grid.forEach(r => r.forEach(s => {
                    symbolCount[s] = (symbolCount[s] || 0) + 1;
                    if (symbolCount[s] >= 2) {
                        const index = availableSymbols.indexOf(s);
                        if (index > -1) availableSymbols.splice(index, 1);
                    }
                }));

                const randomIndex = Math.floor(Math.random() * availableSymbols.length);
                row.push(availableSymbols[randomIndex]);
            }
            grid.push(row);
        }

        // Verificar condição de vitória independente de como o grid foi gerado
    const winCheck = checkWinningCondition(grid);

    return {
        grid,
        revealPattern: generateRevealPattern(grid),
        combinations: findTeaseCombinations(grid),
        won: winCheck.won,
        winningSymbol: winCheck.winningSymbol
    };
    }
}

function generateRevealPattern(grid) {
    const symbolCount = {};
    grid.forEach(row => row.forEach(symbol => {
        symbolCount[symbol] = (symbolCount[symbol] || 0) + 1;
    }));

    const pattern = [];
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            pattern.push({
                row: i,
                col: j,
                symbol: grid[i][j],
                count: symbolCount[grid[i][j]]
            });
        }
    }

    return pattern.sort((a, b) => b.count - a.count);
}

function findTeaseCombinations(grid) {
    const combinations = [];
    const symbols = new Set(grid.flat());

    symbols.forEach(symbol => {
        let count = 0;
        let positions = [];
        
        grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === symbol) {
                    count++;
                    positions.push({row: i, col: j});
                }
            });
        });

        if (count === 2) {
            combinations.push({
                symbol,
                count,
                positions,
                needsOneMore: true
            });
        }
    });

    return combinations;
}

module.exports = scratchController;