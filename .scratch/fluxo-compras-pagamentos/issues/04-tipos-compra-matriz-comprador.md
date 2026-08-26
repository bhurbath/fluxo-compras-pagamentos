# 04: Cadastro de tipos de compra e matriz de comprador

**What to build:** o Financeiro consegue cadastrar os tipos de compra existentes e configurar, para cada combinação de departamento + tipo de compra, quem é o comprador responsável — a base que vai permitir a designação automática do comprador mais adiante no fluxo.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Tela de administração (Financeiro) com CRUD de tipos de compra, com seed inicial: "Compras no Mercado Livre", "Compras no cartão de crédito", "Serviços e produtos por departamento"
- [ ] Tela de administração com CRUD da matriz Departamento × Tipo de Compra → Comprador
- [ ] Qualquer funcionário cadastrado pode ser designado como comprador em uma entrada da matriz
- [ ] Nem toda combinação departamento + tipo de compra precisa ter uma entrada cadastrada
