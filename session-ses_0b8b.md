# Análise arquitetura e stack técnico

**Session ID:** ses_0b8ba4e45ffeZ7nbaI8K3nR4H6
**Created:** 09/07/2026, 11:26:17
**Updated:** 09/07/2026, 11:28:56

---

## User

Você é um engenheiro de software sênior e está analisando esse repositório como todo, dando detalhes da arquitetura, designe system, lógica de negócio e contexto técnico(SDKs utilizados, bibliotecas e frameworks) explique com rigor e profundidade

---

## Assistant (Plan · Step 3.7 Flash · 113.4s)

_Thinking:_

The user is asking me to analyze the repository comprehensively, covering architecture, design system, business logic, and technical context (SDKs, libraries, frameworks). They want a rigorous and deep explanation. I'm in plan mode (read-only), so I should only observe, analyze, and plan.

Let me start by exploring the repository structure to understand

**Tool: task**

**Input:**
```json
{
  "description": "Explore repository structure",
  "prompt": "Explore the repository at C:\\backend-endereco thoroughly. I need to understand:\n1. The overall directory structure (top-level and key subdirectories)\n2. What kind of project this is (language, framework, etc.)\n3. Key configuration files (package.json, tsconfig, dockerfile, etc.)\n4. Main entry points and application structure\n\nPlease provide a comprehensive overview of the directory layout and identify the most important files and directories.",
  "subagent_type": "explore"
}
```

**Output:**
```
<task id="ses_0b8ba2aa9ffekH2HXWP7A0T61Q" state="completed">
<task_result>
## Comprehensive Repository Overview: `C:\backend-endereco`

---

### 1. Overall Directory Structure

```
C:\backend-endereco/
├── .git/                          # Git repository data
├── node_modules/                  # Installed dependencies
├── postman/                       # API collection for testing
│   └── backend-endereco.postman_collection.json
├── src/                           # Application source code
│   ├── .gitignore                 # Ignores node_modules, .env, logs, coverage
│   ├── config/
│   │   ├── database.js            # PostgreSQL connection pool
│   │   └── init-db.js             # Table creation script (users, addresses, logs)
│   ├── controllers/
│   │   ├── userController.js      # Register & Login logic
│   │   └── addressController.js   # CRUD + Share logic for addresses
│   ├── middlewares/
│   │   └── authMiddleware.js      # JWT Bearer token validation
│   ├── routes/
│   │   ├── userRoutes.js          # /user, /login endpoints
│   │   └── addressRoutes.js       # /addresses, /shared/:token endpoints
│   └── server.js                  # Main Express application entry point
├── __tests__/
│   └── integration.test.js        # Jest + Supertest integration tests
├── .env                           # Environment variables (DB creds, JWT secret, port)
├── docker-compose.yml             # Docker Compose for API + PostgreSQL
├── Dockerfile                     # Node.js container image definition
├── package.json                   # Dependencies & scripts
├── package-lock.json              # Locked dependency tree
└── README.md                      # Project documentation with Mermaid diagrams
```

---

### 2. Project Type

| Attribute | Details |
|-----------|---------|
| **Language** | JavaScript (Node.js, CommonJS modules — `"type": "commonjs"`) |
| **Runtime** | Node.js 18+ (Dockerfile uses `node:22-alpine`) |
| **Web Framework** | Express.js (v5.2.1) |
| **Database** | PostgreSQL via `pg` (v8.22.0) |
| **Authentication** | JWT (`jsonwebtoken` v9.0.3) + bcrypt (v6.0.0) for password hashing |
| **Testing** | Jest (v30.4.2) + Supertest (v7.2.2) |
| **Dev Tooling** | nodemon (v3.1.14) for auto-reload |
| **Containerization** | Docker & Docker Compose |
| **Architecture** | Simple MVC pattern: Routes → Controllers → Middlewares, with direct SQL queries |

**Purpose:** A backend service for a full CRUD of addresses with JWT-protected routes, passive logging for critical operations (update/delete), and temporary public access via shareable links.

---

### 3. Key Configuration Files

| File | Role |
|------|------|
| **`C:\backend-endereco\package.json`** | Defines dependencies, scripts (`dev`, `start`, `test`), and module type. Key scripts: `npm run dev` (nodemon), `npm test` (jest), `npm start` (init-db + tests + server). |
| **`C:\backend-endereco\Dockerfile`** | Multi-stage Node.js container on `node:22-alpine`. Copies `package*.json`, runs `npm install`, copies source, exposes port 3000, runs `npm start`. |
| **`C:\backend-endereco\docker-compose.yml`** | Defines two services: `db` (PostgreSQL 15) and `api` (builds from Dockerfile, depends on `db`, mounts `.env`). Uses a named volume `pgdata`. |
| **`C:\backend-endereco\.env`** | Runtime config: `PORT=3000`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USER=admin`, `DB_PASSWORD=admin`, `DB_NAME=address_db`, `JWT_SECRET=123`. |
| **`C:\backend-endereco\src\.gitignore`** | Ignores `node_modules/`, all `.env*` files, npm/yarn logs, Jest `coverage/`, and OS files. |

