const prisma = require('../config/prismaClient');

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

const create = ({ email, hashedPassword }) =>
  prisma.user.create({
    data: { email, password: hashedPassword },
    select: { id: true, email: true, createdAt: true },
  });

module.exports = { findByEmail, create };
