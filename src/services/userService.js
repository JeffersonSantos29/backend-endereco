const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { ConflictError, UnauthorizedError } = require('../errors');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '1d';

const register = async ({ email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('E-mail já está em uso.');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return userRepository.create({ email, hashedPassword });
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Credenciais inválidas.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Credenciais inválidas.');
  }

  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
};

module.exports = { register, login };
