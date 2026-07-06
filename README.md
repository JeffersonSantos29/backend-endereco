#  Backend Endereço

Serviço de backend construído em Node.js e Express para um CRUD de endereços com rotas protegidas por JWT. O sistema conta com logs passivos para operações críticas, testes automatizados e endpoints de acesso temporário não autenticado via links de compartilhamento.

##  Pré-requisitos

* [Node.js](https://nodejs.org/) (v18 ou superior)
* [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
* [PostgreSQL](https://www.postgresql.org/download/) (apenas caso rode localmente sem o Docker)

---

##  Arquitetura e Fluxo de Dados

```mermaid
sequenceDiagram
    autonumber
    actor Client

    box "Backend (Node.js / Express)"
        participant App as Express API
        participant MW as Auth Middleware
        participant UC as userController
        participant AC as addressController
    end

    box "Database"
        participant DB as PostgreSQL (pg)
    end

    %% Health Check
    Client->>App: GET /ping
    App-->>Client: 200 OK {"message": "..."}

    %% Fluxo 1: Registro de Usuário
    Client->>UC: POST /user {email, password}
    UC->>DB: INSERT INTO users (email, password)
    DB-->>UC: user created
    UC-->>Client: 201 Usuário criado com sucesso

    %% Fluxo 2: Login e Geração de JWT
    Client->>UC: POST /login {email, password}
    UC->>DB: SELECT * FROM users WHERE email
    DB-->>UC: user row
    UC->>UC: bcrypt.compare(password, hash)
    UC->>UC: jwt.sign({id, email}, JWT_SECRET)
    UC-->>Client: 200 {token: "<JWT>"}

    %% Fluxo 3: Criar Endereço (autenticado)
    Client->>AC: POST /addresses + Bearer <JWT>
    AC->>MW: valida header Authorization
    MW->>MW: jwt.verify(token)
    MW->>AC: req.userId = decoded.id
    AC->>DB: INSERT INTO addresses (user_id, street, number, city, state, zip_code)
    DB-->>AC: address created
    AC-->>Client: 201 Endereço criado com sucesso

    %% Fluxo 4: Buscar Endereços (com busca opcional)
    Client->>AC: GET /addresses?search=Rua + Bearer <JWT>
    AC->>MW: valida JWT
    MW->>AC: req.userId
    AC->>DB: SELECT * FROM addresses WHERE user_id = $1 AND (street ILIKE $2 OR city ILIKE $2 OR state ILIKE $2)
    DB-->>AC: rows[]
    AC-->>Client: 200 [{address objects}]

    %% Fluxo 5: Atualizar Endereço (com log)
    Client->>AC: PUT /addresses/:id + Bearer <JWT> {street, number, ...}
    AC->>MW: valida JWT
    MW->>AC: req.userId
    AC->>DB: SELECT * FROM addresses WHERE id = $1 AND user_id = $2
    DB-->>AC: endereço encontrado (dados anteriores)
    AC->>DB: UPDATE addresses SET ... WHERE id = $6 AND user_id = $7 RETURNING *
    DB-->>AC: endereço atualizado
    AC->>DB: INSERT INTO logs (user_id, action, entity_id, previous_data, new_data)
    DB-->>AC: log registrado
    AC-->>Client: 200 Endereço atualizado com sucesso

    %% Fluxo 6: Deletar Endereço (com log)
    Client->>AC: DELETE /addresses/:id + Bearer <JWT>
    AC->>MW: valida JWT
    MW->>AC: req.userId
    AC->>DB: SELECT * FROM addresses WHERE id = $1 AND user_id = $2
    DB-->>AC: endereço encontrado (dados anteriores)
    AC->>DB: DELETE FROM addresses WHERE id = $1 AND user_id = $2
    AC->>DB: INSERT INTO logs (user_id, action, entity_id, previous_data, new_data)
    DB-->>AC: log registrado
    AC-->>Client: 200 Endereço removido com sucesso

    %% Fluxo 7: Compartilhar Endereço (gera link temporário)
    Client->>AC: POST /addresses/:id/share {expiresIn: "1h"} + Bearer <JWT>
    AC->>MW: valida JWT
    MW->>AC: req.userId
    AC->>DB: SELECT * FROM addresses WHERE id = $1 AND user_id = $2
    DB-->>AC: endereço encontrado
    AC->>AC: jwt.sign({addressId}, JWT_SECRET, {expiresIn})
    AC-->>Client: 200 {"url": "http://localhost:3000/shared/<token>"}

    %% Fluxo 8: Acesso Público via Link Compartilhado (sem autenticação)
    Client->>AC: GET /shared/:token (sem header de auth)
    AC->>AC: jwt.verify(token) → obtém addressId
    AC->>DB: SELECT street, number, city, state, zip_code FROM addresses WHERE id = $1
    DB-->>AC: dados do endereço
    AC-->>Client: 200 {address object}

    %% Fallback: Acesso negado (sem token)
    Client->>MW: POST /addresses (sem Authorization header)
    MW-->>Client: 401 Token não fornecido. Acesso negado.

    %% Notas de Instrumentação
    Client-->>App: Express + bcrypt + jsonwebtoken | PostgreSQL (pg) | dotenv



```
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
_tests_/
postman/
src/
├── config/
├── controllers/
├── middlewares/
├── routes/
└── server.js
```

## Endpoints principais

GetAdress

Método: GET

` http://localhost:3000/addresses?search=joinville`

CreateUser

Método: POST

` http://localhost:3000/user`


Update data

Método: PUT

`http://localhost:3000/addresses/2`

Delete Dado-endereco

Método: DELETE

` http://localhost:3000/addresses/2`

Login

Método: POST

` http://localhost:3000/login`

Adress

Método: POST

` http://localhost:3000/addresses`

CreateShared(link-temporário)

Método: POST

` http://localhost:3000/addresses/3/share`