**Note:** There is **no `tsconfig.json`** — this is a pure JavaScript project, not TypeScript.

---

### 4. Main Entry Points & Application Structure

#### Primary Entry Point
- **`C:\backend-endereco\src\server.js`**
  - Loads `dotenv`, initializes Express with `express.json()`.
  - Registers two route groups: `userRoutes` and `addressRoutes`.
  - Provides a health check endpoint: `GET /ping`.
  - Starts the server on `process.env.PORT || 3000` when run directly (`if (require.main === module)`).
  - Exports the `app` object for testing purposes.

#### Database Initialization
- **`C:\backend-endereco\src\config\init-db.js`**
  - Creates three tables via raw SQL if they do not already exist:
    - `users` (id, email, password, created_at)
    - `addresses` (id, user_id FK, street, number, city, state, zip_code, created_at)
    - `logs` (id, user_id FK, action, entity_id, previous_data JSONB, new_data JSONB, created_at)
  - Invoked automatically before tests and server start via `npm start`.

#### Route & Controller Map

| Route Method | Path | Controller Function | Auth Required? |
|--------------|------|---------------------|----------------|
| `POST` | `/user` | `userController.registerUser` | No |
| `POST` | `/login` | `userController.loginUser` | No |
| `GET` | `/shared/:token` | `addressController.getSharedAddress` | No (temporary public link) |
| `POST` | `/addresses` | `addressController.createAddress` | Yes |
| `GET` | `/addresses` | `addressController.getAddresses` | Yes |
| `PUT` | `/addresses/:id` | `addressController.updateAddress` | Yes |
| `DELETE` | `/addresses/:id` | `addressController.deleteAddress` | Yes |
| `POST` | `/addresses/:id/share` | `addressController.shareAddress` | Yes |

#### Middleware
- **`C:\backend-endereco\src\middlewares\authMiddleware.js`**
  - Applied globally to all `/addresses` routes **except** `/shared/:token`.
  - Extracts `Authorization: Bearer <token>` header, verifies JWT using `process.env.JWT_SECRET`.
  - Attaches `req.userId` on success; returns `401` on missing/invalid/expired token.

#### Testing
- **`C:\backend-endereco\__tests__\integration.test.js`**
  - Uses `supertest` to hit the Express app directly.
  - Cleanly inserts and deletes a test user (`testador@docker.com`) between tests.
  - Validates: user registration (201), login/JWT generation (200), address creation with token (201), and unauthorized access rejection (401).

#### API Collection
- **`C:\backend-endereco\postman\backend-endereco.postman_collection.json`**
  - Contains six requests: `GetAdress`, `CreateUser`, `Update data`, `Delete Dado-endereco`, `Login`, `Adress`, and `CreateShared(link-temporário)`.
  - Pre-configured with a hardcoded Bearer token for authenticated requests.

---

### Summary of Important Paths

