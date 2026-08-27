# 07: Edição e reenvio de solicitação rejeitada

**What to build:** o solicitante consegue corrigir e reenviar uma solicitação que foi rejeitada, sem precisar criar um pedido novo do zero.

**Blocked by:** 06

**Status:** done

- [x] Solicitante pode editar uma solicitação em estado rejeitado (descrição, valor, departamento, tipo de compra)
- [x] Reenvio reinicia o fluxo de aprovação a partir do nível 1
- [x] O motivo da rejeição anterior permanece visível no histórico da solicitação após o reenvio

## Comments

`editarSolicitacao` e `reenviarSolicitacao` foram adicionadas a `src/lib/workflow.ts`. A página `/solicitacoes/[id]` ganhou uma seção "Editar e reenviar" (formulário completo, os mesmos campos de `/solicitacoes/nova`) quando o usuário logado é o solicitante e a solicitação está REJEITADO. Extraído `CamposSolicitacao` (componente compartilhado dos campos do formulário) e `listarListasSolicitacao()` (helper compartilhado das 6 listas de dropdown), usados tanto por `/solicitacoes/nova` quanto pela nova seção de edição — evita repetir ~150 linhas de JSX e a mesma consulta às 6 listas em dois lugares.

**Decisão de escopo:** o formulário de edição inclui todos os 12 campos do modelo atual (incluindo os do ticket 05: fornecedor, forma de pagamento, centro de custo, etc.), não só os 4 originais do ticket ("descrição, valor, departamento, tipo de compra") — mesma lógica da ampliação do ticket 05: o solicitante precisa poder corrigir qualquer campo que tenha motivado a rejeição, não só um subconjunto.

**Revisão de código (8 ângulos) encontrou e corrigiu um desvio real da spec, além de bugs:**
- A spec (`Implementation Decisions`) lista `reenviar` como sua própria função de transição, junto de `enviarSolicitacao`, `aprovarNivel1`, `rejeitar` etc. — o desenho "uma função por transição de estado". Eu tinha implementado o reenvio ampliando `enviarSolicitacao` para aceitar REJEITADO como status de origem, o que não só desviava da spec como deixava o reenvio indistinguível de um envio original no histórico (os dois gravavam o mesmo evento `"enviado"`). Corrigido: extraída uma função interna compartilhada `processarEnvio`, com `enviarSolicitacao` (RASCUNHO) e `reenviarSolicitacao` (REJEITADO) como funções públicas próprias, cada uma com sua mensagem de erro e evento de histórico (`"enviado"` vs `"reenviado"`).
- Um bug real: `editarSolicitacao` limpava `motivoRejeicao` imediatamente, antes do reenvio ser sequer tentado. Se a edição fosse salva mas o reenvio falhasse depois (ex: valor editado caiu fora de qualquer faixa de alçada cadastrada), a solicitação ficava REJEITADO com o motivo já apagado — a única explicação visível na tela do porquê ela precisava de correção sumia. Corrigido: `motivoRejeicao` só é limpo dentro de `processarEnvio`, atomicamente junto com a transição de status, nunca antes dela de fato acontecer. Teste de regressão adicionado cobrindo esse cenário.
- Nenhuma proteção contra ações concorrentes em `editarSolicitacao` (diferente de `aprovarNivel1`/`rejeitar`, que já usam `updateMany` com `status` no `where`). Corrigido com o mesmo padrão.
- Duplicação real: o mapeamento de campos de `editarSolicitacao` repetia os mesmos 12 campos de `criarSolicitacao`. Extraído `mapCamposSolicitacao`, compartilhado pelos dois.
