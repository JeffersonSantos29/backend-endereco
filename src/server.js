require('dotenv').config();
const express = require('express');
const db = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes'); 

const app = express();
app.use(express.json());

// Registro de rotas no Express
app.use('/', userRoutes);
app.use('/', addressRoutes); 

const PORT = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
    res.json({ message: 'Servidor rodando perfeitamente!' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

module.exports = app;