- **App Entry:** `C:\backend-endereco\src\server.js`
- **DB Connection:** `C:\backend-endereco\src\config\database.js`
- **DB Schema Init:** `C:\backend-endereco\src\config\init-db.js`
- **Auth Layer:** `C:\backend-endereco\src\middlewares\authMiddleware.js`
- **User Logic:** `C:\backend-endereco\src\controllers\userController.js`
- **Address Logic:** `C:\backend-endereco\src\controllers\addressController.js`
- **Integration Tests:** `C:\backend-endereco\__tests__\integration.test.js`
- **Container Orchestration:** `C:\backend-endereco\docker-compose.yml` + `C:\backend-endereco\Dockerfile`

This is a clean, well-documented, minimal Node.js/Express REST API designed for the CRUD of addresses with JWT authentication and Dockerized deployment.
</task_result>
</task>
```

**Tool: task**

**Input:**
```json
{
  "description": "Analyze dependencies and tech stack",
  "prompt": "Explore the repository at C:\\backend-endereco and identify:\n1. All dependencies (package.json, requirements.txt, go.mod, etc.) - read the actual files\n2. Frameworks and libraries used (web frameworks, ORMs, testing libraries, etc.)\n3. SDKs or external API integrations\n4. Build tools and scripts\n5. Any technical documentation or README files\n\nRead the key configuration and manifest files to get exact dependency information. Focus on versions and purposes of each major dependency.",
  "subagent_type": "explore"
}
```

**Output:**
```
<task id="ses_0b8ba239bffeOyV9FpJNBLwBD6" state="completed">
<task_result>
Here is a comprehensive analysis of the repository at `C:\backend-endereco`:

## 1. Dependencies (Manifest Files)

**Primary manifest:** `C:\backend-endereco\package.json` (lockfileVersion 3)
- No Python (`requirements.txt`), Go (`go.mod`), Java (`pom.xml`/`build.gradle`), or Rust (`Cargo.toml`) manifests found — this is exclusively a Node.js project.

**Runtime dependencies (`package.json`):**
| Package | Version | Purpose |
|---|---|---|
| `bcrypt` | ^6.0.0 | Password hashing for user credentials |
| `dotenv` | ^17.4.2 | Environment variable loading from `.env` |
| `express` | ^5.2.1 | Web server / REST API framework |
| `jsonwebtoken` | ^9.0.3 | JWT creation and verification for auth |
| `pg` | ^8.22.0 | PostgreSQL driver (node-postgres) |

**Development dependencies:**
| Package | Version | Purpose |
|---|---|---|
| `jest` | ^30.4.2 | Test runner and framework |
| `nodemon` | ^3.1.14 | Auto-reload during development |
| `supertest` | ^7.2.2 | HTTP integration testing for Express |

---

## 2. Frameworks and Libraries Used

**Web Framework:**
- **Express 5.2.1** — Server (`src/server.js`) uses `express.json()` middleware, Router-based route separation (`userRoutes.js`, `addressRoutes.js`).

**Database / ORM:**
- **node-postgres (`pg`) 8.22.0** — Direct connection pooling via `Pool`. No ORM (e.g., Sequelize/Prisma) is used; raw SQL queries are executed directly in controllers (e.g., `SELECT * FROM addresses WHERE ...`).

**Authentication / Security:**
- **bcrypt 6.0.0** — Hash generation (`genSalt` + `hash`) in registration; comparison (`compare`) during login.
- **jsonwebtoken 9.0.3** — Issues JWT on login (expiresIn: `1d`); also issues temporary share-tokens for public address links.

