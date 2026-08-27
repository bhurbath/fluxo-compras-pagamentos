# 09: Designação automática do comprador

**What to build:** assim que uma solicitação é aprovada, o sistema já sabe automaticamente quem deve comprá-la, sem intervenção manual na maioria dos casos.

**Blocked by:** 04, 06

**Status:** done

- [x] Ao entrar em aprovado, o sistema busca na matriz a combinação (departamento, tipo de compra) da solicitação e designa o comprador correspondente
- [x] Se não houver correspondência cadastrada na matriz, a solicitação é atribuída ao Financeiro para designação manual
- [x] O comprador designado (ou o Financeiro, no caso de fallback) é notificado por e-mail

## Comments

`designarComprador` (interna, não exportada) roda automaticamente sempre que uma solicitação chega em APROVADO — chamada nos três pontos onde isso acontece: `processarEnvio` (auto-skip no envio), `aprovarNivel1` e `aprovarNivel2`. Busca na `matriz_comprador` por (departamento, tipo de compra); com correspondência, designa e notifica o comprador; sem correspondência, notifica todo mundo com a flag Financeiro (não é uma pessoa só) e deixa `compradorId` nulo.

**Decisão de escopo:** o checklist do ticket fala em "atribuída ao Financeiro para designação manual", mas não lista explicitamente uma forma do Financeiro *agir* nisso — sem isso, o fallback seria um beco sem saída. Como a spec (user story 27) já descreve essa capacidade como do Financeiro, implementei `designarCompradorManualmente` (com sua própria autorização, proteção contra concorrência e notificação) mais a UI correspondente (`/aprovacoes` ganhou uma terceira seção só para Financeiro; a página da solicitação ganhou uma seção "Designar comprador" quando aplicável) — não é scope creep, é completar o que o próprio ticket pede.

**Revisão de código (8 ângulos)** encontrou uma condição de corrida real e algumas inconsistências, todas corrigidas:
- A designação automática (via matriz) não tinha proteção contra concorrência, diferente da manual — em teoria, uma designação manual do Financeiro podia ser silenciosamente sobrescrita pela automática logo em seguida. Corrigido com o mesmo padrão de `where` guardado por `compradorId: null`.
- A ação de designação manual usava o wrapper genérico de autenticação em vez de `withFinanceiro`, diferente de toda outra ação restrita ao Financeiro no projeto. Corrigido.
- Extraído `notificarTodosFinanceiros`, seguindo o padrão já estabelecido no arquivo (uma função nomeada por formato de notificação).
- Limpezas menores: removida uma refetch desnecessária, guarda de concorrência da designação manual passou a reconfirmar também o status, e três testes com a mesma configuração de matriz foram consolidados num helper compartilhado.

Registrado mas não corrigido: o status ainda é gravado antes da designação de comprador rodar, sem transação — mesma classe de tradeoff já aceita e documentada no ticket 06 para o módulo `workflow` inteiro. Uma correção de verdade (transação cobrindo todo o módulo) é uma decisão arquitetural maior do que cabe consertar de forma pontual num único ticket; na prática o impacto é mitigado, já que a designação manual do Financeiro sempre pode completar o que a automática não conseguiu.
