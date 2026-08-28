# Fluxo de Solicitações de Compra e Pagamento

Status: done — todos os 13 tickets em `.scratch/fluxo-compras-pagamentos/issues/` implementados.

## Problem Statement

Hoje a empresa não tem um processo formal e rastreável para solicitar, aprovar, executar e pagar compras internas. Pedidos de compra circulam de forma informal (conversa, e-mail avulso), sem um fluxo de aprovação consistente por valor, sem clareza de quem deve executar a compra, e sem visibilidade de quem já aprovou, quem comprou e quem pagou o quê. Isso gera retrabalho, atrasos, falta de controle sobre alçada de aprovação (quem pode autorizar valores maiores) e dificuldade de auditar o processo depois.

## Solution

Um app web interno onde qualquer funcionário pode abrir uma solicitação de compra, que passa por um fluxo de aprovação hierárquico (responsável do departamento e, se o valor exigir, o diretor), é encaminhada automaticamente para a pessoa certa comprar (com base no departamento e no tipo de compra), e termina com o Financeiro validando a nota fiscal e registrando o pagamento. Cada etapa notifica por e-mail as pessoas certas, e todo o histórico de status fica visível para consulta e exportação.

## User Stories

**Solicitante (qualquer funcionário)**

1. Como funcionário, quero criar uma solicitação de compra informando descrição, valor, departamento e tipo de compra, para formalizar um pedido de compra.
2. Como funcionário, quero salvar uma solicitação como rascunho antes de enviá-la, para revisar as informações antes de submeter para aprovação.
3. Como funcionário, quero ver a lista de "minhas solicitações" com o status atual de cada uma, para acompanhar o andamento dos meus pedidos.
4. Como funcionário, quero ser notificado por e-mail quando minha solicitação for aprovada, rejeitada, comprada ou paga, para acompanhar o processo sem checar o sistema manualmente.
5. Como funcionário, quero ver o motivo quando minha solicitação for rejeitada, para entender o que precisa ser ajustado.
6. Como funcionário, quero editar e reenviar uma solicitação rejeitada, para não precisar recriar o pedido do zero.
7. Como funcionário, quero ser notificado quando minha compra for confirmada pelo comprador, para saber que o processo está avançando.
8. Como funcionário, quero receber o comprovante de pagamento por e-mail quando minha solicitação for paga, para ter o registro da transação concluída.
9. Como funcionário que também é Responsável de Departamento, quero que minhas próprias solicitações pulem automaticamente minha etapa de aprovação, para não aprovar meu próprio pedido.
10. Como funcionário que também é Diretor, quero que minhas próprias solicitações pulem automaticamente a etapa de aprovação de diretor, pelo mesmo motivo.

**Responsável do Departamento**

11. Como responsável de departamento, quero ver a lista de solicitações pendentes da minha aprovação, para agir rapidamente.
12. Como responsável de departamento, quero aprovar uma solicitação, para que ela avance no fluxo (para o diretor, se exigido pela alçada, ou direto para aprovado).
13. Como responsável de departamento, quero rejeitar uma solicitação com um motivo, para comunicar ao solicitante o que precisa mudar.
14. Como responsável de departamento, quero ser notificado por e-mail quando uma nova solicitação do meu departamento precisar da minha aprovação, para não depender de checar o sistema manualmente.

**Diretor**

15. Como diretor, quero ver as solicitações pendentes da minha aprovação em todos os departamentos que superviso, para ter uma visão consolidada.
16. Como diretor, quero aprovar uma solicitação que já passou pelo responsável do departamento, para autorizar compras de maior valor.
17. Como diretor, quero rejeitar uma solicitação com um motivo, mesmo já tendo passado pelo nível 1.
18. Como diretor, quero ser notificado por e-mail apenas quando uma solicitação efetivamente exigir minha aprovação (baseado na alçada), para não ser notificado desnecessariamente.

**Comprador**

19. Como comprador designado, quero ser notificado quando uma solicitação me for atribuída para compra, para saber que preciso agir.
20. Como comprador, quero confirmar que a compra foi realizada, para que o solicitante seja informado.
21. Como comprador, quero anexar a nota fiscal/comprovante da compra, para formalizar a solicitação de pagamento.
22. Como comprador, quero enviar a solicitação de pagamento ao Financeiro, para que o pagamento seja processado.
23. Como comprador, quero ser notificado quando o Financeiro recusar minha solicitação de pagamento, com o motivo, para corrigir e reenviar.

**Financeiro (inclui papel de Admin)**

