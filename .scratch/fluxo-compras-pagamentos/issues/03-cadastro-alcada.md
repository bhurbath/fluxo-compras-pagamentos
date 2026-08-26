# 03: Cadastro de faixas de alçada

**What to build:** o Financeiro consegue configurar as faixas de valor que decidem se uma solicitação precisa só da aprovação do responsável do departamento, ou também da aprovação do diretor.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Tela de administração (Financeiro) com CRUD de faixas de alçada (valor mínimo, valor máximo, se exige aprovação de nível 2)
- [x] As faixas valem para a empresa toda, não são configuráveis por departamento
- [x] A modelagem suporta no máximo 2 níveis de aprovação (não há campo para um terceiro nível)

## Comments

- Validação de faixa usa `Prisma.Decimal` diretamente (mesmo parser que persiste no banco), não `Number()` — evita que um valor "válido" na validação (ex: notação hexadecimal, científica) seja rejeitado ou interpretado diferente na hora de salvar. Também rejeita valores acima do que a coluna `Decimal(12,2)` suporta.
- Adicionada validação de sobreposição entre faixas: duas faixas não podem cobrir o mesmo valor. Convenção: `valorMin` e `valorMax` são ambos inclusivos, então a próxima faixa deve começar em `valorMax anterior + 0.01`.
- Exclusão de faixa agora pede confirmação e mostra estado "Excluindo…" — é a primeira ação destrutiva do painel de admin, sem confirmação isso é uma tecla de atalho pra perder dado sem querer.
- **Achado maior, cross-cutting**: nenhuma tela de admin (nem as do ticket 02) exibia as mensagens de erro amigáveis — o Next.js redige mensagens de erro de Server Actions em produção por padrão, então elas nunca chegavam ao usuário (mostraria uma tela de erro genérica). Corrigido em `src/app/admin/actions.ts` para TODAS as ações (departamentos e alçada): em vez de `throw`, redirecionam de volta pra página com `?erro=mensagem`, que cada página agora lê e exibe. Também adicionado `src/app/admin/error.tsx` como rede de segurança pra erros realmente inesperados.
- `formatarReais` movido de `alcada/page.tsx` para `src/lib/format.ts`, compartilhável quando futuras telas precisarem formatar valores em reais (ex: valores de solicitação).
