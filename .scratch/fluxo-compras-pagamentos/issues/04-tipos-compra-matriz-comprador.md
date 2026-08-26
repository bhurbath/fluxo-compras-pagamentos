# 04: Cadastro de tipos de compra e matriz de comprador

**What to build:** o Financeiro consegue cadastrar os tipos de compra existentes e configurar, para cada combinação de departamento + tipo de compra, quem é o comprador responsável — a base que vai permitir a designação automática do comprador mais adiante no fluxo.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Tela de administração (Financeiro) com CRUD de tipos de compra, com seed inicial: "Compras no Mercado Livre", "Compras no cartão de crédito", "Serviços e produtos por departamento"
- [x] Tela de administração com CRUD da matriz Departamento × Tipo de Compra → Comprador
- [x] Qualquer funcionário cadastrado pode ser designado como comprador em uma entrada da matriz
- [x] Nem toda combinação departamento + tipo de compra precisa ter uma entrada cadastrada

## Comments

- Seed dos 3 tipos de compra feito via `INSERT` direto na migration (não um script separado), aplicado automaticamente em dev e teste via `npm run db:migrate`/`db:migrate:test`.
- `matriz_comprador` usa `@@unique([departamentoId, tipoCompraId])` — cada combinação aponta pra no máximo um comprador. FKs de `departamentoId`/`tipoCompraId` são `ON DELETE RESTRICT`, então não dá pra excluir um tipo de compra ou departamento que já esteja em uso na matriz.
- Botão de exclusão generalizado (`src/app/admin/_components/excluir-button.tsx`), substituindo a versão específica de faixas de alçada do ticket 03 — agora reusado por tipos de compra, matriz e alçada.
- Com 4 formulários de admin repetindo o mesmo padrão de leitura/validação, extraído um helper compartilhado (`lerCampos`/`exigirTodos`) em `src/app/admin/actions.ts` — mantendo a mensagem de erro específica de cada formulário, só removendo a repetição mecânica de ler/trimar campos.
- Duas mensagens de erro específicas por entidade (em vez da genérica de `toFriendlyError`): a matriz avisa que já existe comprador pra aquela combinação (a genérica falava de "nome duplicado", que não existe nesse formulário); excluir um tipo de compra em uso avisa isso explicitamente (a genérica de FK dizia "não existe mais", contraditório quando o registro está bem ali na tela).
- Correção de uma regressão que eu mesmo causei nesse ticket: ao ampliar a mensagem genérica de erro de FK (`toFriendlyError`) pra cobrir o caso novo de exclusão bloqueada, deixei a mensagem mais vaga pro caso já existente (ex: criar departamento com responsável inválido). Revertido — cada caso agora tem sua mensagem certa no lugar certo.
