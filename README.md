# Backend Endereço

Serviço de backend para CRUD de endereços com rotas protegidas (JWT). Sistema de logs para operações críticas e endpoints de acesso temporário não autenticado.

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [PostgreSQL](https://www.postgresql.org/download/) (opcional, apenas se rodar sem Docker)

## Rodando com Docker (recomendado)

1. Clone o repositório e acesse a pasta:

```bash
git clone https://github.com/JeffersonSantos29/backend-endereco.git
cd backend-endereco
```

2. Suba os containers:

```bash
docker-compose up --build
```

3. A API estará disponível em `http://localhost:3000`.

## Rodando localmente (sem Docker)

1. Clone o repositório e instale as dependências:

```bash
git clone https://github.com/JeffersonSantos29/backend-endereco.git
cd backend-endereco
npm install
```

2. Certifique-se de que o PostgreSQL está rodando e crie o banco:

```sql
CREATE DATABASE address_db;
```

3. Copie o arquivo `.env` (já incluído no repositório) e ajuste `DB_HOST` para `127.0.0.1` caso o banco esteja na mesma máquina.

4. Inicie a aplicação:

```bash
npm start
```

## Variáveis de ambiente

| Variável     | Descrição                        | Valor padrão       |
|--------------|----------------------------------|--------------------|
| `PORT`       | Porta da API                     | `3000`             |
| `DB_HOST`    | Host do PostgreSQL               | `127.0.0.1`        |
| `DB_PORT`    | Porta do PostgreSQL              | `5432`             |
| `DB_USER`    | Usuário do banco                 | `admin`            |
| `DB_PASSWORD`| Senha do banco                   | `admin`            |
| `DB_NAME`    | Nome do banco de dados           | `address_db`       |
| `JWT_SECRET` | Chave secreta para JWT           | `123`              |

## Comandos úteis

| Comando        | Descrição                              |
|----------------|----------------------------------------|
| `npm start`    | Inicia a API (também cria as tabelas)  |
| `npm run dev`  | Inicia com nodemon (auto-reload)       |
| `npm test`     | Executa os testes                      |

## Estrutura do projeto

```
src/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
└── server.js
```

## Endpoints principais

- `POST /users/register` — Registro de usuário
- `POST /users/login` — Login (retorna JWT)
- `GET /address` — Lista endereços (autenticado)
- `GET /address/:id` — Busca endereço por ID (autenticado)
- `POST /address` — Cria endereço (autenticado)
- `PUT /address/:id` — Atualiza endereço (autenticado)
- `DELETE /address/:id` — Remove endereço (autenticado)
