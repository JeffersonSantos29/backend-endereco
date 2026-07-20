const prisma = require('../../src/config/prismaClient');

const resetDb = async () => {
  await prisma.log.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
};

module.exports = { resetDb, prisma };
