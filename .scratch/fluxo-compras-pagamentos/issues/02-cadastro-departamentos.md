# 02: Cadastro de departamentos, responsáveis e diretores

**What to build:** o Financeiro consegue configurar a estrutura organizacional que todo o resto do fluxo de aprovação depende — departamentos, seus responsáveis (nível 1), seus diretores (nível 2), e a quais departamentos cada funcionário pertence.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Tela de administração restrita a usuários com a flag Financeiro
- [x] CRUD de departamentos (criar, editar, listar)
- [x] Um departamento não pode ser salvo sem um responsável (nível 1) e um diretor (nível 2) definidos — cadastro de diretor é obrigatório desde a criação, não opcional
- [x] Um mesmo diretor pode ser associado a múltiplos departamentos
- [x] Cada funcionário pode ser atribuído a um departamento

## Comments

- Não existe UI para conceder a flag Financeiro (nada poderia conceder a primeira) — criado `scripts/set-financeiro.ts` (`npx tsx scripts/set-financeiro.ts <email>`) para bootstrap manual via CLI, fora do escopo de UI do ticket.
- Descoberto durante a implementação: os testes de serviço (`departamentos.ts`) usam o mesmo `db` de produção, não um cliente separado — então `tests/setup.ts` agora redireciona `DATABASE_URL`/`DATABASE_SCHEMA` para o banco de teste antes de qualquer teste rodar (e valida que o redirecionamento funcionou, com `SELECT current_schema()`), em vez de manter um `testDb` paralelo. Isso também simplificou `tests/helpers/db.ts`.
- `src/lib/db.ts` mudou de um singleton `db` construído no import do módulo para uma função `getDb()` com construção preguiçosa — o singleton antigo quebrava scripts que importavam qualquer coisa de `db.ts` antes de carregar suas próprias variáveis de ambiente (o import roda antes de qualquer outro código do módulo importador).
- Code review encontrou um vazamento real de dados: o guard de acesso só rodava no `layout.tsx`, mas um layout que troca `{children}` não impede o componente de página de baixo de ser executado (nem de aparecer no payload RSC) — cada página de admin agora chama o guard antes de buscar qualquer dado, não só o layout.
- Adicionada validação: responsável e diretor não podem ser a mesma pessoa (colapsaria os dois níveis de aprovação). Erros de banco (nome duplicado, IDs inválidos) agora viram mensagens amigáveis em vez de crash.
- Dois bugs reais encontrados via teste manual (não pelo code review automatizado): (1) o `<select>` de departamento em `funcionarios/page.tsx` não atualizava visualmente após salvar — `defaultValue` em input não controlado só aplica na montagem; corrigido com `key` derivada do valor atual, forçando remontagem. (2) Depois de adicionar `tests/admin-guard.test.ts`, a suíte ficou instável — arquivos de teste rodam em paralelo por padrão no Vitest, e todos compartilham o mesmo schema `test` real (sem mock), então o `TRUNCATE` de um arquivo corria contra as asserções de outro; corrigido com `fileParallelism: false` no `vitest.config.mts`.
