const prisma = require('../config/prismaClient');

const toPrismaData = ({ zip_code, ...rest }) => ({
  ...rest,
  ...(zip_code !== undefined && { zipCode: zip_code }),
});

const create = (userId, data) =>
  prisma.address.create({
    data: { userId, ...toPrismaData(data) },
  });

const findByUserId = (userId, { search } = {}) => {
  const where = { userId };

  if (search) {
    where.OR = [
      { street: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { state: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.address.findMany({ where });
};

const findByIdAndUserId = (id, userId) => prisma.address.findFirst({ where: { id, userId } });

const updateById = (id, data) => prisma.address.update({ where: { id }, data: toPrismaData(data) });

const deleteById = (id) => prisma.address.delete({ where: { id } });

const findByIdPublic = (id) =>
  prisma.address.findUnique({
    where: { id },
    select: { street: true, number: true, city: true, state: true, zipCode: true },
  });

module.exports = { create, findByUserId, findByIdAndUserId, updateById, deleteById, findByIdPublic };