**Configuration:**
- **dotenv 17.4.2** — Loads `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.

**Testing:**
- **Jest 30.4.2** — Test runner (configured via CLI flags in scripts: `--detectOpenHandles --forceExit`).
- **Supertest 7.2.2** — Makes assertions against the live Express app instance for integration testing.

---

## 3. SDKs or External API Integrations

No third-party cloud/public API SDKs (e.g., AWS SDK, Stripe, SendGrid) are used. The only external integration is:
- **PostgreSQL 15** (via Docker or local) — accessed through the `pg` driver. Connection details are configured in `.env`.

---

## 4. Build Tools and Scripts

**`npm` scripts (`package.json`):**
- `dev`: `nodemon src/server.js` — development with auto-reload
- `start`: `node src/config/init-db.js && npm test && node src/server.js` — initializes DB tables, runs tests, then starts server
- `test`: `jest --detectOpenHandles --forceExit` — runs Jest integration tests

**Dockerfile (`C:\backend-endereco\Dockerfile`):**
- Base image: `node:22-alpine`
- Workdir: `/app`
- Installs dependencies with `npm install` (production installs based on `NODE_ENV` if set)
- Exposes port `3000`
- Default command: `npm start`

**Docker Compose (`C:\backend-endereco\docker-compose.yml`):**
- Two services:
  - `db`: PostgreSQL 15 (ports `5432:5432`, volume `pgdata`)
  - `api`: Builds from Dockerfile, maps port `3000:3000`, loads env via `.env`, depends on `db`

**Database Initialization:**
- `src/config/init-db.js` — DDL script executed before server start to create tables (`users`, `addresses`, `logs`) if they do not exist.

**No transpilation/build step:** Plain CommonJS Node.js (no Babel, TypeScript, or bundlers).

---

## 5. Technical Documentation / README

**`C:\backend-endereco\README.md`:** Contains:
- Project description (Node.js + Express address CRUD with JWT-protected routes and passive logging)
- Architecture/sequence diagram in Mermaid showing 8 flows (health check, registration, login, CRUD with auth, share link generation, public shared access)
- Prerequisites: Node.js v18+, Docker & Docker Compose, optional local PostgreSQL
- Setup instructions for Docker and local
- Environment variables table (`PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`)
- CLI commands (`npm start`, `npm run dev`, `npm test`)
- Project structure (`__tests__/`, `postman/`, `src/` with config, controllers, middlewares, routes, `server.js`)
- Main endpoint list with HTTP methods and URLs

**`C:\backend-endereco\postman/backend-endereco.postman_collection.json`** — Postman collection for API testing.

**`C:\backend-endereco\.env`** — Environment configuration file (committed to repo, exposes defaults: `PORT=3000`, `JWT_SECRET=123`, PostgreSQL creds `admin/admin`).

---

## Project Architecture Summary

- **Language/runtime:** Node.js (CommonJS)
- **Server:** Express 5.x
- **Database:** PostgreSQL 15 (via `pg` driver)
- **Auth:** bcrypt + jsonwebtoken (JWT)
- **Testing:** Jest + Supertest
- **Deployment:** Docker + Docker Compose (Node 22 Alpine + PostgreSQL 15)
- **Pattern:** MVC-lite — separate files for routes, controllers, middlewares, and DB config without an ORM.
</task_result>
</task>
```

**Tool: task**

**Input:**
```json
{
  "description": "Analyze business logic and architecture",
  "prompt": "Explore the repository at C:\\backend-endereco and analyze:\n1. The application architecture (monolith, microservices, layered architecture, etc.)\n2. Business logic - what does this application do? What are the core entities/domains?\n3. API routes/endpoints structure\n4. Database schema and data models (if applicable)\n5. Design patterns used (repository, service layer, factory, etc.)\n6. Authentication/authorization approach\n7. External integrations\n\nRead as many source files as needed to understand the business logic deeply. Look at controllers, services, models/middleware. Provide specific file paths and line numbers where key logic lives.",
  "subagent_type": "explore"
}
```

