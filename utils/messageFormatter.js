// src/utils/messageFormatter.js
function verificarEProcessarTexto(texto) {
    // Regex para identificar links de imagem (ajustado para ignorar parâmetros extras)
    const regexImagemLink = /!\[.*?\]\((https?:\/\/[^)\s]+\.(jpg|jpeg|png|gif|webp))[^)]*\)/gi;
    // Regex para identificar listas numeradas e com marcadores
    const regexListaNumerada = /^\d+\.\s/m;
    const regexListaMarcadores = /^[-*•]\s/m;
    // Regex para identificar emojis
    const regexEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F191}-\u{1F251}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{3030}]|[\u{2B50}]|[\u{2B55}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{3297}]|[\u{3299}]|[\u{303D}]|[\u{00A9}]|[\u{00AE}]|[\u{2122}]/gu;

    // Função para formatar o texto
    function formatarTexto(texto) {
        // Remove os ### e substitui por ▫️ 
        texto = texto.replace(/^###\s*(.*?)$/gm, '▫️ $1');
        
        // Remove aspas extras dos asteriscos
        texto = texto.replace(/"\*(.*?)\*"/g, '*$1*');
        
        // Remove asteriscos duplos mantendo o conteúdo
        texto = texto.replace(/\*\*(.*?)\*\*/g, '*$1*');
        
        // Remove asteriscos extras (quando há mais de um par)
        texto = texto.replace(/\*{3,}(.*?)\*{3,}/g, '*$1*');
        
        return texto;
    }

    // Função auxiliar para verificar se uma string contém apenas emoji
    function contemApenasEmoji(texto) {
        const textoSemEmoji = texto.replace(regexEmoji, '').trim();
        return textoSemEmoji.length === 0 && texto.trim().length > 0;
    }

    // Função para processar array de partes e combinar emojis sozinhos
    function processarEmojis(partes) {
        const resultado = [];
        let parteAtual = '';

        for (let i = 0; i < partes.length; i++) {
            const parte = partes[i].trim();
            
            if (contemApenasEmoji(parte)) {
                if (resultado.length > 0) {
                    resultado[resultado.length - 1] = resultado[resultado.length - 1] + ' ' + parte;
                } else if (parteAtual) {
                    parteAtual = parteAtual + ' ' + parte;
                } else {
                    resultado.push(parte);
                }
            } else {
                if (parteAtual) {
                    resultado.push(parteAtual);
                }
                parteAtual = parte;
            }
        }
        
        if (parteAtual) {
            resultado.push(parteAtual);
        }
        
        return resultado.map(parte => formatarTexto(parte));
    }

    // Função para identificar e processar seções
    function processarSecoes(texto) {
        texto = formatarTexto(texto);
        const linhas = texto.split('\n');
        const secoes = [];
        let secaoAtual = [];
        let dentroLista = false;
        let tituloLista = '';
        
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            
            if (linha.startsWith('▫️')) {
                if (secaoAtual.length > 0) {
                    secoes.push(secaoAtual.join('\n'));
                    secaoAtual = [];
                }
                tituloLista = linha;
                continue;
            }

            if ((regexListaNumerada.test(linha) || regexListaMarcadores.test(linha)) && !dentroLista) {
                if (secaoAtual.length > 0 && !secaoAtual.includes(tituloLista)) {
                    secoes.push(secaoAtual.join('\n'));
                    secaoAtual = [];
                }
                if (tituloLista) {
                    secaoAtual.push(tituloLista);
                }
                dentroLista = true;
            }

            if (linha) {
                secaoAtual.push(linha);
            } else if (dentroLista && secaoAtual.length > 0) {
                dentroLista = false;
                secoes.push(secaoAtual.join('\n'));
                secaoAtual = [];
                tituloLista = '';
            }
        }

        if (secaoAtual.length > 0) {
            secoes.push(secaoAtual.join('\n'));
        }

        return secoes;
    }

    if (regexImagemLink.test(texto)) {
        const partes = [];
        regexImagemLink.lastIndex = 0;
        
        const imagens = [...texto.matchAll(regexImagemLink)];
        let lastIndex = 0;

        if (imagens.length > 0 && imagens[0].index > 0) {
            const textoAntes = texto.substring(0, imagens[0].index).trim();
            if (textoAntes) {
                partes.push(...processarSecoes(textoAntes));
            }
        }

        for (let i = 0; i < imagens.length; i++) {
            const imagem = imagens[i];
            const urlImagem = imagem[1];
            partes.push(`![](${urlImagem})`);
            lastIndex = imagem.index + imagem[0].length;

            if (i < imagens.length - 1) {
                const textoEntre = texto.substring(lastIndex, imagens[i + 1].index).trim();
                if (textoEntre) {
                    partes.push(...processarSecoes(textoEntre));
                }
            }
        }

        const textoApos = texto.substring(lastIndex).trim();
        if (textoApos) {
            partes.push(...processarSecoes(textoApos));
        }

        return partes.filter(parte => parte.trim().length > 0);
    }

    const secoes = processarSecoes(texto);
    
    const ultimaSecao = secoes[secoes.length - 1];
    if (ultimaSecao && !regexListaNumerada.test(ultimaSecao) && !regexListaMarcadores.test(ultimaSecao)) {
        const delimitadores = /(?<=\.\s)|(?<=!\s)|(?<=\?\s)/;
        const partesFinals = ultimaSecao
            .split(delimitadores)
            .map(parte => parte.trim())
            .filter(parte => parte.length > 0);
        
        secoes[secoes.length - 1] = partesFinals.join('\n');
    }

    return secoes.filter(secao => secao.trim().length > 0);
}

module.exports = verificarEProcessarTexto;