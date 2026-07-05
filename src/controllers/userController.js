const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- Nova importação
const db = require('../config/database');
require('dotenv').config(); // Para ler o JWT_SECRET

// Registro 
exports.registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: 'E-mail já está em uso.' });
        }

        const salt = await bcrypt.genSalt(10); // Encriptação, geração de um salt
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, hashedPassword]
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar usuário.' });
    }
};

//  Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // Verifica se o usuário existe
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = result.rows[0];

        // Compara a senha enviada com o hash salvo no banco
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Gera o token JWT (válido por 1 dia)
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Autenticação realizada com sucesso!',
            token: token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao realizar login.' });
    }
};