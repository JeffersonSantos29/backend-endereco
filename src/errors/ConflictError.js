const AppError = require('./AppError');

class ConflictError extends AppError {
  constructor(message = 'Conflito de dados.') {
    super(message, 409);
  }
}

module.exports = ConflictError;
