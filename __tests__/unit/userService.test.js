jest.mock('../../src/repositories/userRepository');
jest.mock('bcrypt');

const bcrypt = require('bcrypt');
const userRepository = require('../../src/repositories/userRepository');
const userService = require('../../src/services/userService');
const { ConflictError, UnauthorizedError } = require('../../src/errors');

describe('userService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('register', () => {
        it('lança ConflictError se o e-mail já existe', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'a@a.com' });

            await expect(userService.register({ email: 'a@a.com', password: '1234' })).rejects.toThrow(
                ConflictError,
            );
            expect(userRepository.create).not.toHaveBeenCalled();
        });

        it('cria o usuário com a senha hasheada quando o e-mail está livre', async () => {
            userRepository.findByEmail.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hash123');
            userRepository.create.mockResolvedValue({ id: 1, email: 'a@a.com' });

            const user = await userService.register({ email: 'a@a.com', password: '1234' });

            expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
            expect(userRepository.create).toHaveBeenCalledWith({ email: 'a@a.com', hashedPassword: 'hash123' });
            expect(user).toEqual({ id: 1, email: 'a@a.com' });
        });
    });

    describe('login', () => {
        it('lança UnauthorizedError se o usuário não existe', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            await expect(userService.login({ email: 'a@a.com', password: '1234' })).rejects.toThrow(
                UnauthorizedError,
            );
        });

        it('lança UnauthorizedError se a senha não confere', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'a@a.com', password: 'hash' });
            bcrypt.compare.mockResolvedValue(false);

            await expect(userService.login({ email: 'a@a.com', password: 'errada' })).rejects.toThrow(
                UnauthorizedError,
            );
        });

        it('retorna um token quando as credenciais são válidas', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'a@a.com', password: 'hash' });
            bcrypt.compare.mockResolvedValue(true);

            const token = await userService.login({ email: 'a@a.com', password: '1234' });

            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
    });
});
