# Backend Endereço

API REST em Node.js (CommonJS) + Express 5 para CRUD de endereços, com autenticação JWT,
auditoria de mutações (`logs`) e links de compartilhamento público temporário. Persistência via
**Prisma** sobre PostgreSQL, validação de entrada com **Zod**, rate limiting nas rotas sensíveis e
logging estruturado (Pino) com correlação por `request_id`.

---

## Arquitetura

```
routes/        → mapeamento HTTP verbo+path → controller. Sem lógica.
controllers/    → parse de req (via schemas/), chama service, formata res. Sem SQL, sem regra de negócio.
services/       → regra de negócio pura (ownership check, geração de token, auditoria em logs).
repositories/   → único lugar que fala com o banco, via Prisma Client.
schemas/        → validação de entrada (Zod), um schema por endpoint/payload.
errors/         → classes de erro customizadas (NotFoundError, ValidationError, ...).
middlewares/    → auth, rate limiting, error handler central.
```

Fluxo de uma requisição autenticada:

```
Client → routes → authMiddleware → controller → schema.parse() → service → repository → Prisma → PostgreSQL
                                                                       ↓
                                                            errorHandler (em caso de erro) → res
```

---

## Pré-requisitos

* [Node.js](https://nodejs.org/) v18+ (testado com v22)
* [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
* [PostgreSQL](https://www.postgresql.org/download/) (apenas se for rodar sem Docker)

---

## Como rodar (Docker, recomendado)

1. Clone o repositório e acesse a pasta:

   ```bash
   git clone https://github.com/JeffersonSantos29/backend-endereco.git
   cd backend-endereco
   ```

2. Copie `.env.example` para `.env` e ajuste os valores (nunca use os placeholders em produção):

   ```bash
   cp .env.example .env
   ```

3. Suba os containers (API + Postgres + Nginx + Prometheus + Grafana + Metabase):

   ```bash
   docker compose up --build
   ```

   O container da API roda `prisma migrate deploy` automaticamente antes de iniciar o servidor
   (ver `CMD` do `Dockerfile`), então o schema do banco é aplicado sozinho no primeiro boot.

4. A API estará disponível em `http://localhost:3000` (e via Nginx em `http://localhost:80`).

---

## Como rodar localmente (sem Docker)

1. Instale as dependências:

   ```bash
   npm install
   ```

   O `postinstall` já roda `prisma generate` automaticamente.

2. Suba um Postgres local (ou use só o serviço `db` do compose):

   ```bash
   docker compose up -d db
   ```

3. Copie `.env.example` para `.env` e ajuste `DB_*`/`DATABASE_URL` para apontar para esse banco.

4. Aplique as migrations:

   ```bash
   npm run migrate:dev
   ```

5. Inicie a API:

   ```bash
   npm run dev    # com auto-reload (nodemon)
   # ou
   npm start      # produção
   ```

---

## Variáveis de ambiente

Veja `.env.example` para o template completo. `.env` (dev) e `.env.test` (testes) nunca são
commitados — cobertos pelo `.gitignore` da raiz.

| Variável                 | Descrição                                            |
|--------------------------|-------------------------------------------------------|
| `PORT`                   | Porta em que a API escuta                             |
| `DB_HOST`/`DB_PORT`      | Host/porta do PostgreSQL                              |
| `DB_USER`/`DB_PASSWORD`  | Credenciais do PostgreSQL                              |
| `DB_NAME`                | Nome do banco (dev)                                    |
| `DATABASE_URL`           | Connection string usada pelo Prisma                    |
| `JWT_SECRET`             | Chave secreta para assinar/validar tokens JWT          |
| `GRAFANA_ADMIN_PASSWORD` | Senha do admin do Grafana (só usada pelo docker-compose)|

---

## Banco de dados e migrations

Schema versionado em `prisma/schema.prisma`; alterações passam sempre por uma migration, nunca
por `ALTER TABLE` manual (ver skill `db-migration`).

| Comando               | Quando usar                                                    |
|------------------------|-----------------------------------------------------------------|
| `npm run migrate:dev`  | Em desenvolvimento — cria e aplica uma nova migration a partir das mudanças em `schema.prisma` |
| `npm run migrate:deploy` | Em CI/produção — aplica migrations já commitadas, sem gerar novas |
| `npx prisma studio`    | Interface visual para inspecionar os dados                    |

---

## Testes

```bash
npm test
```

Roda com `NODE_ENV=test`, que carrega `.env.test` (banco `address_db_test`) — **nunca** o banco
de dev/produção do `.env` principal (ver skill `safe-test-run`). `npm start` não dispara testes.

* `__tests__/unit/` — services com repository mockado (`jest.mock`), sem depender de banco real.
* `__tests__/integration.test.js` — end-to-end via Supertest contra `address_db_test`, com
  limpeza via `deleteMany()` entre execuções (sem `DELETE` manual órfão em `logs`).

---

## Validando a API manualmente (passo a passo)

Com a API rodando em `http://localhost:3000`:

1. **Health check** — confirma que a API e o Postgres estão de pé:

   ```bash
   curl http://localhost:3000/ping
   # {"status":"ok"}  (200)  |  {"status":"error", ...} (503) se o Postgres estiver inacessível
   ```

2. **Registrar um usuário:**

   ```bash
   curl -X POST http://localhost:3000/user \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@exemplo.com","password":"senha123"}'
   ```

3. **Login** (guarde o `token` retornado):

   ```bash
   curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@exemplo.com","password":"senha123"}'
   ```

4. **Criar um endereço** (substitua `<TOKEN>`):

   ```bash
   curl -X POST http://localhost:3000/addresses \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"street":"Rua Teste","number":"123","city":"Joinville","state":"SC","zip_code":"89200-000"}'
   ```

5. **Listar endereços** (com busca opcional):

   ```bash
   curl "http://localhost:3000/addresses?search=Joinville" \
     -H "Authorization: Bearer <TOKEN>"
   ```

6. **Atualizar** (substitua `<ID>`; campos não enviados são preservados):

   ```bash
   curl -X PUT http://localhost:3000/addresses/<ID> \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"city":"Nova Cidade"}'
   ```

7. **Gerar link de compartilhamento** (`expiresIn` aceita `<número><s|m|h|d>`, teto de 7 dias):

   ```bash
   curl -X POST http://localhost:3000/addresses/<ID>/share \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"expiresIn":"1h"}'
   ```

8. **Acessar o link público** (sem autenticação; use o token retornado no passo anterior):

   ```bash
   curl http://localhost:3000/shared/<TOKEN_DO_LINK>
   ```

9. **Remover o endereço:**

   ```bash
   curl -X DELETE http://localhost:3000/addresses/<ID> \
     -H "Authorization: Bearer <TOKEN>"
   ```

10. **Validar a suíte automatizada** (cobre todos os fluxos acima, incluindo casos de erro):

    ```bash
    npm test
    ```

Uma collection do Postman equivalente está em `postman/backend-endereco.postman_collection.json`
(a variável de collection `token` deve ser preenchida manualmente após o login — nunca cole um
token real e commite o arquivo).

---

## Segurança

* `/login` e `/shared/:token` têm rate limiting (`src/middlewares/rateLimiter.js`).
* Toda leitura/atualização/remoção de endereço filtra por `user_id`, não só pelo `id` da URL.
* `expiresIn` do link de compartilhamento tem teto de 7 dias, validado no schema.
* Segredos (`JWT_SECRET`, senha do banco) só via variável de ambiente — nunca hardcoded em
  código, `docker-compose.yml` ou manifests `k8s/*.yaml` (que usam `secretKeyRef`; veja
  `k8s/secret.example.yaml` para o template do Secret real).

## Observabilidade

* `/ping` valida a conexão com o Postgres antes de responder (200 saudável / 503 indisponível).
* `/metrics` (Prometheus, via `express-prom-bundle`).
* Logging estruturado (Pino) com `request_id` correlacionando as linhas de uma mesma requisição.

---

## Comandos úteis

| Comando               | Descrição                                             |
|------------------------|--------------------------------------------------------|
| `npm start`            | Inicia a API (sem rodar testes nem migrations)         |
| `npm run dev`          | Inicia com nodemon (auto-reload)                       |
| `npm test`             | Executa a suíte de testes contra o banco de teste       |
| `npm run migrate:dev`  | Cria/aplica uma migration em desenvolvimento           |
| `npm run migrate:deploy` | Aplica migrations pendentes (CI/produção)            |

---

## Estrutura do projeto

```
__tests__/
├── unit/                 # services com repository mockado
├── integration.test.js   # end-to-end via Supertest
└── helpers/
postman/
prisma/
├── schema.prisma
└── migrations/
src/
├── config/               # env, logger, prismaClient
├── controllers/
├── services/
├── repositories/
├── schemas/
├── errors/
├── middlewares/          # auth, rateLimiter, errorHandler
├── routes/
└── server.js
```

## Endpoints

| Método | Rota                        | Auth | Descrição                                  |
|--------|------------------------------|:----:|----------------------------------------------|
| GET    | `/ping`                      | —    | Health check (valida conexão com o Postgres)  |
| POST   | `/user`                      | —    | Registra um novo usuário                       |
| POST   | `/login`                     | —    | Autentica e retorna um JWT (rate limited)      |
| POST   | `/addresses`                 | JWT  | Cria um endereço                               |
| GET    | `/addresses?search=`         | JWT  | Lista endereços do usuário (busca opcional)    |
| PUT    | `/addresses/:id`             | JWT  | Atualiza um endereço do próprio usuário        |
| DELETE | `/addresses/:id`             | JWT  | Remove um endereço do próprio usuário          |
| POST   | `/addresses/:id/share`       | JWT  | Gera link de compartilhamento temporário       |
| GET    | `/shared/:token`             | —    | Acessa um endereço via link (rate limited)     |