**Output:**
```
<task id="ses_0b8ba1b54ffeAGwsu9kq6jGshU" state="completed">
<task_result>
Here is a thorough analysis of the repository at `C:\backend-endereco`.

---

## 1. Application Architecture

**Type: Layered Monolithic Application (MVC-lite)**

The application is a single-Node.js-process Express server. It follows a light layered structure with clear separation of concerns, but is not formally a "Clean/Hexagonal" architecture.

| Layer | Location | Files |
|---|---|---|
| **Entrypoint** | `C:\backend-endereco\src\server.js` | `server.js` |
| **Routes** | `C:\backend-endereco\src\routes\` | `userRoutes.js`, `addressRoutes.js` |
| **Controllers** | `C:\backend-endereco\src\controllers\` | `userController.js`, `addressController.js` |
| **Middleware** | `C:\backend-endereco\src\middlewares\` | `authMiddleware.js` |
| **Data Access / Config** | `C:\backend-endereco\src\config\` | `database.js`, `init-db.js` |

There is **no** formal Service layer or Repository layer. All SQL queries are embedded directly inside the controller functions using the `pg` (node-postgres) library.

---

## 2. Business Logic — What the Application Does

The application is a **CRUD address management system with JWT-based authentication** and **temporary public sharing links**.

### Core Domains / Entities

**`users`** — Registered application users.
- `id` (SERIAL PK), `email` (UNIQUE), `password` (bcrypt hash), `created_at`

**`addresses`** — Addresses owned by users.
- `id` (SERIAL PK), `user_id` (FK → users), `street`, `number`, `city`, `state`, `zip_code`, `created_at`

**`logs`** — Audit trail for critical mutations.
- `id` (SERIAL PK), `user_id` (FK → users, nullable), `action` (e.g. `'UPDATE'`, `'DELETE'`), `entity_id` (address ID), `previous_data` (JSONB), `new_data` (JSONB), `created_at`

### Key Business Flows

1. **User Registration** (`POST /user`) — creates a user with a bcrypt-hashed password.
2. **Login** (`POST /login`) — verifies credentials, returns a JWT valid for 1 day.
3. **CRUD Addresses** — Authenticated users can create, read (with optional search), update, and delete their own addresses.
4. **Audit Logging** — `UPDATE` and `DELETE` operations automatically journal the before/after data into the `logs` table.
5. **Temporary Shared Links** — Authenticated users can generate a time-limited, JWT-signed URL (`/shared/:token`) that grants read-only public access to a single address without requiring a login.
6. **Search** — `GET /addresses?search=<term>` performs a case-insensitive search across `street`, `city`, and `state` using PostgreSQL `ILIKE`.

---

## 3. API Routes / Endpoints Structure

Defined in two route files:

**`C:\backend-endereco\src\routes\userRoutes.js`** (unauthenticated routes)
- `POST /user` — Register user → `userController.registerUser` (line 5)
- `POST /login` — Login / obtain JWT → `userController.loginUser` (line 6)
- Mounted at root: `app.use('/', userRoutes)` in `server.js` line 11

**`C:\backend-endereco\src\routes\addressRoutes.js`** (mixed auth)
- **Public:** `GET /shared/:token` → `addressController.getSharedAddress` (line 8) — *placed before* the auth middleware so it is reachable without a JWT.
- **Auth barrier:** `router.use(authMiddleware)` (line 12) — all routes below this line require a valid `Bearer` JWT.
- **Protected:** (lines 17–21)
  - `POST /addresses` — create address
  - `GET /addresses` — list own addresses (with optional `?search=`)
  - `PUT /addresses/:id` — update own address
  - `DELETE /addresses/:id` — delete own address
  - `POST /addresses/:id/share` — generate temporary shared link

**Health check:**
- `GET /ping` — defined inline in `server.js` line 16.

---

## 4. Database Schema and Data Models

Schema is created on startup by `C:\backend-endereco\src\config\init-db.js` (lines 4–32). The PostgreSQL connection is a simple exported `query()` wrapper in `C:\backend-endereco\src\config\database.js` (lines 21–22).

```sql
-- users table (init-db.js lines 5-10)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- addresses table (init-db.js lines 12-21)
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(50) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- logs table (init-db.js lines 23-31)
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key FK behaviors:**
- Deleting a user cascades to delete their addresses (line 14: `ON DELETE CASCADE`).
- Deleting a user nullifies the `user_id` in `logs` (line 25: `ON DELETE SET NULL`).

---

## 5. Design Patterns Used