24. Como Financeiro, quero ver a lista de solicitações aguardando aprovação de pagamento, para processá-las.
25. Como Financeiro, quero recusar uma solicitação de pagamento com um motivo, para que o comprador corrija antes do pagamento.
26. Como Financeiro, quero aprovar e marcar uma solicitação como paga, anexando o comprovante, para concluir o fluxo.
27. Como Financeiro, quero designar manualmente um comprador quando não houver uma combinação departamento + tipo de compra cadastrada na matriz, para que o fluxo não trave.
28. Como Financeiro (admin), quero cadastrar departamentos e atribuir um responsável e um diretor a cada um, para configurar a estrutura de aprovação.
29. Como Financeiro (admin), quero cadastrar as faixas de alçada (valores que exigem aprovação de nível 2), para controlar quando o diretor precisa intervir.
30. Como Financeiro (admin), quero cadastrar tipos de compra, para categorizar as solicitações.
31. Como Financeiro (admin), quero cadastrar a matriz departamento × tipo de compra → comprador, para automatizar a designação do comprador.
32. Como Financeiro (admin), quero atribuir cada funcionário a um departamento, para que o sistema saiba quem é o aprovador de nível 1 de cada solicitante.
33. Como Financeiro, quero exportar as solicitações para CSV/Excel com filtros por período, departamento e status, para gerar relatórios fora do sistema.
34. Como Financeiro, quero ver o histórico simples de cada solicitação (quem aprovou, quem comprou, quem pagou e quando), para ter rastreabilidade básica sem precisar de um log de auditoria completo.

**Sistema / geral**

35. Como usuário, quero fazer login usando minha conta Microsoft (SSO/Azure AD), para não precisar de outra senha.
36. Como usuário em qualquer papel, quero ver uma lista "pendentes de mim" que agrega ações necessárias em qualquer papel que eu tenha (aprovador, comprador, Financeiro), para não perder ações pendentes.

## Implementation Decisions

- **Stack**: Next.js (App Router) + TypeScript; Postgres como banco de dados; ORM a definir na implementação (Prisma é a recomendação, por maturidade com Next.js e migrations).
- **Autenticação**: NextAuth.js com provider Azure AD (Microsoft Entra ID) para SSO. O organograma (departamentos, responsáveis, diretores) é cadastrado manualmente dentro do app — não é sincronizado automaticamente do Entra ID.
- **Modelo de dados (entidades principais)**:
  - `usuarios` (id, nome, email, id_entra, departamento_id nullable, flag_financeiro)
  - `departamentos` (id, nome, responsavel_id, diretor_id) — `diretor_id` é obrigatório na criação do departamento, não opcional
  - `faixas_alcada` (id, valor_min, valor_max, exige_nivel2)
  - `tipos_compra` (id, nome)
  - `matriz_comprador` (departamento_id, tipo_compra_id, comprador_id) — chave composta; nem toda combinação precisa existir
  - `solicitacoes` (id, solicitante_id, departamento_id, tipo_compra_id, descricao, valor, status, comprador_id nullable, nota_fiscal_url nullable, comprovante_pagamento_url nullable, motivo_rejeicao nullable, criado_em, atualizado_em)
  - `solicitacao_historico` (id, solicitacao_id, evento, ator_id, criado_em, detalhe) — histórico simples de status, não um log de auditoria completo
- **Máquina de estados** (`status` em `solicitacoes`): `rascunho` → `enviado` → (`aguardando_nivel2` se a alçada exigir) → `aprovado` → `compra_confirmada` → `aguardando_pagamento` → (`pagamento_recusado` volta para `compra_confirmada`, ou) `pago`. `rejeitado` é alcançável a partir de qualquer nível de aprovação e retorna para edição/reenvio pelo solicitante.
- **Camada de serviço (`workflow`)** — este é o seam de teste confirmado com o usuário: um módulo com uma função por transição de estado, cada uma validando a transição, persistindo a mudança, gravando um registro em `solicitacao_historico`, e disparando notificação:
  - `criarSolicitacao`, `enviarSolicitacao` (resolve a alçada e o primeiro aprovador aplicável), `aprovarNivel1`, `aprovarNivel2`, `rejeitar`, `reenviar`, `designarComprador` (consulta a matriz; fallback para Financeiro se não encontrado), `confirmarCompra`, `enviarParaPagamento` (exige nota fiscal já anexada), `recusarPagamento`, `registrarPagamento`.
