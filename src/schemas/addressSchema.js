const { z } = require('zod');

const addressFields = {
  street: z.string().min(1, 'Rua é obrigatória.').max(255),
  number: z.string().min(1, 'Número é obrigatório.').max(50),
  city: z.string().min(1, 'Cidade é obrigatória.').max(255),
  state: z.string().min(1, 'Estado é obrigatório.').max(50),
  zip_code: z.string().min(1, 'CEP é obrigatório.').max(20),
};

const createAddressSchema = z.object(addressFields);

const updateAddressSchema = z.object(addressFields).partial();

const listAddressQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

const addressIdParamSchema = z.object({
  id: z.coerce.number().int().positive('id inválido.'),
});

// Teto máximo de tempo de vida de um link de compartilhamento: 7 dias.
// Nunca aceitar o valor de expiresIn do cliente sem limite superior.
const EXPIRES_IN_PATTERN = /^(\d+)(s|m|h|d)$/;
const MAX_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
const UNIT_TO_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 };

const shareAddressSchema = z.object({
  expiresIn: z
    .string()
    .regex(EXPIRES_IN_PATTERN, 'expiresIn deve seguir o formato <número><s|m|h|d>, ex: 30m, 1h, 2d.')
    .refine((value) => {
      const [, amount, unit] = value.match(EXPIRES_IN_PATTERN);
      return Number(amount) * UNIT_TO_SECONDS[unit] <= MAX_EXPIRES_IN_SECONDS;
    }, `expiresIn não pode exceder ${MAX_EXPIRES_IN_SECONDS} segundos (7 dias).`),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  listAddressQuerySchema,
  addressIdParamSchema,
  shareAddressSchema,
  MAX_EXPIRES_IN_SECONDS,
};