| Pattern | Where Used | Notes |
|---|---|---|
| **Router/Controller separation** | `src/routes/*.js` + `src/controllers/*.js` | Express Router instances delegate to controller functions. |
| **Middleware pattern** | `src/middlewares/authMiddleware.js` | An Express middleware that validates JWT and injects `req.userId` (lines 4–36). |
| **Route-level middleware order** | `src/routes/addressRoutes.js` line 8 vs 12 | The `/shared/:token` route is declared *before* the auth barrier, allowing selective public access. |
| **Partial updates via COALESCE** | `src/controllers/addressController.js` lines 76–85 | The `UPDATE` query uses `COALESCE($n, column_name)` so that fields omitted from the request body keep their existing values. |
| **JSONB for audit logs** | `src/controllers/addressController.js` lines 90–93, 120–123 | Full before/after snapshots stored as JSONB in the `logs` table. |

**Notable absences:**
- **No Service layer** — business logic lives directly in controllers.
- **No Repository/DAO layer** — SQL strings are written inline in controllers.
- **No DTO/validation library** — validation is manually done with `if (!field)` checks.

---

## 6. Authentication / Authorization Approach

**Primary mechanism: JWT (JSON Web Token) with Bearer header**

**Files and lines of key logic:**

**`C:\backend-endereco\src\middlewares\authMiddleware.js`**
- Extracts token from `Authorization: Bearer <token>` header (line 6).
- Validates structure (lines 13–21): must be exactly 2 space-separated parts, scheme must be `Bearer`.
- Calls `jwt.verify(token, process.env.JWT_SECRET, ...)` (line 26).
- On success, sets `req.userId = decoded.id` (line 32) for downstream controllers.
- On any failure, returns `401` (lines 9, 17, 22, 28).

**`C:\backend-endereco\src\controllers\userController.js`**
- Token generation on login (lines 62–66):
  ```js
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  ```

**`C:\backend-endereco\src\controllers\addressController.js`**
- **Temporary share link** (lines 150–154): A second JWT is minted containing only `{ addressId }` and a caller-supplied `expiresIn` (e.g. `"1h"`, `"30m"`, `"1d"`). This token is not a user-session token; it is a purpose-built read-only access token.
- **Shared link consumption** (lines 169–195): `jwt.verify(token, JWT_SECRET)` extracts `addressId` from the token payload and fetches the address. Expired or tampered tokens return `401`.

**Scope of authorization:**
- Users can only CRUD *their own* addresses — every protected address endpoint checks `WHERE id = $1 AND user_id = $2` (e.g. addressController lines 68, 83, 109).
- Shared links bypass the `authMiddleware` entirely but are read-only and time-limited.

**JWT secret source:** `C:\backend-endereco\.env` line 7: `JWT_SECRET=123` (⚠️ clearly a development placeholder).

---

## 7. External Integrations

There are **no third-party API integrations** in this codebase.

| Dependency | Purpose | Version |
|---|---|---|
| `express` | HTTP server & routing | `^5.2.1` |
| `pg` | PostgreSQL driver | `^8.22.0` |
| `bcrypt` | Password hashing (register & login) | `^6.0.0` |
| `jsonwebtoken` | JWT creation + verification | `^9.0.3` |
| `dotenv` | Environment variable loading | `^17.4.2` |

**Infrastructure / DevOps integrations:**
- **Docker / Docker Compose** — `C:\backend-endereco\Dockerfile` (lines 1–20, Node 22 Alpine image) and `C:\backend-endereco\docker-compose.yml` (lines 1–32, spins up PostgreSQL 15 + the API container with health dependency ordering via `depends_on`).
- **Jest + Supertest** — integration tests in `C:\backend-endereco\__tests__\integration.test.js` (77 lines, tests register → login → create address → unauthorized rejection).
- **Postman collection** — `C:\backend-endereco\postman\backend-endereco.postman_collection.json` documents all endpoints.

---

## Summary Table of Key File Locations

