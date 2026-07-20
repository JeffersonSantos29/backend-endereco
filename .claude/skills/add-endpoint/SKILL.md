---
name: add-endpoint
description: Passo a passo para adicionar um novo endpoint/recurso CRUD a este projeto seguindo a arquitetura-alvo (schema → repository → service → controller → route → testes), em vez do padrão legado de SQL inline no controller.
---

# Adicionar um novo endpoint

Use este roteiro sempre que for adicionar um endpoint novo ou um novo recurso ao
`backend-endereco`. O objetivo é que **nenhum código novo** replique o padrão legado descrito
em `CLAUDE.local.md` (SQL cru em controller, validação manual, try/catch ad-hoc).

Se as camadas `services/`, `repositories/` e `schemas/` ainda não existirem no projeto quando
esta skill for executada, criá-las faz parte do primeiro uso desta skill — não é um bloqueio.

## Passos

1. **Schema de validação** (`src/schemas/<recurso>Schema.js`)
   - Defina um schema Zod para o payload de entrada do endpoint (body/query/params relevantes).
   - Se o endpoint aceitar algum campo que controla tempo de vida/expiração, imponha um teto
     máximo no próprio schema (não confie em validação manual depois).

2. **Repository** (`src/repositories/<recurso>Repository.js`)
   - Um método por operação de acesso a dado (`findById`, `create`, `updateById`, `deleteById`,
     `search`, etc.), usando Prisma Client — nunca `db.query` cru fora deste arquivo.
   - O repository não conhece `req`/`res` nem regra de negócio — só executa a operação e
     retorna dados.

3. **Service** (`src/services/<recurso>Service.js`)
   - Regra de negócio pura: verificação de ownership (`user_id`), montagem do registro de
     auditoria em `logs` quando aplicável, orquestração de múltiplas chamadas de repository.
   - Lança as classes de erro de `src/errors/` (`NotFoundError`, `ForbiddenError`, etc.) em vez
     de retornar `null`/`false` silenciosamente.
   - Sem `req`/`res` — recebe argumentos já validados (do schema) e o `userId` do chamador.

4. **Controller** (`src/controllers/<recurso>Controller.js`)
   - Só faz: `schema.parse(req.body)` → chama o service → formata `res.status(...).json(...)`.
   - Usa `try { ... } catch (err) { next(err); }` — nunca formata erro manualmente
     (isso é responsabilidade do middleware de erro central).

5. **Route** (`src/routes/<recurso>Routes.js`)
   - Registra o verbo+path, aplica `authMiddleware` se o endpoint exigir autenticação (siga o
     padrão de `src/routes/addressRoutes.js`, que registra rotas públicas antes do
     `router.use(authMiddleware)`).

6. **Testes**
   - Teste unitário do service com o repository mockado (cobre ownership check e regras de
     negócio sem precisar de banco real).
   - Teste de integração do endpoint via Supertest contra um banco de teste isolado — use a
     skill `safe-test-run` para garantir que não está rodando contra o banco de dev/prod.
   - Cubra o caminho feliz **e** os casos de erro (não encontrado, não autorizado, payload
     inválido).

7. **Revisão final**
   - Rode a skill `security-checklist` antes de considerar o endpoint pronto.
