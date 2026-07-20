const prisma = require('../config/prismaClient');

const create = ({ userId, action, entityId, previousData, newData }) =>
  prisma.log.create({
    data: { userId, action, entityId, previousData, newData },
  });

module.exports = { create };
