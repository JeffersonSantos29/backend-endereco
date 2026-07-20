---
name: adopt-orm
description: Guia de migração incremental das queries SQL cruas (via pg, db.query) espalhadas nos controllers deste projeto para Prisma Client dentro de uma camada de repositório — um recurso por vez (users, addresses, logs), sem quebrar o restante do código durante a transição.
---

# Migrar de SQL cru para ORM (Prisma) — backend-endereco

## Por que esta skill existe

Hoje `src/controllers/addressController.js` e `src/controllers/userController.js` chamam
`db.query(...)` (de `src/config/database.js`, um wrapper fino sobre `pg.Pool`) diretamente,
com SQL parametrizado escrito à mão em cada função. As queries já usam placeholders (`$1, $2`)
corretamente — não há injeção de SQL hoje — mas o acesso a dado está espalhado pelos
controllers em vez de centralizado, o que dificulta reuso, teste unitário e evolução de schema.
A convenção-alvo é: **todo acesso a dado passa por Prisma Client, dentro de `repositories/`**.

Pré-requisito: Prisma já configurado no projeto com o `schema.prisma` espelhando as tabelas
atuais (`User`, `Address`, `Log`) — veja a skill `db-migration` se isso ainda não existe.

## Estratégia: migrar um recurso por vez

Não reescreva tudo de uma vez. Ordem sugerida (do mais simples ao mais acoplado):

### 1. `users` (mais isolado)

- Crie `src/repositories/userRepository.js` com métodos equivalentes às queries hoje em
  `src/controllers/userController.js`: `findByEmail(email)`, `create({ email, hashedPassword })`.
- Migre `registerUser`/`loginUser` para chamar o repository em vez de `db.query` diretamente
  (idealmente via uma camada de service, se já estiver seguindo a skill `add-endpoint`).
- Rode os testes existentes (`__tests__/integration.test.js`) para confirmar que registro/login
  continuam funcionando de ponta a ponta.

### 2. `addresses` (mais operações: create/list/update/delete/share)

- Crie `src/repositories/addressRepository.js` com um método por operação hoje presente em
  `src/controllers/addressController.js`: `create`, `findByUserId` (com suporte a `search` via
  `contains`/`mode: 'insensitive'` do Prisma, equivalente ao `ILIKE` atual), `findByIdAndUserId`
  (usado tanto por `updateAddress` quanto `deleteAddress` para o ownership check), `updateById`,
  `deleteById`, `findByIdPublic` (usado por `getSharedAddress`, sem filtro de `user_id`).
- Atenção ao `updateAddress` atual: ele usa `COALESCE($n, coluna)` no SQL para permitir update
  parcial. No Prisma, o equivalente é montar o objeto de `data` só com os campos definidos
  (`undefined` no Prisma Client já significa "não atualizar este campo" — não precisa de
  `COALESCE` manual).
- Migre os controllers para chamar o repository, mantendo o comportamento de auditoria
  (inserir em `logs`) intacto.

### 3. `logs` (usado pelo audit trail de `addresses`)

- Crie `src/repositories/logRepository.js` com `create({ userId, action, entityId,
  previousData, newData })`.
- Chame este repository a partir do service/repository de `addresses` no momento de
  update/delete, em vez de um segundo `db.query` inline na mesma função do controller.

### 4. Remover o acesso direto a `pg`

- Só depois que os três recursos estiverem migrados: remover `src/config/database.js`
  (o wrapper de `pg.Pool`) e a dependência `pg` do `package.json`, já que o Prisma Client passa
  a ser o único cliente de banco do projeto.

## Regras durante a transição

- Nunca deixe um controller chamando `db.query` **e** um repository Prisma para o mesmo
  recurso ao mesmo tempo — migre o recurso inteiro (todas as operações) antes de considerá-lo
  concluído, para não ter duas fontes de verdade sobre como acessar a mesma tabela.
- Rode a suíte de testes (`safe-test-run`) depois de migrar cada recurso, não só no final.
- Mantenha o comportamento observável idêntico (mesmos status codes, mesmas mensagens de erro)
  durante a migração — trocar a implementação de acesso a dado não deve mudar contrato de API.
