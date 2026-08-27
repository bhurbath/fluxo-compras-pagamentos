# 10: Confirmação de compra e envio de solicitação de pagamento

**What to build:** o comprador consegue registrar que a compra foi feita, anexar a nota fiscal, e encaminhar a solicitação de pagamento ao Financeiro.

**Blocked by:** 09

**Status:** done

- [x] Comprador confirma que a compra foi realizada; solicitante é notificado por e-mail
- [x] Comprador anexa a nota fiscal/comprovante da compra (obrigatório para prosseguir)
- [x] Comprador envia a solicitação de pagamento ao Financeiro; solicitante fica ciente/notificado, sem precisar agir

## Comments

`confirmarCompra` (APROVADO → COMPRA_CONFIRMADA) e `enviarParaPagamento`
(COMPRA_CONFIRMADA → AGUARDANDO_PAGAMENTO) seguem o padrão já estabelecido:
uma função por transição, guardada por `atualizarStatusComGuarda`, com seu
próprio evento de histórico e notificação. Ambas exigem `atorId === compradorId`.

**Decisão de escopo (anexos):** a spec deixa o mecanismo de armazenamento de
arquivos "a definir na implementação". Como não existe nenhuma infraestrutura
de object storage no projeto, a nota fiscal/comprovante foi implementada como
um campo de link (URL), no mesmo padrão já usado por `linkCompra` — sem isso,
o ticket exigiria construir upload de arquivos do zero, fora do escopo de um
tracer bullet.

**Decisão de escopo (dados de pagamento):** a pedido do usuário durante a
implementação, `enviarParaPagamento` também passou a exigir e gravar método
de pagamento (PIX/TED/Boleto/Cartão de crédito/Dinheiro, novo enum
`MetodoPagamento` — deliberadamente distinto do `FormaPagamento` já existente,
que são as condições comerciais escolhidas na criação da solicitação), dados
de pagamento (texto livre: chave PIX ou dados bancários) e o CNPJ/CPF do
fornecedor. Os três ficam persistidos atomicamente junto com a transição de
status. O CNPJ/CPF é validado apenas como campo obrigatório, sem checar
dígitos/formato — Financeiro confere manualmente antes de pagar; validação de
formato ficou fora de escopo.

**Revisão de código (8 ângulos)** encontrou uma condição de corrida real e
convergiu, a partir de quatro ângulos independentes, numa mesma correção:

- A primeira versão anexava a nota fiscal (`anexarNotaFiscal`) e enviava para
  pagamento (`enviarParaPagamento`) como duas funções separadas, sempre
  chamadas em sequência pela mesma ação. A escrita da nota fiscal não tinha
  guarda de concorrência (diferente de toda outra mutação do arquivo),
  permitindo que uma submissão duplicada sobrescrevesse silenciosamente a
  nota fiscal de uma solicitação que outra requisição já tinha movido para
  AGUARDANDO_PAGAMENTO. As duas funções foram unificadas numa só chamada
  atômica — elimina a condição de corrida, o estado parcial possível (nota
  fiscal anexada sem envio confirmado) e viagens redundantes ao banco, além
  de bater com a contagem de funções da spec (`confirmarCompra`,
  `enviarParaPagamento`).
- `notaFiscalUrl` passou a exigir um link http(s) — antes aceitava qualquer
  string não vazia (incluindo esquemas como `javascript:`) e era renderizado
  como link clicável para solicitante/responsável/diretor/Financeiro.
  (`linkCompra`, de ticket anterior, tem a mesma lacuna e não foi tocado —
  fora do escopo deste ticket.)
- E-mail do solicitante e broadcast ao Financeiro agora disparam em paralelo
  (`Promise.all`) em vez de sequencialmente.
- `METODO_PAGAMENTO_LEGIVEL` foi extraído para um módulo compartilhado — antes
  duplicado, byte a byte, entre o formulário e a visualização.
- A ação de envio para pagamento passou a usar `lerCampos`/`exigirTodos`,
  como toda outra ação de formulário do arquivo, em vez de ler `FormData`
  manualmente.
