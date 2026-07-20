const addressService = require('../services/addressService');
const {
  createAddressSchema,
  updateAddressSchema,
  listAddressQuerySchema,
  addressIdParamSchema,
  shareAddressSchema,
} = require('../schemas/addressSchema');

exports.createAddress = async (req, res, next) => {
  try {
    const data = createAddressSchema.parse(req.body);
    const address = await addressService.create(req.userId, data);
    res.status(201).json({ message: 'Endereço criado com sucesso!', address });
  } catch (err) {
    next(err);
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const { search } = listAddressQuerySchema.parse(req.query);
    const addresses = await addressService.list(req.userId, { search });
    res.status(200).json(addresses);
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = addressIdParamSchema.parse(req.params);
    const data = updateAddressSchema.parse(req.body);
    const address = await addressService.update(req.userId, id, data);
    res.status(200).json({ message: 'Endereço atualizado com sucesso!', address });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = addressIdParamSchema.parse(req.params);
    await addressService.remove(req.userId, id);
    res.status(200).json({ message: 'Endereço removido com sucesso!' });
  } catch (err) {
    next(err);
  }
};

exports.shareAddress = async (req, res, next) => {
  try {
    const { id } = addressIdParamSchema.parse(req.params);
    const { expiresIn } = shareAddressSchema.parse(req.body);
    const url = await addressService.share(req.userId, id, expiresIn);
    res.status(200).json({ message: 'Link de compartilhamento gerado com sucesso!', url });
  } catch (err) {
    next(err);
  }
};

exports.getSharedAddress = async (req, res, next) => {
  try {
    const address = await addressService.getShared(req.params.token);
    res.status(200).json(address);
  } catch (err) {
    next(err);
  }
};
