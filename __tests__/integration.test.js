const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/database');

describe('Testes de Integração - API de Endereços', () => {
    let token = '';

    // Limpa o banco antes de começar
    beforeAll(async () => {
        await db.query("DELETE FROM users WHERE email = 'testador@docker.com'");
    });

    // Limpa o banco pós testes
    afterAll(async () => {
        await db.query("DELETE FROM users WHERE email = 'testador@docker.com'");
    });

    it('1. Deve registrar um novo usuário com sucesso (POST /user)', async () => {
        const res = await request(app)
            .post('/user')
            .send({
                email: 'testador@docker.com',
                password: '4444'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Usuário criado com sucesso!');
        expect(res.body.user).toHaveProperty('email', 'testador@docker.com');
    });

    it('2. Deve autenticar e retornar um token JWT (POST /login)', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                email: 'testador@docker.com',
                password: '4444'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        
        // Salva o token para usar no próximo teste
        token = res.body.token; 
    });

    it('3. Deve criar um endereço utilizando o token (POST /addresses)', async () => {
        const res = await request(app)
            .post('/addresses')
            .set('Authorization', `Bearer ${token}`) // Passando o JWT no header
            .send({
                street: 'Rua de teste ',
                number: '404',
                city: 'Docker City',
                state: 'DC',
                zip_code: '00000-000'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Endereço criado com sucesso!');
        expect(res.body.address).toHaveProperty('id');
    });

    it('4. Deve barrar a criação de endereço sem o token JWT', async () => {
        const res = await request(app)
            .post('/addresses')
            .send({
                street: 'Rua Invasor',
                number: '999',
                city: 'Hack Town',
                state: 'HT',
                zip_code: '11111-111'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Token não fornecido. Acesso negado.');
    });
});