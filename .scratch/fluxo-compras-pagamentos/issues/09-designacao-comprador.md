# 09: Designação automática do comprador

**What to build:** assim que uma solicitação é aprovada, o sistema já sabe automaticamente quem deve comprá-la, sem intervenção manual na maioria dos casos.

**Blocked by:** 04, 06

**Status:** ready-for-agent

- [ ] Ao entrar em aprovado, o sistema busca na matriz a combinação (departamento, tipo de compra) da solicitação e designa o comprador correspondente
- [ ] Se não houver correspondência cadastrada na matriz, a solicitação é atribuída ao Financeiro para designação manual
- [ ] O comprador designado (ou o Financeiro, no caso de fallback) é notificado por e-mail
