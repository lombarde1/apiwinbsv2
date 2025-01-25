// src/controllers/gameController.js
const gameController = {
    async listGames(req, res) {
        try {
            const Game = req.Game;

            // Busca apenas jogos ativos e ordena pelo nome
            const games = await Game.find({ status: 'active' })
                .sort({ name: 1 });

            res.json({
                success: true,
                games: games.map(game => ({
                    id: game._id,
                    name: game.name,
                    image: game.image,
                    status: game.status
                }))
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar jogos'
            });
        }
    },

    // Adiciona um novo jogo (você pode usar para inserir os jogos iniciais)
    async addGame(req, res) {
        try {
            const { name, image, status } = req.body;
            const Game = req.Game;

            // Validações
            if (!name || !image) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome e imagem são obrigatórios'
                });
            }

            // Verifica se o jogo já existe
            const existingGame = await Game.findOne({ name });
            if (existingGame) {
                return res.status(400).json({
                    success: false,
                    error: 'Este jogo já está cadastrado'
                });
            }

            const game = new Game({
                name,
                image,
                status: status || 'active'
            });

            await game.save();

            res.status(201).json({
                success: true,
                game
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                error: 'Erro ao adicionar jogo'
            });
        }
    }
};

module.exports = gameController;