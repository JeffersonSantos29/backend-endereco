const healthRepository = require('../repositories/healthRepository');
const logger = require('../config/logger');

exports.ping = async (req, res) => {
  try {
    await healthRepository.check();
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    const log = req.log || logger;
    log.error({ err }, 'Health check falhou: Postgres inacessível');
    res.status(503).json({ status: 'error', error: 'Banco de dados indisponível.' });
  }
};
