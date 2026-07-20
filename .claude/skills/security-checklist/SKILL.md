---
name: security-checklist
description: Checklist de revisão de segurança específico do backend-endereco, para rodar antes de commit/push. Cobre segredos, JWT, ownership check, rate limiting e SQL — baseado em problemas reais já encontrados neste repositório (secrets vazados no histórico, JWT_SECRET fraco, tokens reais em fixtures).
---

# Checklist de segurança — backend-endereco

Rode este checklist antes de qualquer commit/push, e sempre ao final da skill `add-endpoint`.
Cada item existe por causa de um problema real já observado neste projeto — não é genérico.

## Segredos

- [ ] `.env` não está no `git status` como arquivo a ser commitado (verifique
      `git status` e confirme que `.env` aparece como ignorado, não como untracked/staged).
- [ ] O `.gitignore` na **raiz** do repositório (não só `src/.gitignore`) cobre `.env`,
      `.env.*` e `node_modules`.
- [ ] Nenhum `JWT_SECRET`, senha de banco ou API key está hardcoded em código, em manifests
      Kubernetes (`k8s/*.yaml`) ou em `docker-compose.yml` — devem vir de variável de
      ambiente/secret management.
- [ ] Nenhum token JWT real (de `/login` ou de `/addresses/:id/share`) foi colado em uma
      collection do Postman, num teste, ou em qualquer arquivo commitado. Se precisar de um
      token de exemplo em documentação, use um claramente fake/truncado.

## Autenticação e autorização

- [ ] Toda rota que lê/atualiza/remove um recurso pertencente a um usuário filtra a query por
      `user_id` (não apenas pelo `id` do recurso vindo da URL) — verifique isso em qualquer
      método de repository novo.
- [ ] Rotas públicas (como `/shared/:token`) estão registradas **antes** do
      `router.use(authMiddleware)`, e nenhuma lógica sensível vaza informação além do
      estritamente necessário na resposta pública.
- [ ] Qualquer campo de expiração/tempo de vida fornecido pelo cliente (ex: `expiresIn`) tem um
      teto máximo validado no schema — não é passado direto para `jwt.sign` sem limite.

## Rate limiting e superfície de ataque

- [ ] `/login` tem rate limiting (login é o alvo natural de brute force).
- [ ] Rotas públicas sem autenticação (`/shared/:token`) têm rate limiting.

## Banco de dados

- [ ] Nenhuma query SQL é montada por concatenação/template string com valor vindo de
      request — todo acesso a dado usa Prisma Client (ou, no código legado ainda não migrado,
      placeholders parametrizados `$1, $2...`, nunca interpolação direta).

## Antes de finalizar

- [ ] Rodar `git diff --stat` e revisar cada arquivo modificado/novo em busca de segredo
      colado por engano, mesmo que o item pareça não relacionado a segurança.
