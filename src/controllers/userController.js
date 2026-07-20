const userService = require('../services/userService');
const { registerSchema, loginSchema } = require('../schemas/userSchema');

exports.registerUser = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await userService.register(data);
    res.status(201).json({ message: 'Usuário criado com sucesso!', user });
  } catch (err) {
    next(err);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const token = await userService.login(data);
    res.status(200).json({ message: 'Autenticação realizada com sucesso!', token });
  } catch (err) {
    next(err);
  }
};
