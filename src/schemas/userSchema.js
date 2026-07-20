const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(4, 'Senha deve ter ao menos 4 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

module.exports = { registerSchema, loginSchema };
