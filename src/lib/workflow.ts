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

export async function criarSolicitacao(input: CriarSolicitacaoInput) {
  validarCriarSolicitacao(input);

  const solicitacao = await getDb().solicitacao.create({
    data: {
      solicitanteId: input.solicitanteId,
      departamentoId: input.departamentoId,
      tipoCompraId: input.tipoCompraId,
      descricao: input.descricao.trim(),
      valor: input.valor,
      status: StatusSolicitacao.RASCUNHO,
      fornecedor: input.fornecedor.trim(),
      formaPagamento: input.formaPagamento,
      centroCustoId: input.centroCustoId,
      centroResultadoId: input.centroResultadoId,
      contaContabilId: input.contaContabilId,
      empresaId: input.empresaId,
      linkCompra: input.linkCompra?.trim() || null,
      informacoesComplementares: input.informacoesComplementares?.trim() || null,
    },
  });

  await registrarHistorico(solicitacao.id, "rascunho_criado", input.solicitanteId);

  return solicitacao;
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

// Applies the auto-approval rule at every level a fresh submission could
// land on, in one pass — not just level 1. If level 1 is skipped (solicitante
// is the responsável) and the alçada requires level 2, level 2 is checked
// too (solicitante is the diretor), so a request never lands on
// AGUARDANDO_NIVEL2 waiting on an approver who can't approve their own
// request. aprovarNivel1 (a later ticket) re-applies the level-2 check on
// its own path into AGUARDANDO_NIVEL2 — this only covers the submission path.
async function resolverEstadoInicial(solicitacao: {
  solicitanteId: string;
  valor: Prisma.Decimal;
  departamento: { responsavelId: string; diretorId: string };
}): Promise<ResultadoResolucao> {
  const pulaNivel1 = solicitacao.solicitanteId === solicitacao.departamento.responsavelId;
  if (!pulaNivel1) {
    // A decisão de nível 2 só é tomada quando o nível 1 aprova (ticket
    // futuro), mas o valor ainda precisa cair dentro de alguma faixa
    // cadastrada agora — senão o gap de configuração só apareceria bem mais
    // tarde, na aprovação, em vez de no envio. O booleano retornado aqui não
    // importa, só o efeito colateral de lançar quando nenhuma faixa cobre.
    await resolverExigeNivel2(solicitacao.valor);
    return { status: StatusSolicitacao.ENVIADO, evento: "enviado" };
  }

  const exigeNivel2 = await resolverExigeNivel2(solicitacao.valor);
  if (!exigeNivel2) {
    return {
      status: StatusSolicitacao.APROVADO,
      evento: "aprovado",
      detalhe:
        "Aprovação de nível 1 pulada automaticamente (solicitante é o responsável " +
        "do departamento); a alçada não exige aprovação de nível 2.",
    };
  }

  const pulaNivel2 = solicitacao.solicitanteId === solicitacao.departamento.diretorId;
  if (pulaNivel2) {
    return {
      status: StatusSolicitacao.APROVADO,
      evento: "aprovado",
      detalhe:
        "Aprovação de nível 1 e de nível 2 puladas automaticamente (solicitante " +
        "é responsável e diretor do departamento).",
    };
  }

  return {
    status: StatusSolicitacao.AGUARDANDO_NIVEL2,
    evento: "aguardando_nivel2",
    detalhe:
      "Aprovação de nível 1 pulada automaticamente (solicitante é o responsável " +
      "do departamento).",
  };
}

export async function enviarSolicitacao(id: string) {
  const solicitacao = await getDb().solicitacao.findUnique({
    where: { id },
    include: { departamento: true, solicitante: true },
  });
  if (!solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== StatusSolicitacao.RASCUNHO) {
    throw new Error("Só é possível enviar uma solicitação que está em rascunho.");
  }

  const resolucao = await resolverEstadoInicial(solicitacao);

  const atualizada = await getDb().solicitacao.update({
    where: { id },
    data: { status: resolucao.status },
  });

  await registrarHistorico(
    id,
    resolucao.evento,
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

  return atualizada;
}