| Concern | File | Critical Lines |
|---|---|---|
| App entry & route mount | `src/server.js` | 8 (JSON body), 11–12 (route registration), 16–18 (ping) |
| DB pool | `src/config/database.js` | 4–9 (Pool config), 22 (query export) |
| Schema auto-creation | `src/config/init-db.js` | 4–32 (DDL), 34–43 (execution) |
| User registration | `src/controllers/userController.js` | 7–36 |
| Login & JWT issue | `src/controllers/userController.js` | 39–76, esp. 62–66 |
| Address CRUD | `src/controllers/addressController.js` | 7–34 (create), 37–58 (read+search), 61–100 (update+log), 103–130 (delete+log) |
| Audit logging | `src/controllers/addressController.js` | 90–93 (update log insert), 120–123 (delete log insert) |
| Share link generation | `src/controllers/addressController.js` | 133–166 |
| Public shared link access | `src/controllers/addressController.js` | 169–195 |
| JWT auth middleware | `src/middlewares/authMiddleware.js` | 4–36 |
| Route definitions | `src/routes/addressRoutes.js` | 8 (public route), 12 (auth barrier), 17–21 (protected routes) |
| Integration tests | `__tests__/integration.test.js` | 9–76 (full auth flow) |
</task_result>
</task>
```

---

## Assistant (Plan · Step 3.7 Flash · 45.0s)

_Thinking:_

Now I have comprehensive information from three parallel exploration tasks. Let me synthesize this into a detailed architectural analysis for the user in Portuguese (since the initial request was in

# Análise Completa do Repositório `backend-endereco`

## 1. Visão Geral do Projeto

Trata-se de uma **API RESTful monolítica** escrita em **Node.js (JavaScript, CommonJS)**, responsável por gerenciar endereços de usuários com autenticação JWT, acesso compartilhado temporário e logging passivo de auditoria.

---

## 2. Arquitetura & Padrões de Design

### Arquitetura: MVC Simplificado (Layered Monolith)

O projeto segue uma separação clara de responsabilidades, mas **não possui camada de Service nem Repository** — SQL é escrito diretamente nos controllers:

| Camada | Diretório | Responsabilidade |
|--------|-----------|-----------------|
| **Entrada (Entrypoint)** | `src/server.js` | Inicializa Express, registra rotas, health check |
| **Rotas (Routes)** | `src/routes/` | Define endpoints e aplica middlewares de rota |
| **Controladores (Controllers)** | `src/controllers/` | Orquestra requisições, executa SQL, formatam respostas |
| **Middleware de Auth** | `src/middlewares/` | Validação de JWT Bearer token |
| **Acesso a Dados (Config)** | `src/config/` | Pool PostgreSQL + script DDL de inicialização |

### Padrões de Design Identificados

1. **Middleware Pattern** (`authMiddleware.js`) — intercepta requisições protegidas, injeta `req.userId`
2. **Partial Updates via `COALESCE`** (`addressController.js:76-85`) — campos omitidos no `PUT` mantêm o valor anterior
3. **JSONB para Logs de Auditoria** — captura snapshot `previous_data` / `new_data` em cada mutação
4. **Route-level Middleware Ordering** (`addressRoutes.js:8 vs 12`) — rota pública (`/shared/:token`) é declarada **antes** do `authMiddleware`, permitindo acesso sem JWT
5. **Connection Pooling** (`database.js`) — usa `pg.Pool` em vez de conexões diretas

---

## 3. Lógica de Negócio & Entidades

### Entidades Core

```sql
-- src/config/init-db.js
users(addresses via FK)
  id | email (UNIQUE) | password (bcrypt hash) | created_at

addresses
  id | user_id (FK→users, ON DELETE CASCADE) | street, number, city, state, zip_code | created_at

logs
  id | user_id (FK→users, ON DELETE SET NULL) | action | entity_id | previous_data (JSONB) | new_data (JSONB) | created_at
