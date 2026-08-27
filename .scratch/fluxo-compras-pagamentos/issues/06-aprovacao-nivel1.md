# 06: Aprovação de nível 1 (Responsável do Departamento)

**What to build:** o responsável do departamento consegue revisar, aprovar ou rejeitar as solicitações do seu departamento, com as notificações certas disparadas para cada lado.

**Blocked by:** 05

**Status:** done

- [x] Responsável do departamento vê uma lista de solicitações pendentes da sua aprovação
- [x] Ação de aprovar avança a solicitação (para o diretor, se a alçada exigir nível 2, ou direto para aprovado)
- [x] Ação de rejeitar exige um motivo e move a solicitação para o estado rejeitado
- [x] Solicitante é notificado por e-mail quando a solicitação é aprovada ou rejeitada (com o motivo, se rejeitada)
- [x] Responsável do departamento é notificado por e-mail quando uma nova solicitação aguarda sua aprovação

## Comments

`aprovarNivel1` e `rejeitar` foram adicionadas a `src/lib/workflow.ts`, junto com `listarPendentesNivel1`. A rota `/aprovacoes` lista as solicitações pendentes; a página de detalhe (`/solicitacoes/[id]`) ganhou os botões de Aprovar/Rejeitar quando o usuário logado é o responsável e a solicitação está em ENVIADO.

**Decisões de escopo:**
- `rejeitar` foi desenhada para funcionar tanto em ENVIADO (responsável) quanto em AGUARDANDO_NIVEL2 (diretor), mesmo esse ticket só expondo a ação via responsável — assim o ticket 08 (aprovação de nível 2) reaproveita a função sem reescrevê-la. O caminho de rejeição pelo diretor fica propositalmente inacessível pela UI por enquanto (não há tela de diretor ainda).
- A notificação ao solicitante só dispara quando a decisão de nível 1 é final (aprovado ou rejeitado) — não quando ela apenas avança para aguardando nível 2. Isso bate com a redação literal do ticket ("quando a solicitação é aprovada ou rejeitada"). O ticket 08 vai precisar notificar o diretor separadamente quando uma solicitação chega em AGUARDANDO_NIVEL2 (tanto pelo caminho de auto-skip no envio quanto pelo caminho real de aprovação de nível 1) — não implementado aqui, deliberadamente fora do escopo deste ticket.

**Revisão de código (8 ângulos) encontrou e corrigiu:**
- Uma condição de corrida real: `aprovarNivel1`/`rejeitar` liam o status e depois escreviam sem revalidar — duas ações concorrentes (ex: aprovar e rejeitar quase ao mesmo tempo) podiam ambas passar pela checagem antes de qualquer escrita acontecer. Corrigido com `updateMany` filtrando por `id` **e** `status`, rejeitando a ação se nenhuma linha bater.
- Um vazamento de permissão: ao ampliar a página de detalhe para o responsável também poder ver, o rascunho (RASCUNHO) não tinha sido excluído — o responsável conseguia ver uma solicitação que o solicitante ainda nem tinha enviado. Corrigido.
- Duplicação real de lógica: `aprovarNivel1` reimplementava a mesma decisão "vai para aprovado ou aguardando nível 2" que `resolverEstadoInicial` (ticket 05) já tinha. Extraído para `decidirStatusPosNivel1`, compartilhado pelos dois caminhos.
- Três testes novos verificavam conteúdo de e-mail (assunto/corpo), violando a decisão de teste já registrada na spec ("testar que o disparo é chamado, não o conteúdo"). Reescritos para verificar só que o e-mail foi disparado (e para quem).

Deixado como está, mas registrado: o status ainda é gravado antes do histórico/e-mail, sem transação — se o envio de e-mail falhar depois da gravação, a solicitação já mudou de status mas o usuário vê erro. Esse padrão já existia desde o ticket 05 em `enviarSolicitacao`; uma correção de verdade (transação cobrindo todo o módulo `workflow`) é uma decisão arquitetural maior do que cabe consertar de forma pontual num único ticket.

**Achado durante o teste manual (fora do diff original do ticket):** o Microsoft Entra estava reaproveitando silenciosamente a sessão já ativa no navegador ao clicar em "Entrar com Microsoft", em vez de perguntar qual conta usar — o que impedia testar com uma segunda conta sem usar aba anônima. Corrigido em `src/lib/auth.ts` adicionando `authorization: { params: { prompt: "select_account" } }` ao provider, forçando a Microsoft a sempre mostrar a tela de escolha de conta. Não é específico deste ticket, mas foi descoberto testando o fluxo de aprovação (que exige duas contas diferentes) e vale para qualquer login daqui pra frente.
