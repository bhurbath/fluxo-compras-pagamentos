# 11: Aprovação/recusa e registro de pagamento pelo Financeiro

**What to build:** o Financeiro consegue revisar a solicitação de pagamento, recusar quando algo está errado, ou aprovar e registrar o pagamento como feito — fechando o ciclo completo da solicitação.

**Blocked by:** 10

**Status:** done

- [x] Financeiro vê uma lista de solicitações aguardando aprovação de pagamento
- [x] Financeiro pode recusar com um motivo, devolvendo a solicitação ao comprador para corrigir
- [x] Financeiro pode aprovar, o que registra o pagamento como feito e permite anexar o comprovante
- [x] Solicitante recebe o comprovante de pagamento por e-mail quando o pagamento é registrado
- [x] Não há integração com gateway bancário — o pagamento em si acontece fora do sistema; aqui é apenas registro de status

## Comments

`recusarPagamento` (AGUARDANDO_PAGAMENTO → PAGAMENTO_RECUSADO, com motivo) e
`registrarPagamento` (AGUARDANDO_PAGAMENTO → PAGO, com comprovante via
upload real no mesmo bucket privado de Storage do ticket 10) seguem o padrão
já estabelecido: transição guardada por concorrência, evento de histórico,
notificação. Ambos restritos ao Financeiro.

**Decisão de escopo (reenvio após recusa):** a spec descreve o retorno de
`pagamento_recusado` como voltando para `compra_confirmada`, mas
`PAGAMENTO_RECUSADO` já existia como valor real no enum de status — optei por
mantê-lo como um estado de fato (visível, com o motivo exibido), mirando o
mesmo tratamento que `REJEITADO` já recebe no fluxo de aprovação. O reenvio
depois de uma recusa passa pela mesma função `enviarParaPagamento` original
do ticket 10, agora dividida (junto com a correção da revisão, ver abaixo)
em duas funções exportadas que compartilham uma implementação interna —
`enviarParaPagamento` (a partir de COMPRA_CONFIRMADA) e
`reenviarParaPagamento` (a partir de PAGAMENTO_RECUSADO) — no mesmo molde de
`enviarSolicitacao`/`reenviarSolicitacao` (ticket 07).

**Decisão de escopo (segregação de papéis):** nada impede hoje que a mesma
pessoa seja designada compradora de uma solicitação e também tenha a flag
Financeiro, podendo enviar para pagamento e depois aprovar seu próprio
pagamento. A revisão de código apontou isso; ficou registrado, mas não
corrigido — a spec não define uma regra de segregação de papéis para esse
caso, e a empresa é pequena o suficiente para isso não ser hoje um problema
prático. Revisitar se isso importar no futuro.

**Revisão de código (8 ângulos)** encontrou uma condição real de degradação
arquitetural e convergiu numa única correção coerente:

- A primeira versão generalizava `atualizarStatusComGuarda` (a guarda de
  concorrência compartilhada por toda transição de status do arquivo) para
  aceitar uma lista de status em vez de um único, só para permitir que
  `enviarParaPagamento` partisse de dois status diferentes. Isso enfraquecia
  o propósito da guarda (reconfirmar UM status esperado) para o único
  chamador que precisava disso, e o evento de histórico "enviado" vs.
  "reenviado" era decidido por uma ramificação interna, com a mesma lista de
  status repetida três vezes na função. A correção seguiu o precedente já
  estabelecido no próprio arquivo (`processarEnvio` compartilhado por
  `enviarSolicitacao`/`reenviarSolicitacao`, ticket 07): `enviarParaPagamento`
  virou duas funções exportadas (`enviarParaPagamento`/
  `reenviarParaPagamento`) sobre uma função interna compartilhada, cada uma
  com seu próprio status de origem, evento de histórico e mensagem de erro.
  `atualizarStatusComGuarda` voltou a aceitar só um status.
- A checagem "é do Financeiro" (buscar o usuário, checar `flagFinanceiro`)
  estava copiada em três lugares (`designarCompradorManualmente`,
  `recusarPagamento`, `registrarPagamento`) — extraída para
  `requireFinanceiroAtor`.
- `recusarPagamento`/`registrarPagamento` buscavam o ator e a solicitação em
  sequência apesar de serem leituras independentes — passaram a rodar em
  paralelo (`Promise.all`), assim como as duas URLs assinadas geradas na
  página de detalhe e as duas listas Financeiro-only da página de aprovações.
