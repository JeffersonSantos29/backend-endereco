---
name: safe-test-run
description: Garante que os testes deste projeto rodem contra um banco de dados isolado de teste, nunca contra o banco de dev/produção apontado pelo .env principal — e que 'npm start' não volte a disparar a suíte de testes. Existe porque o package.json atual encadeia "npm start" → init-db → npm test → server, mutando dados reais a cada deploy.
---

# Rodar testes com segurança — backend-endereco

## O problema que esta skill evita

Hoje `package.json` define:

```json
"start": "node src/config/init-db.js && npm test && node src/server.js"
```

Isso roda a suíte de testes de integração (`__tests__/integration.test.js`) contra o banco
apontado pelo `.env` ativo — que, sem uma configuração separada, é o mesmo banco de
desenvolvimento/produção. Todo `npm start` (inclusive via `Dockerfile`/`docker-compose`/k8s)
insere e remove dados reais, e uma falha de teste impede o servidor de subir.

## Como rodar testes com segurança hoje (sem precisar refatorar tudo ainda)

1. Use um banco Postgres **separado** para teste (nome sugerido: `address_db_test`), com suas
   próprias credenciais/host se possível.
2. Antes de rodar `npm test`, exporte variáveis de ambiente de teste em vez de depender do
   `.env` principal — por exemplo, um `.env.test` carregado explicitamente, ou variáveis de
   ambiente passadas na linha de comando, apontando `DB_NAME` (e `DB_HOST` se for um banco
   diferente) para o banco de teste.
3. Rode `node src/config/init-db.js` contra esse banco de teste antes da primeira execução
   (ele só cria tabelas se não existirem — seguro rodar mais de uma vez).
4. Rode `npm test` isoladamente — **nunca** via `npm start`.

## O que corrigir estruturalmente (alinhado a CLAUDE.local.md)

- Remova `npm test` do script `start`. `start` deve apenas rodar `node src/server.js`
  (a criação/migração de schema vira uma migration explícita via Prisma — veja a skill
  `db-migration` — não algo acoplado ao boot do processo).
- Testes de integração devem rodar em CI contra um banco de teste efêmero (ex: serviço Postgres
  do próprio pipeline), não contra qualquer banco persistente compartilhado.
- Cada teste que grava dado deve limpar via transação com rollback (ou truncar tabelas em
  `beforeEach`/`afterEach`), não `DELETE FROM ... WHERE email = '...'` manual no `afterAll`
  (isso deixa registros órfãos em `logs`, cuja FK é `ON DELETE SET NULL`).

## Checklist rápido antes de rodar `npm test`

- [ ] `DB_NAME` (e demais variáveis de conexão) apontam para um banco de teste, não para o
      banco de `.env` de desenvolvimento/produção.
- [ ] O banco de teste já tem as tabelas criadas (`init-db.js` ou migration aplicada).
- [ ] Você está rodando `npm test` diretamente — não `npm start`.
