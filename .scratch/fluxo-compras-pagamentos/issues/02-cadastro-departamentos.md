# 02: Cadastro de departamentos, responsáveis e diretores

**What to build:** o Financeiro consegue configurar a estrutura organizacional que todo o resto do fluxo de aprovação depende — departamentos, seus responsáveis (nível 1), seus diretores (nível 2), e a quais departamentos cada funcionário pertence.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Tela de administração restrita a usuários com a flag Financeiro
- [ ] CRUD de departamentos (criar, editar, listar)
- [ ] Um departamento não pode ser salvo sem um responsável (nível 1) e um diretor (nível 2) definidos — cadastro de diretor é obrigatório desde a criação, não opcional
- [ ] Um mesmo diretor pode ser associado a múltiplos departamentos
- [ ] Cada funcionário pode ser atribuído a um departamento