```

### Fluxos de Negócio

| Fluxo | Arquivo | Linhas |
|--------|---------|--------|
| **Registro** (`POST /user`) | `userController.js` | 7–36 |
| **Login & Emissão de JWT** (`POST /login`) | `userController.js` | 39–76 (JWT emite em 62-66 com `expiresIn: '1d'`) |
| **CRUD de Endereços** | `addressController.js` | 7–130 |
| **Logging de Auditoria (UPDATE/DELETE)** | `addressController.js` | 90–93, 120–123 |
| **Geração de Link Compartilhado Temporário** | `addressController.js` | 150–154 (JWT com payload `{addressId}` + TTL customizável) |
| **Acesso Público via Token** | `addressController.js` | 169–195 |
| **Busca de Endereços** (`GET /addresses?search=`) | `addressController.js` | 37–58 (usa `ILIKE` em `street`, `city`, `state`) |

### Regras de Autorização

- Usuários autenticados podem **CRUD apenas seus próprios endereços** (`WHERE id = $1 AND user_id = $2`)
- **Shared links** (`GET /shared/:token`) bypassam completamente o `authMiddleware`, mas são apenas leitura e TTL-bound
- `GET /ping` é público (healthcheck)

---

## 4. Stack Técnica & Dependências

### Runtime & Framework

| Item | Versão | Função |
|------|--------|--------|
| Node.js | 22 (Alpine) | Runtime |
| Express | `^5.2.1` | Web framework / HTTP server |
| `pg` | `^8.22.0` | Driver PostgreSQL (node-postgres) — **sem ORM** |

### Segurança & Auth

| Item | Versão | Função |
|------|--------|--------|
| `bcrypt` | `^6.0.0` | Hashing de senha (genSalt + hash no registro, compare no login) |
| `jsonwebtoken` | `^9.0.3` | Emissão e verificação de JWTs (acesso usuário + share tokens) |

### Configuração & DevOps

| Item | Versão | Função |
|------|--------|--------|
| `dotenv` | `^17.4.2` | Carregamento de variáveis de ambiente |
| Docker / Compose | — | Orquestração: API (Node 22 Alpine) + PostgreSQL 15 |
| `nodemon` | `^3.1.14` | Hot-reload em desenvolvimento |

### Testes

| Item | Versão | Função |
|------|--------|--------|
| Jest | `^30.4.2` | Runner de testes (`--detectOpenHandles --forceExit`) |
| Supertest | `^7.2.2` | Testes de integração HTTP |

---

## 5. Decisões de Design Notáveis

✅ **Points positivos**
- Schema de banco criado automaticamente (`init-db.js` executado via `npm start`)
- Separação Router/Controller/Middleware bem definida
- Logging JSONB para rastreabilidade de mutações
- Rota pública separada por ordem de declaração (padrão idiomático Express)
- Testes de integração cobrem fluxo completo auth + CRUD

⚠️ **Pontos de Atenção**
- **Sem Service/Repository Layer** — SQL inline nos controllers dificulta refatorações e unit testing
- **Sem validação de input** (sem Zod/Joi) — validação é manual com `if (!field)`
- **`JWT_SECRET=123`** hardcoded em `.env` — placeholder inseguro
- **`.env` commitado no repositório** — má prática para segredos
- **Sem tratativa de erros padronizada** (sem error handler middleware centralizado)
- **Express 5.x** em versão major recente — pode ter breaking changes vs 4.x

---

## 6. Fluxo de Dados Típico

```
Cliente → POST /login
  → userController.loginUser
    → bcrypt.compare(senha, hash)
    → jwt.sign({id, email}, JWT_SECRET, {expiresIn: '1d'})
    → 200 + token

Cliente (autenticado) → POST /addresses
  → authMiddleware → valida JWT → req.userId
  → addressController.createAddress
    → INSERT INTO addresses (user_id, ...)
    → 201 + endereço criado
```

---

## 7. Deploy & Scripts

| Script | Função |
|--------|--------|
| `npm run dev` | `nodemon src/server.js` — desenvolvimento |
| `npm run start` | `init-db.js && npm test && server.js` — inicia banco, roda testes, sobe app |
| `npm test` | Jest com flags `--detectOpenHandles --forceExit` |
| `docker-compose up` | Sobe PostgreSQL 15 + API automaticamente |

---

## 8. Resumo Final

É um projeto **bem estruturado e minimalista** para um CRUD de endereços, implementado como monolito Node.js/Express com PostgreSQL, JWT stateless e logging auditável via JSONB. A arquitetura é funcional para o escopo, mas teria ganhos significativos com Service/Repository layers, validação formal e tratamento de erros centralizado.

---

