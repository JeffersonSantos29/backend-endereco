jest.mock('../../src/repositories/addressRepository');
jest.mock('../../src/repositories/logRepository');

const addressRepository = require('../../src/repositories/addressRepository');
const logRepository = require('../../src/repositories/logRepository');
const addressService = require('../../src/services/addressService');
const { NotFoundError, UnauthorizedError } = require('../../src/errors');

describe('addressService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('update', () => {
        it('lança NotFoundError se o endereço não pertence ao usuário', async () => {
            addressRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(addressService.update(1, 99, { city: 'X' })).rejects.toThrow(NotFoundError);
            expect(addressRepository.updateById).not.toHaveBeenCalled();
        });

        it('atualiza e grava log de auditoria quando o endereço pertence ao usuário', async () => {
            const previousData = { id: 99, userId: 1, city: 'Antiga' };
            const newData = { id: 99, userId: 1, city: 'Nova' };
            addressRepository.findByIdAndUserId.mockResolvedValue(previousData);
            addressRepository.updateById.mockResolvedValue(newData);

            const result = await addressService.update(1, 99, { city: 'Nova' });

            expect(result).toEqual(newData);
            expect(logRepository.create).toHaveBeenCalledWith({
                userId: 1,
                action: 'UPDATE',
                entityId: 99,
                previousData,
                newData,
            });
        });
    });

    describe('remove', () => {
        it('lança NotFoundError se o endereço não pertence ao usuário', async () => {
            addressRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(addressService.remove(1, 99)).rejects.toThrow(NotFoundError);
            expect(addressRepository.deleteById).not.toHaveBeenCalled();
        });

        it('remove e grava log de auditoria quando o endereço pertence ao usuário', async () => {
            const previousData = { id: 99, userId: 1 };
            addressRepository.findByIdAndUserId.mockResolvedValue(previousData);

            await addressService.remove(1, 99);

            expect(addressRepository.deleteById).toHaveBeenCalledWith(99);
            expect(logRepository.create).toHaveBeenCalledWith({
                userId: 1,
                action: 'DELETE',
                entityId: 99,
                previousData,
                newData: null,
            });
        });
    });

    describe('share', () => {
        it('lança NotFoundError se o endereço não pertence ao usuário', async () => {
            addressRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(addressService.share(1, 99, '1h')).rejects.toThrow(NotFoundError);
        });

        it('gera uma url de compartilhamento quando o endereço pertence ao usuário', async () => {
            addressRepository.findByIdAndUserId.mockResolvedValue({ id: 99, userId: 1 });

            const url = await addressService.share(1, 99, '1h');

            expect(url).toMatch(/^http:\/\/localhost:\d+\/shared\/.+/);
        });
    });

    describe('getShared', () => {
        it('lança UnauthorizedError para um token inválido', async () => {
            await expect(addressService.getShared('token-invalido')).rejects.toThrow(UnauthorizedError);
        });

        it('lança NotFoundError se o endereço do token não existir mais', async () => {
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ addressId: 123 }, process.env.JWT_SECRET, { expiresIn: '1h' });
            addressRepository.findByIdPublic.mockResolvedValue(null);

            await expect(addressService.getShared(token)).rejects.toThrow(NotFoundError);
        });
    });
});
