# 01: Setup do projeto e infraestrutura base

**What to build:** o esqueleto do app funcionando de ponta a ponta: um usuário consegue abrir o app, fazer login com a conta Microsoft da empresa, e o sistema tem banco de dados e envio de e-mail prontos para as próximas fatias construírem em cima.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent (todos os critérios concluídos exceto deploy, adiado — ver Comments)

- [x] Projeto Next.js (App Router) + TypeScript rodando, conectado a um banco Postgres com ferramenta de migração configurada
- [x] Login via SSO Microsoft (Azure AD/Entra ID) funcionando de ponta a ponta (usuário autentica e obtém uma sessão válida)
- [x] Tabela `usuarios` criada e populada a partir do login (nome, e-mail, id do Entra ID)
- [x] Infraestrutura de envio de e-mail transacional configurada e testável (um e-mail de teste é enviado com sucesso) — via Microsoft Graph (Mail.Send), não Resend; ver Comments
- [ ] Deploy básico funcionando (ambiente acessível via URL) — adiado a pedido da usuária, para depois de mais tickets prontos

## Comments

Decisões tomadas durante a implementação, divergentes do texto original do ticket:

- **Banco**: Postgres gerenciado no Supabase, via connection pooler (transaction mode, `DATABASE_URL`, porta 6543) para o app em runtime, e sessão (`DIRECT_URL`, porta 5432) para migrations — a conexão direta (IPv6-only) não era alcançável no ambiente de dev. Banco de testes isola por schema (`test`) no mesmo projeto, não por projeto separado.
- **Prisma 7**: mudança de major não documentada no ticket original — `datasource.url` saiu do `schema.prisma` e foi para `prisma.config.ts`; o `PrismaClient` agora exige um driver adapter (`@prisma/adapter-pg`) em vez de uma URL simples.
- **E-mail**: trocado de Resend para Microsoft Graph (reaproveitando o mesmo app registrado no Entra ID para o login, com a permissão de aplicativo `Mail.Send`), a pedido da usuária — evita depender de um domínio verificado num serviço terceiro. Remetente: `ti@aromarketing.com.br`.
