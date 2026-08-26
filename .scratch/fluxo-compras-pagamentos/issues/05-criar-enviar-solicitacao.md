# 05: Criação e envio de solicitação de compra

**What to build:** qualquer funcionário consegue criar uma solicitação de compra e enviá-la para aprovação, e o sistema já resolve internamente qual caminho de aprovação ela vai seguir.

**Blocked by:** 02, 03

**Status:** done

- [x] Funcionário autenticado cria uma solicitação com descrição, valor, departamento (default: o seu próprio) e tipo de compra
- [x] Solicitação pode ser salva como rascunho ou enviada diretamente
- [x] Ao enviar, o sistema resolve a faixa de alçada aplicável ao valor e determina se a solicitação vai precisar também de aprovação de nível 2
- [x] Se o solicitante é o próprio responsável do departamento, a etapa de aprovação de nível 1 é pulada automaticamente
- [x] Solicitante recebe confirmação de que a solicitação foi enviada

## Comments

**Escopo ampliado a meio da implementação.** A usuária trouxe o modelo real de solicitação de compra usado hoje na empresa, com bem mais campos do que o formulário simples original: Fornecedor, Forma de Pagamento, Centro de Custo, Centro de Resultado, Conta Contábil, Empresa, Link da Compra e Informações Complementares. Confirmado com ela que:
- Centro de Custo, Centro de Resultado, Conta Contábil e Empresa são listas fixas com cadastro próprio (não texto livre) — viraram 4 novas entidades administradas pelo Financeiro, seguindo exatamente o mesmo padrão de TipoCompra (ticket 04).
- Todos os campos novos são **adicionais** ao formulário original (descrição, valor, departamento, tipo de compra continuam), não substituição.

Isso multiplicou o escopo do ticket: além do fluxo criar/enviar em si, entraram 4 novas entidades "nome simples" completas (schema, service layer, 12 Server Actions, 12 páginas admin) e a extração de padrões compartilhados que já existiam de forma implícita entre elas e TipoCompra:
- `src/lib/nome-simples.ts` — validação e mensagem de "em uso" compartilhadas entre as 5 entidades desse tipo.
- `src/app/admin/_components/nome-simples-form.tsx` e `lista-nome-simples.tsx` — UI compartilhada.
- `criarAcoesNomeSimples()` em `src/app/admin/actions.ts` — fábrica que gera as 3 Server Actions (criar/atualizar/excluir) de cada uma das 5 entidades, em vez de repetir o mesmo bloco 5 vezes.
- `src/lib/require-usuario.ts` — `comUsuarioAutenticado()`, um wrapper paralelo ao `withFinanceiro()` existente, para ações que qualquer funcionário autenticado (não só Financeiro) pode disparar.
- `src/lib/form-helpers.ts` e `src/lib/decimal.ts` — extraídos durante a revisão de código (ver abaixo) para eliminar duplicação entre `src/app/admin/actions.ts`/`src/app/solicitacoes/actions.ts` e entre `src/lib/alcada.ts`/`src/lib/workflow.ts`.

**Revisão de código (8 ângulos) encontrou e corrigiu um gap real de comportamento:** o caminho normal de envio (`ENVIADO`, quando o solicitante não é o responsável do departamento — o caso mais comum) nunca chamava `resolverExigeNivel2`, então uma solicitação podia ser enviada com sucesso mesmo sem nenhuma faixa de alçada cadastrada para o valor, silenciosamente, contradizendo o próprio critério de aceite deste ticket ("ao enviar, o sistema resolve a faixa de alçada aplicável ao valor"). Só o caminho de auto-aprovação (quando o solicitante pula o nível 1) validava isso. Corrigido para validar em ambos os caminhos; adicionado teste cobrindo o caso que faltava.

Outros ajustes da revisão: `criarEEnviarAction` não deixa mais um rascunho órfão quando a criação funciona mas o envio falha (agora redireciona para a página da própria solicitação, não para o formulário em branco); `validarCriarSolicitacao` passou a validar também `departamentoId`/`tipoCompraId`/`solicitanteId`; `resolverExigeNivel2` trocou um `findMany` sem filtro por uma query com `where`; duplicações de `paraDecimal` (entre `alcada.ts` e `workflow.ts`) e do padrão `lerCampos`/`exigirTodos` (entre os dois arquivos de actions) foram extraídas para módulos compartilhados.

**Verificação manual:** guardas de autenticação confirmadas via browser (usuário não autenticado é bloqueado tanto em `/admin/centros-custo` quanto em `/solicitacoes/nova`). O fluxo completo autenticado de criar+enviar com os novos campos não foi testado manualmente em navegador logado nesta sessão — recomendo a usuária testar o formulário expandido (8 novos campos, incluindo os 4 novos dropdowns) em `/solicitacoes/nova` com sua própria conta antes de seguir para o ticket 06.
