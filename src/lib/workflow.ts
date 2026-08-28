import { getDb } from "@/lib/db";
import { paraDecimal } from "@/lib/decimal";
import { getEmailSender } from "@/lib/email";
import { formatarReais } from "@/lib/format";
import { FormaPagamento, MetodoPagamento, Prisma, StatusSolicitacao } from "@prisma/client";

export async function obterSolicitacao(id: string) {
  return getDb().solicitacao.findUnique({
    where: { id },
    include: {
      solicitante: true,
      departamento: true,
      tipoCompra: true,
      centroCusto: true,
      centroResultado: true,
      contaContabil: true,
      empresa: true,
      comprador: true,
      historico: {
        include: { ator: true },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
}

export type CriarSolicitacaoInput = {
  solicitanteId: string;
  departamentoId: string;
  tipoCompraId: string;
  descricao: string;
  valor: string;
  fornecedor: string;
  formaPagamento: FormaPagamento;
  centroCustoId: string;
  centroResultadoId: string;
  contaContabilId: string;
  empresaId: string;
  linkCompra?: string | null;
  informacoesComplementares?: string | null;
};

const CAMPOS_OBRIGATORIOS: {
  chave: keyof CriarSolicitacaoInput;
  mensagem: string;
}[] = [
  { chave: "solicitanteId", mensagem: "O solicitante é obrigatório." },
  { chave: "departamentoId", mensagem: "O departamento é obrigatório." },
  { chave: "tipoCompraId", mensagem: "O tipo de compra é obrigatório." },
  { chave: "fornecedor", mensagem: "O fornecedor é obrigatório." },
  { chave: "centroCustoId", mensagem: "O centro de custo é obrigatório." },
  { chave: "centroResultadoId", mensagem: "O centro de resultado é obrigatório." },
  { chave: "contaContabilId", mensagem: "A conta contábil é obrigatória." },
  { chave: "empresaId", mensagem: "A empresa é obrigatória." },
];

function validarCriarSolicitacao(input: CriarSolicitacaoInput): void {
  if (!input.descricao.trim()) {
    throw new Error("A descrição é obrigatória.");
  }
  const valor = paraDecimal(input.valor, "O valor");
  if (valor.lessThanOrEqualTo(0)) {
    throw new Error("O valor precisa ser maior que zero.");
  }
  for (const { chave, mensagem } of CAMPOS_OBRIGATORIOS) {
    if (!String(input[chave] ?? "").trim()) {
      throw new Error(mensagem);
    }
  }
  if (!Object.values(FormaPagamento).includes(input.formaPagamento)) {
    throw new Error("A forma de pagamento é obrigatória.");
  }
}

async function registrarHistorico(
  solicitacaoId: string,
  evento: string,
  atorId: string | null,
  detalhe?: string
): Promise<void> {
  await getDb().solicitacaoHistorico.create({
    data: { solicitacaoId, evento, atorId, detalhe },
  });
}

// Shared by every transition that mutates status (processarEnvio,
// aprovarNivel1, aprovarNivel2, rejeitar, ...) — the `where` reconfirms the
// expected starting status, not just `id`, so two concurrent actions on the
// same solicitação (e.g. aprovar and rejeitar firing close together) can't
// both succeed; only the one that still finds the row in that status does.
// Reachable from more than one starting status? Give each origin its own
// exported wrapper around a shared internal helper (ex: enviarSolicitacao/
// reenviarSolicitacao via processarEnvio, ou enviarParaPagamento/
// reenviarParaPagamento via processarEnvioPagamento) instead of widening
// statusEsperado here — a single expected status per call is the guard's
// whole point.
async function atualizarStatusComGuarda(
  id: string,
  statusEsperado: StatusSolicitacao,
  data: Prisma.SolicitacaoUpdateManyMutationInput,
  mensagemConflito: string
): Promise<void> {
  const { count } = await getDb().solicitacao.updateMany({
    where: { id, status: statusEsperado },
    data,
  });
  if (count === 0) {
    throw new Error(mensagemConflito);
  }
}

// The fields both criarSolicitacao and editarSolicitacao write — everything
// about "the request" except who made it and what status it's in, which
// each of those two functions owns differently (create sets both fresh;
// edit changes neither).
function mapCamposSolicitacao(input: CriarSolicitacaoInput) {
  return {
    departamentoId: input.departamentoId,
    tipoCompraId: input.tipoCompraId,
    descricao: input.descricao.trim(),
    valor: input.valor,
    fornecedor: input.fornecedor.trim(),
    formaPagamento: input.formaPagamento,
    centroCustoId: input.centroCustoId,
    centroResultadoId: input.centroResultadoId,
    contaContabilId: input.contaContabilId,
    empresaId: input.empresaId,
    linkCompra: input.linkCompra?.trim() || null,
    informacoesComplementares: input.informacoesComplementares?.trim() || null,
  };
}

export async function criarSolicitacao(input: CriarSolicitacaoInput) {
  validarCriarSolicitacao(input);

  const solicitacao = await getDb().solicitacao.create({
    data: {
      solicitanteId: input.solicitanteId,
      status: StatusSolicitacao.RASCUNHO,
      ...mapCamposSolicitacao(input),
    },
  });

  await registrarHistorico(solicitacao.id, "rascunho_criado", input.solicitanteId);

  return solicitacao;
}

export async function editarSolicitacao(
  id: string,
  atorId: string,
  input: CriarSolicitacaoInput
) {
  validarCriarSolicitacao(input);

  const solicitacao = await getDb().solicitacao.findUnique({ where: { id } });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  // Ownership antes do status: assim quem não é o solicitante sempre recebe
  // o mesmo erro de permissão, sem dar pra distinguir pelo texto se o id
  // existe nem em qual status ele está.
  if (atorId !== solicitacao.solicitanteId) {
    throw new Error("Só o solicitante pode editar essa solicitação.");
  }
  if (solicitacao.status !== StatusSolicitacao.REJEITADO) {
    throw new Error("Só é possível editar uma solicitação que foi rejeitada.");
  }

  // input.solicitanteId é ignorado de propósito — editar corrige os campos
  // do pedido, não pode trocar quem é o dono dele. motivoRejeicao também
  // não é tocado aqui: ele continua visível até o reenvio de fato acontecer
  // (ver reenviarSolicitacao), não antes disso ter sido confirmado.
  await atualizarStatusComGuarda(
    id,
    StatusSolicitacao.REJEITADO,
    mapCamposSolicitacao(input),
    "Essa solicitação foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
  );

  await registrarHistorico(id, "editado_apos_rejeicao", atorId);

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

// Looks up which faixa de alçada covers `valor` (both bounds inclusive,
// matching how faixas are validated/entered in ticket 03) and returns
// whether it requires level-2 approval. Throws rather than guessing when no
// faixa covers the value — an operational gap in the Financeiro's alçada
// configuration, not something this function should silently paper over.
async function resolverExigeNivel2(valor: Prisma.Decimal): Promise<boolean> {
  const faixa = await getDb().faixaAlcada.findFirst({
    where: {
      valorMin: { lte: valor },
      OR: [{ valorMax: null }, { valorMax: { gte: valor } }],
    },
  });
  if (!faixa) {
    throw new Error(
      "Nenhuma faixa de alçada cadastrada cobre esse valor. Peça ao Financeiro " +
        "para cadastrar uma faixa que cubra esse valor antes de enviar."
    );
  }
  return faixa.exigeNivel2;
}

type ResultadoResolucao = {
  status:
    | typeof StatusSolicitacao.ENVIADO
    | typeof StatusSolicitacao.APROVADO
    | typeof StatusSolicitacao.AGUARDANDO_NIVEL2;
  evento: string;
  detalhe?: string;
};

type ResolucaoPosNivel1 = {
  status: typeof StatusSolicitacao.APROVADO | typeof StatusSolicitacao.AGUARDANDO_NIVEL2;
  evento: "aprovado" | "aguardando_nivel2";
};

// Shared by the submission-time auto-skip (resolverEstadoInicial, below) and
// the real nível-1 approval (aprovarNivel1) — both need the exact same
// "does this land on AGUARDANDO_NIVEL2 or skip straight to APROVADO" rule;
// only the detalhe wording they attach differs per call site.
function decidirStatusPosNivel1(exigeNivel2: boolean, pulaNivel2: boolean): ResolucaoPosNivel1 {
  if (!exigeNivel2 || pulaNivel2) {
    return { status: StatusSolicitacao.APROVADO, evento: "aprovado" };
  }
  return { status: StatusSolicitacao.AGUARDANDO_NIVEL2, evento: "aguardando_nivel2" };
}

// Applies the auto-approval rule at every level a fresh submission could
// land on, in one pass — not just level 1. If level 1 is skipped (solicitante
// is the responsável) and the alçada requires level 2, level 2 is checked
// too (solicitante is the diretor), so a request never lands on
// AGUARDANDO_NIVEL2 waiting on an approver who can't approve their own
// request. aprovarNivel1 re-applies the level-2 check on its own path into
// AGUARDANDO_NIVEL2 — this only covers the submission path.
async function resolverEstadoInicial(solicitacao: {
  solicitanteId: string;
  valor: Prisma.Decimal;
  departamento: { responsavelId: string; diretorId: string };
}): Promise<ResultadoResolucao> {
  const pulaNivel1 = solicitacao.solicitanteId === solicitacao.departamento.responsavelId;
  if (!pulaNivel1) {
    // A decisão de nível 2 só é tomada quando o nível 1 aprova, mas o valor
    // ainda precisa cair dentro de alguma faixa cadastrada agora — senão o
    // gap de configuração só apareceria bem mais tarde, na aprovação, em vez
    // de no envio. O booleano retornado aqui não importa, só o efeito
    // colateral de lançar quando nenhuma faixa cobre.
    await resolverExigeNivel2(solicitacao.valor);
    return { status: StatusSolicitacao.ENVIADO, evento: "enviado" };
  }

  const exigeNivel2 = await resolverExigeNivel2(solicitacao.valor);
  if (!exigeNivel2) {
    return {
      ...decidirStatusPosNivel1(exigeNivel2, false),
      detalhe:
        "Aprovação de nível 1 pulada automaticamente (solicitante é o responsável " +
        "do departamento); a alçada não exige aprovação de nível 2.",
    };
  }

  const pulaNivel2 = solicitacao.solicitanteId === solicitacao.departamento.diretorId;
  if (pulaNivel2) {
    return {
      ...decidirStatusPosNivel1(exigeNivel2, pulaNivel2),
      detalhe:
        "Aprovação de nível 1 e de nível 2 puladas automaticamente (solicitante " +
        "é responsável e diretor do departamento).",
    };
  }

  return {
    ...decidirStatusPosNivel1(exigeNivel2, pulaNivel2),
    detalhe:
      "Aprovação de nível 1 pulada automaticamente (solicitante é o responsável " +
      "do departamento).",
  };
}

// Shared by processarEnvio's auto-skip-to-nível-2 path and aprovarNivel1's
// real approval path — both are the only two places a solicitação can
// arrive at AGUARDANDO_NIVEL2, and the diretor only needs to hear about it
// once it's actually their turn, not on every submission.
async function notificarDiretorPendente(solicitacao: {
  descricao: string;
  valor: Prisma.Decimal;
  solicitante: { nome: string };
  departamento: { diretor: { email: string; nome: string } };
}): Promise<void> {
  await getEmailSender().send({
    to: solicitacao.departamento.diretor.email,
    subject: "Solicitação de compra aguardando sua aprovação",
    html:
      `<p>Olá, ${solicitacao.departamento.diretor.nome}.</p>` +
      `<p>${solicitacao.solicitante.nome} enviou a solicitação "${solicitacao.descricao}" ` +
      `(${formatarReais(solicitacao.valor)}) e ela está aguardando sua aprovação.</p>`,
  });
}

// Shared by aprovarNivel1's and aprovarNivel2's final-approval outcome —
// the only two places a solicitação reaches APROVADO.
async function notificarSolicitanteAprovado(solicitacao: {
  descricao: string;
  valor: Prisma.Decimal;
  solicitante: { email: string; nome: string };
}): Promise<void> {
  await getEmailSender().send({
    to: solicitacao.solicitante.email,
    subject: "Solicitação de compra aprovada",
    html:
      `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
      `<p>Sua solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
      "foi aprovada.</p>",
  });
}

// Shared by the automatic (matriz match) and manual (Financeiro-picked)
// comprador designation paths — same "you've been assigned" email either way.
async function notificarComprador(
  solicitacao: { descricao: string; valor: Prisma.Decimal },
  comprador: { email: string; nome: string }
): Promise<void> {
  await getEmailSender().send({
    to: comprador.email,
    subject: "Você foi designado para realizar uma compra",
    html:
      `<p>Olá, ${comprador.nome}.</p>` +
      `<p>Você foi designado para realizar a compra da solicitação "${solicitacao.descricao}" ` +
      `(${formatarReais(solicitacao.valor)}).</p>`,
  });
}

// "Atribuída ao Financeiro" não é um único dono — Financeiro é uma flag em
// Usuario, não uma pessoa — então isso avisa todo mundo que tem a flag.
// `montarHtml` fica a cargo de cada chamador porque o conteúdo muda conforme
// o motivo do aviso (designação pendente, pagamento pendente, ...); só o
// "buscar todo mundo com a flag e mandar em paralelo" é compartilhado.
async function notificarTodosFinanceiros(
  assunto: string,
  montarHtml: (financeiro: { nome: string }) => string
): Promise<void> {
  const financeiros = await getDb().usuario.findMany({ where: { flagFinanceiro: true } });
  await Promise.all(
    financeiros.map((f) =>
      getEmailSender().send({
        to: f.email,
        subject: assunto,
        html: montarHtml(f),
      })
    )
  );
}

// Runs automatically the moment a solicitação reaches APROVADO (called from
// processarEnvio, aprovarNivel1, and aprovarNivel2 — the only three places
// that transition can happen). Looks up matriz_comprador by
// (departamentoId, tipoCompraId); with no match, the request just stays
// with compradorId null and every Financeiro user is notified to designate
// one manually via designarCompradorManualmente.
async function designarComprador(solicitacao: {
  id: string;
  departamentoId: string;
  tipoCompraId: string;
  descricao: string;
  valor: Prisma.Decimal;
}): Promise<void> {
  const entrada = await getDb().matrizComprador.findFirst({
    where: {
      departamentoId: solicitacao.departamentoId,
      tipoCompraId: solicitacao.tipoCompraId,
    },
    include: { comprador: true },
  });

  if (entrada) {
    // O `where` reconfirma compradorId ainda nulo — sem isso, essa
    // designação automática poderia sobrescrever uma designação manual
    // que o Financeiro tenha feito na janela entre a solicitação chegar
    // em APROVADO e este lookup rodar.
    const { count } = await getDb().solicitacao.updateMany({
      where: { id: solicitacao.id, compradorId: null },
      data: { compradorId: entrada.compradorId },
    });
    if (count === 0) {
      return;
    }
    await registrarHistorico(
      solicitacao.id,
      "comprador_designado",
      null,
      `Designado automaticamente pela matriz: ${entrada.comprador.nome}.`
    );
    await notificarComprador(solicitacao, entrada.comprador);
    return;
  }

  await registrarHistorico(
    solicitacao.id,
    "aguardando_designacao_manual",
    null,
    "Nenhuma combinação encontrada na matriz de comprador — aguardando designação manual pelo Financeiro."
  );
  await notificarTodosFinanceiros(
    "Solicitação aguardando designação de comprador",
    (f) =>
      `<p>Olá, ${f.nome}.</p>` +
      `<p>A solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
      "foi aprovada, mas não há um comprador cadastrado na matriz para essa combinação " +
      "de departamento e tipo de compra. Designe um comprador manualmente.</p>"
  );
}

// Compartilhado por toda transição restrita ao Financeiro que só recebe um
// atorId (não o Usuario já carregado) — designarCompradorManualmente,
// recusarPagamento, registrarPagamento. A mensagem de erro fica a cargo de
// quem chama porque cada ação descreve o que especificamente foi negado.
async function requireFinanceiroAtor(atorId: string, mensagemErro: string) {
  const ator = await getDb().usuario.findUnique({ where: { id: atorId } });
  if (!ator?.flagFinanceiro) {
    throw new Error(mensagemErro);
  }
  return ator;
}

export async function designarCompradorManualmente(
  id: string,
  atorId: string,
  compradorId: string
) {
  await requireFinanceiroAtor(atorId, "Só o Financeiro pode designar um comprador manualmente.");

  const solicitacao = await getDb().solicitacao.findUnique({ where: { id } });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== StatusSolicitacao.APROVADO) {
    throw new Error("Só é possível designar comprador para uma solicitação aprovada.");
  }
  if (solicitacao.compradorId !== null) {
    throw new Error("Essa solicitação já tem um comprador designado.");
  }

  const comprador = await getDb().usuario.findUnique({ where: { id: compradorId } });
  if (!comprador) {
    throw new Error("Comprador inválido.");
  }

  // O `where` reconfirma status ainda aprovado e compradorId ainda nulo —
  // protege contra duas designações concorrentes (manual e automática, ou
  // duas manuais ao mesmo tempo) sobrescrevendo uma à outra.
  const { count } = await getDb().solicitacao.updateMany({
    where: { id, status: StatusSolicitacao.APROVADO, compradorId: null },
    data: { compradorId },
  });
  if (count === 0) {
    throw new Error(
      "Essa solicitação já foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
    );
  }

  await registrarHistorico(
    id,
    "comprador_designado",
    atorId,
    `Designado manualmente pelo Financeiro: ${comprador.nome}.`
  );
  await notificarComprador(solicitacao, comprador);

  return { ...solicitacao, compradorId };
}

export async function listarPendentesDesignacaoComprador() {
  return getDb().solicitacao.findMany({
    where: { status: StatusSolicitacao.APROVADO, compradorId: null },
    include: { solicitante: true, departamento: true },
    orderBy: { criadoEm: "asc" },
  });
}

// Shared by enviarSolicitacao (RASCUNHO → ...) and reenviarSolicitacao
// (REJEITADO → ...) — both re-run the exact same resolution (auto-skip,
// alçada) from scratch, not resuming from wherever the request stopped
// last time. They differ only in which status they start from, what the
// "arrived at ENVIADO" história event is called, and the error message for
// an invalid starting status.
async function processarEnvio(
  id: string,
  statusOrigem: typeof StatusSolicitacao.RASCUNHO | typeof StatusSolicitacao.REJEITADO,
  eventoEnvio: string,
  mensagemStatusInvalido: string
) {
  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: {
      departamento: { include: { responsavel: true, diretor: true } },
      solicitante: true,
    },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== statusOrigem) {
    throw new Error(mensagemStatusInvalido);
  }

  const resolucao = await resolverEstadoInicial(solicitacao);

  await atualizarStatusComGuarda(
    id,
    statusOrigem,
    {
      status: resolucao.status,
      // Só faz diferença vindo de REJEITADO (de RASCUNHO já é null) — limpa
      // o motivo antigo atomicamente junto com a transição de status, nunca
      // antes disso ter de fato acontecido.
      motivoRejeicao: null,
    },
    "Essa solicitação foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
  );

  await registrarHistorico(
    id,
    resolucao.status === StatusSolicitacao.ENVIADO ? eventoEnvio : resolucao.evento,
    solicitacao.solicitanteId,
    resolucao.detalhe
  );

  await getEmailSender().send({
    to: solicitacao.solicitante.email,
    subject: "Solicitação de compra enviada",
    html:
      `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
      `<p>Sua solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
      "foi enviada com sucesso e está em análise.</p>",
  });

  // Só os caminhos ENVIADO/AGUARDANDO_NIVEL2 deixam uma aprovação de fato
  // pendente — os caminhos de auto-aprovação não têm ninguém esperando
  // para agir.
  if (resolucao.status === StatusSolicitacao.ENVIADO) {
    await getEmailSender().send({
      to: solicitacao.departamento.responsavel.email,
      subject: "Nova solicitação de compra aguardando sua aprovação",
      html:
        `<p>Olá, ${solicitacao.departamento.responsavel.nome}.</p>` +
        `<p>${solicitacao.solicitante.nome} enviou a solicitação "${solicitacao.descricao}" ` +
        `(${formatarReais(solicitacao.valor)}) e ela está aguardando sua aprovação.</p>`,
    });
  } else if (resolucao.status === StatusSolicitacao.AGUARDANDO_NIVEL2) {
    await notificarDiretorPendente(solicitacao);
  } else if (resolucao.status === StatusSolicitacao.APROVADO) {
    await designarComprador(solicitacao);
  }

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export async function enviarSolicitacao(id: string) {
  return processarEnvio(
    id,
    StatusSolicitacao.RASCUNHO,
    "enviado",
    "Só é possível enviar uma solicitação que está em rascunho."
  );
}

export async function reenviarSolicitacao(id: string) {
  return processarEnvio(
    id,
    StatusSolicitacao.REJEITADO,
    "reenviado",
    "Só é possível reenviar uma solicitação que foi rejeitada."
  );
}

export async function listarPendentesNivel1(responsavelId: string) {
  return getDb().solicitacao.findMany({
    where: {
      status: StatusSolicitacao.ENVIADO,
      departamento: { responsavelId },
    },
    include: { solicitante: true, departamento: true },
    orderBy: { criadoEm: "asc" },
  });
}

export async function aprovarNivel1(id: string, atorId: string) {
  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: { departamento: { include: { diretor: true } }, solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== StatusSolicitacao.ENVIADO) {
    throw new Error(
      "Só é possível aprovar uma solicitação que está aguardando aprovação de nível 1."
    );
  }
  if (atorId !== solicitacao.departamento.responsavelId) {
    throw new Error("Só o responsável do departamento pode aprovar essa solicitação.");
  }

  const exigeNivel2 = await resolverExigeNivel2(solicitacao.valor);
  const pulaNivel2 = solicitacao.solicitanteId === solicitacao.departamento.diretorId;
  const resolucao = decidirStatusPosNivel1(exigeNivel2, pulaNivel2);
  const detalhe =
    exigeNivel2 && pulaNivel2
      ? "Aprovação de nível 2 pulada automaticamente (solicitante é o diretor do departamento)."
      : undefined;

  await atualizarStatusComGuarda(
    id,
    StatusSolicitacao.ENVIADO,
    { status: resolucao.status },
    "Essa solicitação já foi decidida por outra ação e não está mais aguardando " +
      "aprovação de nível 1."
  );

  await registrarHistorico(id, resolucao.evento, atorId, detalhe);

  // Assim como no envio, só a aprovação final notifica o solicitante — se a
  // solicitação foi para AGUARDANDO_NIVEL2, ela ainda não chegou a um
  // desfecho para ele saber; nesse caso quem precisa ser avisado é o
  // diretor, que agora tem uma aprovação de fato pendente.
  if (resolucao.status === StatusSolicitacao.APROVADO) {
    await notificarSolicitanteAprovado(solicitacao);
    await designarComprador(solicitacao);
  } else if (resolucao.status === StatusSolicitacao.AGUARDANDO_NIVEL2) {
    await notificarDiretorPendente(solicitacao);
  }

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export async function aprovarNivel2(id: string, atorId: string) {
  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: { departamento: true, solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== StatusSolicitacao.AGUARDANDO_NIVEL2) {
    throw new Error(
      "Só é possível aprovar uma solicitação que está aguardando aprovação de nível 2."
    );
  }
  if (atorId !== solicitacao.departamento.diretorId) {
    throw new Error("Só o diretor do departamento pode aprovar essa solicitação.");
  }

  await atualizarStatusComGuarda(
    id,
    StatusSolicitacao.AGUARDANDO_NIVEL2,
    { status: StatusSolicitacao.APROVADO },
    "Essa solicitação já foi decidida por outra ação e não está mais aguardando " +
      "aprovação de nível 2."
  );

  await registrarHistorico(id, "aprovado", atorId);

  await notificarSolicitanteAprovado(solicitacao);
  await designarComprador(solicitacao);

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export async function listarPendentesNivel2(diretorId: string) {
  return getDb().solicitacao.findMany({
    where: {
      status: StatusSolicitacao.AGUARDANDO_NIVEL2,
      departamento: { diretorId },
    },
    include: { solicitante: true, departamento: true },
    orderBy: { criadoEm: "asc" },
  });
}

export async function rejeitar(id: string, atorId: string, motivo: string) {
  const motivoTrim = motivo.trim();
  if (!motivoTrim) {
    throw new Error("O motivo da rejeição é obrigatório.");
  }

  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: { departamento: true, solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }

  // Rejeitado é alcançável a partir de qualquer nível de aprovação pendente
  // — o aprovador esperado muda conforme em qual nível a solicitação está.
  const aprovadorPorStatus: Partial<Record<StatusSolicitacao, string>> = {
    [StatusSolicitacao.ENVIADO]: solicitacao.departamento.responsavelId,
    [StatusSolicitacao.AGUARDANDO_NIVEL2]: solicitacao.departamento.diretorId,
  };
  const aprovadorEsperado = aprovadorPorStatus[solicitacao.status];
  if (!aprovadorEsperado) {
    throw new Error("Só é possível rejeitar uma solicitação que está aguardando aprovação.");
  }
  if (atorId !== aprovadorEsperado) {
    throw new Error("Você não tem permissão para rejeitar essa solicitação.");
  }

  await atualizarStatusComGuarda(
    id,
    solicitacao.status,
    { status: StatusSolicitacao.REJEITADO, motivoRejeicao: motivoTrim },
    "Essa solicitação já foi decidida por outra ação e não está mais aguardando aprovação."
  );

  await registrarHistorico(id, "rejeitado", atorId, motivoTrim);

  await getEmailSender().send({
    to: solicitacao.solicitante.email,
    subject: "Solicitação de compra rejeitada",
    html:
      `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
      `<p>Sua solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
      "foi rejeitada.</p>" +
      `<p>Motivo: ${motivoTrim}</p>`,
  });

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export async function confirmarCompra(id: string, atorId: string) {
  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: { solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (atorId !== solicitacao.compradorId) {
    throw new Error("Só o comprador designado pode confirmar essa compra.");
  }
  if (solicitacao.status !== StatusSolicitacao.APROVADO) {
    throw new Error("Só é possível confirmar a compra de uma solicitação aprovada.");
  }

  await atualizarStatusComGuarda(
    id,
    StatusSolicitacao.APROVADO,
    { status: StatusSolicitacao.COMPRA_CONFIRMADA },
    "Essa solicitação já foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
  );

  await registrarHistorico(id, "compra_confirmada", atorId);

  await getEmailSender().send({
    to: solicitacao.solicitante.email,
    subject: "Compra confirmada",
    html:
      `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
      `<p>A compra da sua solicitação "${solicitacao.descricao}" ` +
      `(${formatarReais(solicitacao.valor)}) foi confirmada. Em breve o pagamento será processado.</p>`,
  });

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export type EnviarParaPagamentoInput = {
  // Caminho do arquivo no bucket de Storage (ver src/lib/storage.ts), não uma
  // URL pública — o bucket é privado, então quem exibe o anexo precisa gerar
  // uma URL assinada a partir desse caminho na hora de renderizar.
  notaFiscalUrl: string;
  metodoPagamento: MetodoPagamento;
  dadosPagamento: string;
  fornecedorDocumento: string;
};

// Compartilhado por enviarParaPagamento (COMPRA_CONFIRMADA → ...) e
// reenviarParaPagamento (PAGAMENTO_RECUSADO → ..., depois de o Financeiro
// recusar) — mesmo padrão de processarEnvio/enviarSolicitacao/
// reenviarSolicitacao: uma função interna faz validação+transição+
// notificação, cada wrapper exportado só fixa de qual status ela parte, o
// nome do evento de histórico, e a mensagem de erro para um status inválido.
// Anexar a nota fiscal e enviar para pagamento são um único passo atômico
// (não duas funções separadas) — mantê-los separados só criava uma janela de
// corrida (a escrita da nota fiscal não tinha guarda de concorrência,
// diferente de toda outra mutação neste arquivo) e um estado parcial
// possível (nota fiscal anexada, envio ainda não confirmado) sem trazer
// benefício real, já que não existe fluxo que anexe a nota fiscal sem também
// enviar para pagamento em seguida. O upload em si (validação de formato,
// envio ao Storage) já aconteceu antes desta função ser chamada — ver
// uploadAnexo em src/lib/storage.ts — então aqui só resta confirmar que um
// caminho de fato chegou.
async function processarEnvioPagamento(
  id: string,
  atorId: string,
  input: EnviarParaPagamentoInput,
  statusOrigem:
    | typeof StatusSolicitacao.COMPRA_CONFIRMADA
    | typeof StatusSolicitacao.PAGAMENTO_RECUSADO,
  eventoEnvio: string,
  mensagemStatusInvalido: string
) {
  const notaFiscalUrlTrim = input.notaFiscalUrl.trim();
  const dadosPagamentoTrim = input.dadosPagamento.trim();
  const fornecedorDocumentoTrim = input.fornecedorDocumento.trim();
  if (!notaFiscalUrlTrim) {
    throw new Error("A nota fiscal/comprovante da compra é obrigatória.");
  }
  if (!Object.values(MetodoPagamento).includes(input.metodoPagamento)) {
    throw new Error("O método de pagamento é obrigatório.");
  }
  if (!dadosPagamentoTrim) {
    throw new Error("Os dados de pagamento são obrigatórios.");
  }
  if (!fornecedorDocumentoTrim) {
    throw new Error("O CNPJ/CPF do fornecedor é obrigatório.");
  }

  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: { solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (atorId !== solicitacao.compradorId) {
    throw new Error("Só o comprador designado pode enviar essa solicitação para pagamento.");
  }
  if (solicitacao.status !== statusOrigem) {
    throw new Error(mensagemStatusInvalido);
  }

  await atualizarStatusComGuarda(
    id,
    statusOrigem,
    {
      status: StatusSolicitacao.AGUARDANDO_PAGAMENTO,
      notaFiscalUrl: notaFiscalUrlTrim,
      metodoPagamento: input.metodoPagamento,
      dadosPagamento: dadosPagamentoTrim,
      fornecedorDocumento: fornecedorDocumentoTrim,
      // Só faz diferença vindo de PAGAMENTO_RECUSADO (de COMPRA_CONFIRMADA já
      // é null) — limpa o motivo antigo atomicamente junto com a transição,
      // mesmo padrão de processarEnvio limpando motivoRejeicao no reenvio.
      motivoRecusaPagamento: null,
    },
    "Essa solicitação já foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
  );

  await registrarHistorico(id, eventoEnvio, atorId);

  await Promise.all([
    getEmailSender().send({
      to: solicitacao.solicitante.email,
      subject: "Solicitação de compra enviada para pagamento",
      html:
        `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
        `<p>Sua solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
        "foi enviada ao Financeiro para pagamento.</p>",
    }),
    notificarTodosFinanceiros(
      "Solicitação de compra aguardando pagamento",
      (f) =>
        `<p>Olá, ${f.nome}.</p>` +
        `<p>A solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
        "teve a compra confirmada e a nota fiscal anexada, e está aguardando o processamento do pagamento.</p>"
    ),
  ]);

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export async function enviarParaPagamento(
  id: string,
  atorId: string,
  input: EnviarParaPagamentoInput
) {
  return processarEnvioPagamento(
    id,
    atorId,
    input,
    StatusSolicitacao.COMPRA_CONFIRMADA,
    "enviado_para_pagamento",
    "Só é possível enviar para pagamento uma solicitação com a compra confirmada."
  );
}

export async function reenviarParaPagamento(
  id: string,
  atorId: string,
  input: EnviarParaPagamentoInput
) {
  return processarEnvioPagamento(
    id,
    atorId,
    input,
    StatusSolicitacao.PAGAMENTO_RECUSADO,
    "reenviado_para_pagamento",
    "Só é possível reenviar para pagamento uma solicitação com o pagamento recusado."
  );
}

export async function listarPendentesPagamento() {
  return getDb().solicitacao.findMany({
    where: { status: StatusSolicitacao.AGUARDANDO_PAGAMENTO },
    include: { solicitante: true, departamento: true },
    orderBy: { criadoEm: "asc" },
  });
}

export async function recusarPagamento(id: string, atorId: string, motivo: string) {
  const motivoTrim = motivo.trim();
  if (!motivoTrim) {
    throw new Error("O motivo da recusa é obrigatório.");
  }

  const [, solicitacao] = await Promise.all([
    requireFinanceiroAtor(atorId, "Só o Financeiro pode recusar um pagamento."),
    getDb().solicitacao.findUnique({ where: { id }, include: { comprador: true } }),
  ]);
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== StatusSolicitacao.AGUARDANDO_PAGAMENTO) {
    throw new Error("Só é possível recusar uma solicitação que está aguardando pagamento.");
  }
  // Garantido pelo próprio enviarParaPagamento (exige atorId === compradorId
  // para entrar em AGUARDANDO_PAGAMENTO) — não deveria acontecer, mas se
  // acontecer é melhor lançar do que notificar ninguém silenciosamente.
  if (!solicitacao.comprador) {
    throw new Error("Essa solicitação não tem um comprador designado.");
  }

  await atualizarStatusComGuarda(
    id,
    StatusSolicitacao.AGUARDANDO_PAGAMENTO,
    { status: StatusSolicitacao.PAGAMENTO_RECUSADO, motivoRecusaPagamento: motivoTrim },
    "Essa solicitação já foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
  );

  await registrarHistorico(id, "pagamento_recusado", atorId, motivoTrim);

  await getEmailSender().send({
    to: solicitacao.comprador.email,
    subject: "Solicitação de pagamento recusada",
    html:
      `<p>Olá, ${solicitacao.comprador.nome}.</p>` +
      `<p>O Financeiro recusou o pagamento da solicitação "${solicitacao.descricao}" ` +
      `(${formatarReais(solicitacao.valor)}).</p>` +
      `<p>Motivo: ${motivoTrim}</p>`,
  });

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

export type RegistrarPagamentoInput = {
  // Mesmo esquema de notaFiscalUrl em enviarParaPagamento: caminho no bucket
  // de Storage, não uma URL pública — ver src/lib/storage.ts.
  comprovantePagamentoUrl: string;
};

export async function registrarPagamento(
  id: string,
  atorId: string,
  input: RegistrarPagamentoInput
) {
  const comprovanteTrim = input.comprovantePagamentoUrl.trim();
  if (!comprovanteTrim) {
    throw new Error("O comprovante de pagamento é obrigatório.");
  }

  const [, solicitacao] = await Promise.all([
    requireFinanceiroAtor(atorId, "Só o Financeiro pode registrar um pagamento."),
    getDb().solicitacao.findUnique({ where: { id }, include: { solicitante: true } }),
  ]);
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== StatusSolicitacao.AGUARDANDO_PAGAMENTO) {
    throw new Error(
      "Só é possível registrar o pagamento de uma solicitação que está aguardando pagamento."
    );
  }

  await atualizarStatusComGuarda(
    id,
    StatusSolicitacao.AGUARDANDO_PAGAMENTO,
    { status: StatusSolicitacao.PAGO, comprovantePagamentoUrl: comprovanteTrim },
    "Essa solicitação já foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
  );

  await registrarHistorico(id, "pago", atorId);

  // O comprovante em si mora no Storage (privado — ver src/lib/storage.ts);
  // o e-mail avisa que ele já está disponível na solicitação em vez de
  // embutir um link, seguindo o mesmo padrão de toda outra notificação deste
  // módulo (nenhuma delas hoje embute link algum).
  await getEmailSender().send({
    to: solicitacao.solicitante.email,
    subject: "Pagamento registrado",
    html:
      `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
      `<p>O pagamento da sua solicitação "${solicitacao.descricao}" ` +
      `(${formatarReais(solicitacao.valor)}) foi registrado. O comprovante já está ` +
      "disponível na página da solicitação.</p>",
  });

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
}

// "Minhas solicitações" — todo pedido criado pelo usuário, em qualquer
// status (inclusive RASCUNHO, que só o próprio solicitante pode ver). Mais
// recente primeiro, já que é uma lista de acompanhamento pessoal, não uma
// fila de ação como as listas de pendentes.
export async function listarMinhasSolicitacoes(solicitanteId: string) {
  return getDb().solicitacao.findMany({
    where: { solicitanteId },
    include: { departamento: true },
    orderBy: { criadoEm: "desc" },
  });
}

// "Pendentes de mim" (papel de comprador) — os três status em que o
// comprador designado tem uma ação real a tomar: confirmar a compra
// (APROVADO), enviar para pagamento (COMPRA_CONFIRMADA), ou corrigir e
// reenviar depois de uma recusa (PAGAMENTO_RECUSADO).
export async function listarPendentesComprador(compradorId: string) {
  return getDb().solicitacao.findMany({
    where: {
      compradorId,
      status: {
        in: [
          StatusSolicitacao.APROVADO,
          StatusSolicitacao.COMPRA_CONFIRMADA,
          StatusSolicitacao.PAGAMENTO_RECUSADO,
        ],
      },
    },
    include: { solicitante: true, departamento: true },
    orderBy: { criadoEm: "asc" },
  });
}

export type FiltrosExportacao = {
  departamentoId?: string;
  status?: StatusSolicitacao;
  de?: Date;
  ate?: Date;
};

// Para o relatório CSV do Financeiro (ticket 13) — não é uma transição, só
// uma consulta com filtro, mas fica no módulo junto com o resto por ser a
// mesma entidade e os mesmos includes que as outras funções de listagem já
// usam. Traz o histórico completo (com o ator de cada evento) para "datas de
// cada transição de status" e para a coluna "aprovadores" — de propósito,
// não usa departamento.responsavel/diretor para essa coluna: aprovador
// designado hoje ≠ quem de fato aprovou no passado se o departamento trocou
// de responsável/diretor depois (a tela de admin permite isso a qualquer
// momento). Um relatório de auditoria tem que refletir o que aconteceu, não
// a configuração atual.
export async function listarSolicitacoesParaExportar(filtros: FiltrosExportacao) {
  return getDb().solicitacao.findMany({
    where: {
      departamentoId: filtros.departamentoId,
      status: filtros.status,
      criadoEm: { gte: filtros.de, lte: filtros.ate },
    },
    include: {
      solicitante: true,
      departamento: true,
      tipoCompra: true,
      comprador: true,
      historico: { include: { ator: true }, orderBy: { criadoEm: "asc" } },
    },
    orderBy: { criadoEm: "asc" },
  });
}
