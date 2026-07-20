require('./config/env');
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

// Configuração do middleware Prometheus
const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    promClient: {
        collectDefaultMetrics: {}
    }
});
app.use(metricsMiddleware);

// Registro de rotas no Express
app.use('/', healthRoutes);
app.use('/', userRoutes);
app.use('/', addressRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Servidor rodando na porta ${PORT}`);
    });
}

module.exports = app;
