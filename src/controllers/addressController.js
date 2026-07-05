
const db = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();
require('dotenv').config(); 

exports.createAddress = async (req, res) => {
    
    const userId = req.userId; 
    
    
    const { street, number, city, state, zip_code } = req.body;

    
    if (!street || !number || !city || !state || !zip_code) {
        return res.status(400).json({ error: 'Todos os campos de endereço são obrigatórios.' });
    }

    try {
        const newAddress = await db.query(
            `INSERT INTO addresses (user_id, street, number, city, state, zip_code) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [userId, street, number, city, state, zip_code]
        );

        res.status(201).json({
            message: 'Endereço criado com sucesso!',
            address: newAddress.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar endereço.' });
    }
};

// --- FUNÇÃO GET  ---
exports.getAddresses = async (req, res) => {
    const userId = req.userId;
    
    const { search } = req.query; 

    try {
        let query = 'SELECT * FROM addresses WHERE user_id = $1';
        let values = [userId];

        if (search) {
            
            query += ' AND (street ILIKE $2 OR city ILIKE $2 OR state ILIKE $2)';
            values.push(`%${search}%`);
        }

        const result = await db.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar endereços.' });
    }
};

// --- FUNÇÃO PUT ---
exports.updateAddress = async (req, res) => {
    const userId = req.userId;
    const addressId = req.params.id;
    const { street, number, city, state, zip_code } = req.body;

    try {
        
        const addressCheck = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
        if (addressCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado ou acesso negado.' });
        }

        const previousData = addressCheck.rows[0];

        
        const updateQuery = `
            UPDATE addresses 
            SET street = COALESCE($1, street), 
                number = COALESCE($2, number), 
                city = COALESCE($3, city), 
                state = COALESCE($4, state), 
                zip_code = COALESCE($5, zip_code)
            WHERE id = $6 AND user_id = $7
            RETURNING *;
        `;
        const updatedAddress = await db.query(updateQuery, [street, number, city, state, zip_code, addressId, userId]);
        const newData = updatedAddress.rows[0];

        //  Registra o LOG da operação
        await db.query(
            'INSERT INTO logs (user_id, action, entity_id, previous_data, new_data) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'UPDATE', addressId, previousData, newData]
        );

        res.status(200).json({ message: 'Endereço atualizado com sucesso!', address: newData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar endereço.' });
    }
};

// --- FUNÇÃO DELETE ---
exports.deleteAddress = async (req, res) => {
    const userId = req.userId;
    const addressId = req.params.id;

    try {
        // 1. Verifica se o endereço existe e se pertence ao usuário logado
        const addressCheck = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
        if (addressCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado ou acesso negado.' });
        }

        const previousData = addressCheck.rows[0];

        // 2. Remove o endereço
        await db.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);

        // 3. Registra o LOG da operação 
        await db.query(
            'INSERT INTO logs (user_id, action, entity_id, previous_data, new_data) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'DELETE', addressId, previousData, null] 
        );

        res.status(200).json({ message: 'Endereço removido com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover endereço.' });
    }
};

// --- FUNÇÃO POST (Gerar Link de Compartilhamento) ---
exports.shareAddress = async (req, res) => {
    const userId = req.userId;
    const addressId = req.params.id;
    const { expiresIn } = req.body; // Ex: "1h", "30m", "1d"

    if (!expiresIn) {
        return res.status(400).json({ error: 'O tempo de expiração (expiresIn) é obrigatório.' });
    }

    try {
        // Verifica se o endereço existe e pertence ao usuário autenticado
        const addressCheck = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
        if (addressCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado ou acesso negado.' });
        }

        // Gera um token contendo apenas o ID do endereço e o tempo de expiração
        const token = jwt.sign(
            { addressId: addressId },
            process.env.JWT_SECRET,
            { expiresIn: expiresIn }
        );

        const shareUrl = `http://localhost:${process.env.PORT || 3000}/shared/${token}`;

        res.status(200).json({ 
            message: 'Link de compartilhamento gerado com sucesso!', 
            url: shareUrl 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar link de compartilhamento.' });
    }
};

// --- FUNÇÃO GET (Acessar Link Compartilhado - Rota Pública) ---
exports.getSharedAddress = async (req, res) => {
    const token = req.params.token;

    try {
        // Valida o token gerado anteriormente
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const addressId = decoded.addressId;

        // Busca o endereço no banco 
        const addressCheck = await db.query(
            'SELECT street, number, city, state, zip_code FROM addresses WHERE id = $1', 
            [addressId]
        );

        if (addressCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }

        res.status(200).json(addressCheck.rows[0]);
    } catch (error) {
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'O link de compartilhamento expirou.' });
        }
        return res.status(401).json({ error: 'Link de compartilhamento inválido.' });
    }
};

