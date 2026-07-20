const { shareAddressSchema, MAX_EXPIRES_IN_SECONDS } = require('../../src/schemas/addressSchema');

describe('shareAddressSchema', () => {
    it('aceita valores dentro do teto máximo', () => {
        expect(() => shareAddressSchema.parse({ expiresIn: '1h' })).not.toThrow();
        expect(() => shareAddressSchema.parse({ expiresIn: '7d' })).not.toThrow();
    });

    it('rejeita um formato inválido', () => {
        expect(() => shareAddressSchema.parse({ expiresIn: '1 hora' })).toThrow();
        expect(() => shareAddressSchema.parse({ expiresIn: 3600 })).toThrow();
    });

    it(`rejeita valores acima do teto de ${MAX_EXPIRES_IN_SECONDS} segundos`, () => {
        expect(() => shareAddressSchema.parse({ expiresIn: '8d' })).toThrow();
        expect(() => shareAddressSchema.parse({ expiresIn: '999h' })).toThrow();
    });
});
