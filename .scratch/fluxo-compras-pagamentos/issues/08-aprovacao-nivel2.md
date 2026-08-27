# 08: Aprovação de nível 2 (Diretor)

**What to build:** quando o valor de uma solicitação exige um segundo nível de aprovação, o diretor do departamento consegue revisá-la e aprová-la ou rejeitá-la, depois que o responsável do departamento já aprovou.

**Blocked by:** 06

**Status:** done

- [x] Diretor vê uma lista consolidada de solicitações pendentes da sua aprovação, em todos os departamentos que supervisiona
- [x] Ação de aprovar move a solicitação para aprovado; ação de rejeitar exige motivo e move para rejeitado
- [x] Se o solicitante é o próprio diretor, esta etapa é pulada automaticamente
- [x] Diretor é notificado por e-mail apenas quando uma solicitação efetivamente exige sua aprovação
- [x] A aprovação de nível 2 só fica disponível depois que o nível 1 já aprovou (sequencial, nunca em paralelo)

## Comments

`aprovarNivel2` e `listarPendentesNivel2` foram adicionadas a `src/lib/workflow.ts`. `/aprovacoes` agora mostra duas tabelas (nível 1 e nível 2). A página `/solicitacoes/[id]` ganhou a seção de aprovação de nível 2, reaproveitando o componente `PainelAprovacao` (extraído nesta ticket, compartilhado entre nível 1 e nível 2) e a função `rejeitar` já existente desde o ticket 06 — ela já tinha sido desenhada para aceitar tanto ENVIADO (responsável) quanto AGUARDANDO_NIVEL2 (diretor), então não precisou de nenhuma mudança.

**Auto-skip e sequencialidade:** já estavam garantidos desde os tickets 05/06 (`resolverEstadoInicial` no envio, `aprovarNivel1` na aprovação real) — `AGUARDANDO_NIVEL2` só é alcançável depois que o nível 1 aprovou ou foi pulado, nunca em paralelo. Nenhum código novo foi necessário para esses dois itens do checklist, só a UI/ação de nível 2 em si.

**Notificação ao diretor:** era o item pendente real deste ticket — `enviarSolicitacao`/`reenviarSolicitacao` e `aprovarNivel1` agora notificam o diretor quando a solicitação chega em `AGUARDANDO_NIVEL2` (nos dois caminhos possíveis: auto-skip no envio e aprovação real de nível 1), usando uma função compartilhada `notificarDiretorPendente`.

**Revisão de código (8 ângulos)** não encontrou bugs de correção — a maioria dos achados foi de duplicação e uma página crescendo demais, todos corrigidos:
- Extraído `atualizarStatusComGuarda`, compartilhado por `processarEnvio`, `aprovarNivel1`, `aprovarNivel2` e `rejeitar` — as quatro repetiam o mesmo padrão de `updateMany` com guarda de concorrência.
- Extraído `notificarSolicitanteAprovado`, compartilhado por `aprovarNivel1` e `aprovarNivel2` (e-mail de aprovação idêntico nos dois).
- `src/app/solicitacoes/[id]/page.tsx` chegou a 4 seções condicionais inline (visualização, aprovação nível 1, aprovação nível 2, editar/reenviar) — exatamente o ponto que a revisão do ticket 07 já tinha previsto como "hora de extrair". Extraídos `DetalhesSolicitacao` e `PainelEdicaoReenvio`; a página caiu de ~223 para ~93 linhas.
- Limpezas menores: tipo `Pendente` derivado do retorno real de `listarPendentesNivel1` em vez de duplicado à mão; helper de teste `criarSolicitacaoAguardandoNivel2` simplificado (só `diretorId` era usado, não as 4 opções copiadas do helper irmão); branch implícito em `aprovarNivel1` tornado explícito.
