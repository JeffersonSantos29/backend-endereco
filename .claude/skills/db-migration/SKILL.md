---
name: db-migration
description: Fluxo padronizado para alterar o schema do banco deste projeto usando Prisma Migrate, substituindo o script ad-hoc src/config/init-db.js (CREATE TABLE IF NOT EXISTS sem versionamento, sem rollback, sem histórico de alterações).
---

# Migrations de banco de dados — backend-endereco

## Por que esta skill existe

`src/config/init-db.js` hoje só executa `CREATE TABLE IF NOT EXISTS` para `users`, `addresses`
e `logs`. Isso funciona para criar o schema do zero, mas não versiona alterações — não há como
alterar uma coluna existente em produção de forma rastreável, nem reverter uma mudança. A
convenção-alvo (`CLAUDE.local.md`) é usar **Prisma Migrate** para qualquer alteração de schema.

## Se o projeto ainda não tem Prisma configurado

Este é o primeiro passo antes de criar qualquer migration:

1. Adicionar `prisma` (dev dependency) e `@prisma/client` (dependency) ao projeto.
2. Rodar o init do Prisma, apontando o `datasource` para Postgres e usando a mesma variável
   `DATABASE_URL` (ou compor a partir de `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`
   já existentes no `.env`, para não quebrar a configuração atual).
3. Escrever no `schema.prisma` os três models atuais (`User`, `Address`, `Log`) espelhando as
   colunas hoje criadas por `init-db.js`, incluindo as foreign keys (`Address.userId` →
   `User.id` com `onDelete: Cascade`; `Log.userId` → `User.id` com `onDelete: SetNull`).
4. Gerar a migration inicial com `prisma migrate dev --name init` **apontando para um banco de
   teste ou de desenvolvimento vazio primeiro** — nunca rode a primeira migration direto contra
   um banco com dados reais sem revisar o SQL gerado.
5. Só depois de validar, aplicar em qualquer ambiente com dado real via `prisma migrate deploy`.
6. `src/config/init-db.js` pode ser removido assim que a migration inicial estiver validada.

## Fluxo normal para alterações de schema (depois de configurado)

1. Editar `schema.prisma` com a mudança desejada (nova coluna, nova tabela, alteração de tipo).
2. Rodar `prisma migrate dev --name <descricao-curta-da-mudanca>` em ambiente de
   desenvolvimento/teste — isso gera um arquivo SQL versionado em `prisma/migrations/`.
3. **Ler o SQL gerado** antes de commitar — principalmente para mudanças destrutivas (drop de
   coluna, alteração de tipo com perda de dado), que o Prisma às vezes pede confirmação manual.
4. Commitar a pasta de migration junto com a alteração de código que a usa.
5. Em produção/CI, aplicar com `prisma migrate deploy` (nunca `migrate dev` em produção — ele
   pode tentar resetar o banco se detectar drift).

## Regras

- Nunca editar uma migration já commitada/aplicada — crie uma nova migration para corrigir.
- Nunca alterar o schema do banco fora do fluxo de migration (sem `ALTER TABLE` manual em um
  cliente psql, por exemplo) — isso causa drift entre o histórico de migrations e o banco real.
- Toda migration destrutiva (drop de coluna/tabela) é revisada com atenção redobrada antes do
  `migrate deploy` — confirme que não há dado importante na coluna/tabela removida.