- **Regra de autoaprovação**: resolvida dentro de `enviarSolicitacao`/`aprovarNivel1`/`aprovarNivel2` — se o solicitante é o próprio responsável do departamento (ou o próprio diretor), a etapa correspondente é pulada automaticamente.
- **Resolução de alçada**: ao enviar a solicitação, o `valor` é comparado contra `faixas_alcada` para decidir se, após a aprovação de nível 1, a solicitação precisa também do diretor (`aguardando_nivel2`) ou vai direto para `aprovado`.
- **Designação de comprador**: lookup em `matriz_comprador` por (`departamento_id`, `tipo_compra_id`) no momento em que a solicitação entra em `aprovado`. Sem correspondência → atribuída ao Financeiro para designação manual.
- **Notificações**: módulo de e-mail disparado em cada transição de estado relevante — implementadas inline em cada ticket relevante (não ganharam um ticket dedicado); ver as funções `notificar*`/`getEmailSender().send(...)` em `src/lib/workflow.ts` para a lista completa. Provedor: Microsoft Graph API, reaproveitando a mesma app registration do login (permissão de aplicativo `Mail.Send` — ver `SETUP.md`).
- **Anexos** (nota fiscal, comprovante de pagamento): armazenamento de arquivos a definir na implementação (ex: object storage compatível com S3).
- **Papéis e permissões**: não é um sistema de roles genérico — Financeiro é uma flag fixa em `usuarios`; Responsável e Diretor são derivados de `departamentos.responsavel_id`/`diretor_id`; Comprador é derivado de `solicitacoes.comprador_id`. Toda tela de administração (departamentos, alçada, tipos de compra, matriz) é restrita a usuários com a flag Financeiro — não existe um papel de admin separado.

## Testing Decisions

- **Seam confirmado com o usuário**: a camada de serviço `workflow` é testada diretamente via chamadas de função (não via HTTP/UI), contra um banco Postgres de teste real — sem mocks do banco. Cada teste roda isolado (transação ou schema por teste, revertido ao final).
- **O que é um bom teste**: testar apenas o comportamento externo da camada de serviço — dado um estado inicial de dados (usuários, departamentos, alçadas, matriz) e uma chamada de função do `workflow`, verificar o novo `status` da solicitação, os campos relevantes persistidos, e o registro criado em `solicitacao_historico`. Não testar detalhes internos de implementação (ex: não afirmar sobre queries SQL específicas).
- **Módulos a testar**: todas as funções do módulo `workflow`, uma suíte por transição, cobrindo os caminhos felizes e as regras de negócio específicas: autoaprovação (solicitante = responsável/diretor), resolução de alçada (com e sem nível 2), fallback de comprador quando a matriz não tem combinação cadastrada, recusa de pagamento, edição e reenvio após rejeição.
- **Notificações por e-mail**: testar que o disparo é chamado (via um "notifier" injetável/mockável na camada de serviço), não o conteúdo ou a entrega real do e-mail.
- **Prior art**: nenhum — projeto greenfield. Esta é a primeira suíte de testes do projeto e estabelece o padrão (banco de teste real, chamadas diretas à camada de serviço) para features futuras.

## Out of Scope

- Gestão de fornecedores e cotações comparativas.
- Integração com sistemas de contabilidade/ERP (disponível apenas exportação CSV/Excel).
- Execução real de pagamento via gateway bancário (PIX/boleto/API) — o app só registra o status do pagamento.
- Estado de "compra não realizada" após uma solicitação já aprovada (tratado por fora do sistema por enquanto).
- Hierarquia de aprovação com mais de 2 níveis (ex: sócio/CEO).
- Sincronização automática do organograma com o Microsoft Entra ID — cadastro é manual.
- Papel de administrador separado do Financeiro.
- Aprovação em paralelo entre nível 1 e nível 2 (o fluxo é sempre sequencial).

## Further Notes

- Hoje existem apenas 2 diretores na empresa, cada um supervisionando múltiplos departamentos — mas o schema não deve assumir esse número fixo; é só o estado atual dos dados.
- A lista inicial de tipos de compra ("Compras no Mercado Livre", "Compras no cartão de crédito", "Serviços e produtos por departamento") é um seed, não uma lista fechada — deve ser extensível via a tela de admin sem alterações de código.
- O label `ready-for-agent` acima segue o vocabulário canônico definido em `docs/agents/triage-labels.md` (labels padrão, sem customização).
- Os tickets em `.scratch/fluxo-compras-pagamentos/issues/01` a `13` cobrem, em conjunto, o mesmo escopo descrito nesta spec, numa granularidade mais próxima de implementação — todos concluídos (`status: done`); o escopo original previa até o ticket 15, mas consolidou em 13 durante a implementação (notificações, por exemplo, não ganharam ticket próprio — acabaram embutidas em cada ticket relevante).
