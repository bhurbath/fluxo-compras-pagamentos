# 05: Criação e envio de solicitação de compra

**What to build:** qualquer funcionário consegue criar uma solicitação de compra e enviá-la para aprovação, e o sistema já resolve internamente qual caminho de aprovação ela vai seguir.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] Funcionário autenticado cria uma solicitação com descrição, valor, departamento (default: o seu próprio) e tipo de compra
- [ ] Solicitação pode ser salva como rascunho ou enviada diretamente
- [ ] Ao enviar, o sistema resolve a faixa de alçada aplicável ao valor e determina se a solicitação vai precisar também de aprovação de nível 2
- [ ] Se o solicitante é o próprio responsável do departamento, a etapa de aprovação de nível 1 é pulada automaticamente
- [ ] Solicitante recebe confirmação de que a solicitação foi enviada
