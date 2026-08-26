# 11: Aprovação/recusa e registro de pagamento pelo Financeiro

**What to build:** o Financeiro consegue revisar a solicitação de pagamento, recusar quando algo está errado, ou aprovar e registrar o pagamento como feito — fechando o ciclo completo da solicitação.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] Financeiro vê uma lista de solicitações aguardando aprovação de pagamento
- [ ] Financeiro pode recusar com um motivo, devolvendo a solicitação ao comprador para corrigir
- [ ] Financeiro pode aprovar, o que registra o pagamento como feito e permite anexar o comprovante
- [ ] Solicitante recebe o comprovante de pagamento por e-mail quando o pagamento é registrado
- [ ] Não há integração com gateway bancário — o pagamento em si acontece fora do sistema; aqui é apenas registro de status
