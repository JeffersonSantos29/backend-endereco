const { ZodError } = require('zod');
const { AppError } = require('../errors');
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(' ') });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  const log = req.log || logger;
  log.error({ err }, 'Erro não tratado');

  return res.status(500).json({ error: 'Erro interno do servidor.' });
};
