# 12: Painel de solicitações e histórico de status

**What to build:** qualquer usuário consegue ver, num só lugar, suas próprias solicitações, o que está pendente da sua ação (em qualquer papel), e o histórico completo de cada solicitação.

**Blocked by:** 11

**Status:** done

- [x] Listagem "Minhas solicitações" (criadas pelo usuário logado) com o status atual de cada uma
- [x] Listagem "Pendentes de mim", agregando ações pendentes do usuário logado em qualquer papel que ele tenha (aprovador de nível 1 ou 2, comprador, Financeiro)
- [x] Linha do tempo por solicitação mostrando quem aprovou, quem comprou e quem pagou, e quando cada evento ocorreu

## Comments

Nova página `/solicitacoes` ("Minhas solicitações", via `listarMinhasSolicitacoes`
— inclui rascunhos, já que só o próprio dono pode vê-los mesmo). `/aprovacoes`
virou "Pendentes de mim": ganhou uma seção "Compras" (via nova
`listarPendentesComprador`, que agrega os três status em que o comprador tem
uma ação pendente — APROVADO, COMPRA_CONFIRMADA, PAGAMENTO_RECUSADO — numa
mesma lista, distinguidos pela coluna Situação). A página de detalhe ganhou
uma linha do tempo (`LinhaDoTempo`) a partir do `historico` já existente em
`SolicitacaoHistorico`, agora incluído por `obterSolicitacao`.

**Revisão de código (8 ângulos)** encontrou duas coisas reais, corrigidas:

- A nova página "Minhas solicitações" tinha uma tabela construída do zero,
  quase idêntica à `TabelaPendentes` de `/aprovacoes` (mesmas colunas,
  mesmo texto de link, mesmas classes). Extraída para um componente
  compartilhado (`TabelaSolicitacoes`, em `src/app/_components/`, pasta já
  usada para componentes cross-rota) — parametrizado por `mostrarSolicitante`
  (a lista de solicitações não precisa mostrar o dono, que é sempre quem
  está vendo a página) e `linkTexto`. A coluna "Situação" — que a primeira
  versão só mostrava condicionalmente via uma prop `mostrarStatus`, só para
  a seção "Compras" — passou a aparecer sempre, em todas as seções,
  simplificando o componente.
- `formatarDataHora` (nova, em `src/lib/format.ts`) formatava sem fuso
  horário explícito — como a página de detalhe é um Server Component, isso
  renderizaria no fuso do processo Node (UTC em produção), não no horário
  de Brasília. Corrigido com `timeZone: "America/Sao_Paulo"`.

Registrado mas não alterado: `listarPendentesComprador` agrega três status
distintos (cada um com uma próxima ação diferente — confirmar compra, enviar
para pagamento, corrigir e reenviar) numa única lista, diferente de toda
outra função `listarPendentes*` do arquivo, que sempre mira um único status.
A coluna Situação diferencia as linhas o suficiente para um tracer bullet;
separar em três seções (como nível 1/nível 2 são hoje) é uma melhoria de UX
válida para revisitar se o volume de compras pendentes crescer.
