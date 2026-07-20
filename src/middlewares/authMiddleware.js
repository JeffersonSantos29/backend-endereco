require('../config/env');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Busca o token no cabeçalho da requisição
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido. Acesso negado.' });
    }

    // O padrão esperado é "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Formato de token inválido.' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado.' });
    }

    // Valida o token com a nossa chave secreta
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        // Passa o ID do usuário logado para a requisição   
        req.userId = decoded.id; 
        
        
        return next();
    });
};