const prisma = require('../config/prismaClient');

const check = () => prisma.$queryRaw`SELECT 1`;

module.exports = { check };
