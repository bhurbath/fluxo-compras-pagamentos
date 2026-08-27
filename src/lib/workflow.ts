import { getDb } from "@/lib/db";
import { paraDecimal } from "@/lib/decimal";
import { getEmailSender } from "@/lib/email";
import { formatarReais } from "@/lib/format";
import { FormaPagamento, Prisma, StatusSolicitacao } from "@prisma/client";

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
  const { count } = await getDb().solicitacao.updateMany({
    where: { id, status: StatusSolicitacao.REJEITADO },
    data: mapCamposSolicitacao(input),
  });
  if (count === 0) {
    throw new Error(
      "Essa solicitação foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
    );
  }

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
    include: { departamento: { include: { responsavel: true } }, solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== statusOrigem) {
    throw new Error(mensagemStatusInvalido);
  }

  const resolucao = await resolverEstadoInicial(solicitacao);

  // O `where` reconfirma o status de origem, não só o id — mesma proteção
  // contra ações concorrentes que aprovarNivel1/rejeitar já usam, para não
  // deixar dois cliques em "Enviar"/"Reenviar" processarem o mesmo envio
  // duas vezes.
  const { count } = await getDb().solicitacao.updateMany({
    where: { id, status: statusOrigem },
    data: {
      status: resolucao.status,
      // Só faz diferença vindo de REJEITADO (de RASCUNHO já é null) — limpa
      // o motivo antigo atomicamente junto com a transição de status, nunca
      // antes disso ter de fato acontecido.
      motivoRejeicao: null,
    },
  });
  if (count === 0) {
    throw new Error(
      "Essa solicitação foi alterada por outra ação enquanto isso — atualize a página e tente de novo."
    );
  }

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

  // Só o caminho ENVIADO deixa uma aprovação de nível 1 de fato pendente —
  // os caminhos de auto-aprovação não têm ninguém esperando para agir.
  if (resolucao.status === StatusSolicitacao.ENVIADO) {
    await getEmailSender().send({
      to: solicitacao.departamento.responsavel.email,
      subject: "Nova solicitação de compra aguardando sua aprovação",
      html:
        `<p>Olá, ${solicitacao.departamento.responsavel.nome}.</p>` +
        `<p>${solicitacao.solicitante.nome} enviou a solicitação "${solicitacao.descricao}" ` +
        `(${formatarReais(solicitacao.valor)}) e ela está aguardando sua aprovação.</p>`,
    });
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
    include: { departamento: true, solicitante: true },
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

  // O `where` com status (em vez de só `id`) protege contra duas ações
  // concorrentes (ex: aprovar e rejeitar quase ao mesmo tempo) decidindo a
  // mesma solicitação — só uma delas encontra a linha ainda em ENVIADO.
  const { count } = await getDb().solicitacao.updateMany({
    where: { id, status: StatusSolicitacao.ENVIADO },
    data: { status: resolucao.status },
  });
  if (count === 0) {
    throw new Error(
      "Essa solicitação já foi decidida por outra ação e não está mais aguardando " +
        "aprovação de nível 1."
    );
  }

  await registrarHistorico(id, resolucao.evento, atorId, detalhe);

  // Assim como no envio, só a aprovação final notifica o solicitante — se a
  // solicitação foi para AGUARDANDO_NIVEL2, ela ainda não chegou a um
  // desfecho para ele saber.
  if (resolucao.status === StatusSolicitacao.APROVADO) {
    await getEmailSender().send({
      to: solicitacao.solicitante.email,
      subject: "Solicitação de compra aprovada",
      html:
        `<p>Olá, ${solicitacao.solicitante.nome}.</p>` +
        `<p>Sua solicitação "${solicitacao.descricao}" (${formatarReais(solicitacao.valor)}) ` +
        "foi aprovada.</p>",
    });
  }

  return getDb().solicitacao.findUniqueOrThrow({ where: { id } });
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

  // Mesma proteção contra ações concorrentes que aprovarNivel1: o `where`
  // reconfirma o status que já foi lido acima, não só o id.
  const { count } = await getDb().solicitacao.updateMany({
    where: { id, status: solicitacao.status },
    data: { status: StatusSolicitacao.REJEITADO, motivoRejeicao: motivoTrim },
  });
  if (count === 0) {
    throw new Error(
      "Essa solicitação já foi decidida por outra ação e não está mais aguardando aprovação."
    );
  }

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
