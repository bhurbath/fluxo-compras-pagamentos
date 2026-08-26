# 08: Aprovação de nível 2 (Diretor)

**What to build:** quando o valor de uma solicitação exige um segundo nível de aprovação, o diretor do departamento consegue revisá-la e aprová-la ou rejeitá-la, depois que o responsável do departamento já aprovou.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Diretor vê uma lista consolidada de solicitações pendentes da sua aprovação, em todos os departamentos que supervisiona
- [ ] Ação de aprovar move a solicitação para aprovado; ação de rejeitar exige motivo e move para rejeitado
- [ ] Se o solicitante é o próprio diretor, esta etapa é pulada automaticamente
- [ ] Diretor é notificado por e-mail apenas quando uma solicitação efetivamente exige sua aprovação
- [ ] A aprovação de nível 2 só fica disponível depois que o nível 1 já aprovou (sequencial, nunca em paralelo)
