const request = require('supertest');
const app = require('../src/server');
const { resetDb, prisma } = require('./helpers/resetDb');

describe('Testes de Integração - API de Endereços', () => {
    let token = '';
    let addressId;

    const user = { email: 'testador@docker.com', password: '4444' };

    beforeAll(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await resetDb();
        await prisma.$disconnect();
    });

    it('1. Deve registrar um novo usuário com sucesso (POST /user)', async () => {
        const res = await request(app).post('/user').send(user);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Usuário criado com sucesso!');
        expect(res.body.user).toHaveProperty('email', user.email);
    });

    it('1.1 Deve rejeitar registro com e-mail inválido (400)', async () => {
        const res = await request(app).post('/user').send({ email: 'invalido', password: '4444' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('1.2 Deve rejeitar registro de e-mail já em uso (409)', async () => {
        const res = await request(app).post('/user').send(user);

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('error', 'E-mail já está em uso.');
    });

    it('2. Deve autenticar e retornar um token JWT (POST /login)', async () => {
        const res = await request(app).post('/login').send(user);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.headers).toHaveProperty('ratelimit-limit');

        token = res.body.token;
    });

    it('2.1 Deve rejeitar login com credenciais inválidas (401)', async () => {
        const res = await request(app).post('/login').send({ ...user, password: 'errada' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Credenciais inválidas.');
    });

    it('3. Deve criar um endereço utilizando o token (POST /addresses)', async () => {
        const res = await request(app)
            .post('/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send({
                street: 'Rua de teste',
                number: '404',
                city: 'Docker City',
                state: 'DC',
                zip_code: '00000-000',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Endereço criado com sucesso!');
        expect(res.body.address).toHaveProperty('id');

        addressId = res.body.address.id;
    });

    it('4. Deve barrar a criação de endereço sem o token JWT', async () => {
        const res = await request(app).post('/addresses').send({
            street: 'Rua Invasor',
            number: '999',
            city: 'Hack Town',
            state: 'HT',
            zip_code: '11111-111',
        });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Token não fornecido. Acesso negado.');
    });

    it('5. Deve listar endereços filtrando por search', async () => {
        const res = await request(app)
            .get('/addresses')
            .query({ search: 'Docker' })
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((a) => a.id === addressId)).toBe(true);
    });

    it('6. Deve atualizar o endereço do próprio usuário (PUT /addresses/:id)', async () => {
        const res = await request(app)
            .put(`/addresses/${addressId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ city: 'Nova Cidade' });

        expect(res.statusCode).toBe(200);
        expect(res.body.address).toHaveProperty('city', 'Nova Cidade');
    });

    it('7. Não deve permitir atualizar endereço de outro usuário (404)', async () => {
        const outroToken = require('jsonwebtoken').sign(
            { id: 999999, email: 'ninguem@teste.com' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
        );

        const res = await request(app)
            .put(`/addresses/${addressId}`)
            .set('Authorization', `Bearer ${outroToken}`)
            .send({ city: 'Invasão' });

        expect(res.statusCode).toBe(404);
    });

    it('8. Deve gerar um link de compartilhamento e acessá-lo (POST /addresses/:id/share + GET /shared/:token)', async () => {
        const shareRes = await request(app)
            .post(`/addresses/${addressId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expiresIn: '1h' });

        expect(shareRes.statusCode).toBe(200);
        expect(shareRes.body).toHaveProperty('url');

        const sharedToken = shareRes.body.url.split('/shared/')[1];
        const sharedRes = await request(app).get(`/shared/${sharedToken}`);

        expect(sharedRes.statusCode).toBe(200);
        expect(sharedRes.body).toHaveProperty('city', 'Nova Cidade');
    });

    it('8.1 Deve rejeitar expiresIn acima do teto máximo (400)', async () => {
        const res = await request(app)
            .post(`/addresses/${addressId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expiresIn: '30d' });

        expect(res.statusCode).toBe(400);
    });

    it('8.2 Deve rejeitar acesso com token de compartilhamento inválido (401)', async () => {
        const res = await request(app).get('/shared/token-invalido');

        expect(res.statusCode).toBe(401);
    });

    it('9. Deve remover o endereço (DELETE /addresses/:id)', async () => {
        const res = await request(app)
            .delete(`/addresses/${addressId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Endereço removido com sucesso!');
    });

    it('10. GET /ping deve refletir a saúde da conexão com o Postgres', async () => {
        const res = await request(app).get('/ping');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
});
