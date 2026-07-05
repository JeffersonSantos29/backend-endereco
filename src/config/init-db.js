const db = require('./database');

const createTables = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS addresses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            street VARCHAR(255) NOT NULL,
            number VARCHAR(50) NOT NULL,
            city VARCHAR(255) NOT NULL,
            state VARCHAR(50) NOT NULL,
            zip_code VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(50) NOT NULL,
            entity_id INTEGER NOT NULL,
            previous_data JSONB,
            new_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        console.log('Criando tabelas...');
        await db.query(query);
        console.log('Tabelas criadas com sucesso!');
    } catch (err) {
        console.error('Erro ao criar tabelas:', err);
    } finally {
        process.exit(0); 
    }
};

createTables();