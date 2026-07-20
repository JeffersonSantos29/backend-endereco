const jwt = require('jsonwebtoken');
const addressRepository = require('../repositories/addressRepository');
const logRepository = require('../repositories/logRepository');
const { NotFoundError, UnauthorizedError } = require('../errors');

const NOT_FOUND_MESSAGE = 'Endereço não encontrado ou acesso negado.';

const create = (userId, data) => addressRepository.create(userId, data);

const list = (userId, { search } = {}) => addressRepository.findByUserId(userId, { search });

const update = async (userId, addressId, data) => {
  const previousData = await addressRepository.findByIdAndUserId(addressId, userId);
  if (!previousData) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  const newData = await addressRepository.updateById(addressId, data);

  await logRepository.create({
    userId,
    action: 'UPDATE',
    entityId: addressId,
    previousData,
    newData,
  });

  return newData;
};

const remove = async (userId, addressId) => {
  const previousData = await addressRepository.findByIdAndUserId(addressId, userId);
  if (!previousData) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  await addressRepository.deleteById(addressId);

  await logRepository.create({
    userId,
    action: 'DELETE',
    entityId: addressId,
    previousData,
    newData: null,
  });
};

const share = async (userId, addressId, expiresIn) => {
  const address = await addressRepository.findByIdAndUserId(addressId, userId);
  if (!address) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  const token = jwt.sign({ addressId }, process.env.JWT_SECRET, { expiresIn });
  return `http://localhost:${process.env.PORT || 3000}/shared/${token}`;
};

const getShared = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('O link de compartilhamento expirou.');
    }
    throw new UnauthorizedError('Link de compartilhamento inválido.');
  }

  const address = await addressRepository.findByIdPublic(decoded.addressId);
  if (!address) {
    throw new NotFoundError('Endereço não encontrado.');
  }

  return address;
};

module.exports = { create, list, update, remove, share, getShared };
