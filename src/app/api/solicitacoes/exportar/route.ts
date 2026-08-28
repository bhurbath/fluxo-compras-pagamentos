import { NextRequest } from "next/server";
import type { StatusSolicitacao } from "@prisma/client";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarSolicitacoesParaExportar } from "@/lib/workflow";
import { formatarReais, formatarDataHora } from "@/lib/format";
import { paraCsv } from "@/lib/csv";
import { STATUS_LEGIVEL } from "@/app/solicitacoes/_components/status-legivel";
import { EVENTO_LEGIVEL } from "@/app/solicitacoes/_components/evento-legivel";

// yyyy-mm-dd (o formato de <input type="date">) → início ou fim do dia
// local, validado. Retorna undefined para vazio, null para uma data
// inválida (ex: query string adulterada) — o chamador decide o que fazer
// com cada caso.
function parseData(valor: string | null, limite: "inicio" | "fim"): Date | null | undefined {
  if (!valor) return undefined;
  const hora = limite === "inicio" ? "T00:00:00.000" : "T23:59:59.999";
  const data = new Date(`${valor}${hora}`);
  return Number.isNaN(data.getTime()) ? null : data;
}

// Reconstrói quem aprovou em cada nível a partir do histórico, em vez de
// usar departamento.responsavel/diretor atuais — ver o comentário em
// listarSolicitacoesParaExportar (src/lib/workflow.ts) para o porquê. Os
// eventos "aguardando_nivel2"/"aprovado" ficam em ordem cronológica
// (histórico já vem ordenado asc): o primeiro dos dois é sempre a decisão
// de nível 1; um "aprovado" só conta como nível 2 se vier depois de um
// "aguardando_nivel2" já visto.
function extrairAprovadores(
  historico: { evento: string; ator: { nome: string } | null }[]
): { nivel1: string; nivel2: string } {
  let nivel1 = "";
  let nivel2 = "";
  let passouPorNivel2 = false;
  for (const h of historico) {
    const nomeAtor = h.ator?.nome ?? "Automático";
    if (h.evento === "aguardando_nivel2") {
      nivel1 = nomeAtor;
      passouPorNivel2 = true;
    } else if (h.evento === "aprovado") {
      if (passouPorNivel2) {
        nivel2 = nomeAtor;
      } else {
        nivel1 = nomeAtor;
      }
    }
  }
  return { nivel1, nivel2 };
}

// Rota de download, não Server Action — filtros viram query string de um
// <form method="GET">, e o navegador trata a resposta como arquivo pelo
// Content-Disposition abaixo. getFinanceiroUsuario() (não requireFinanceiro,
// que lança) porque aqui dá pra devolver um 403 de verdade em vez de uma
// página de erro genérica do Next.
export async function GET(request: NextRequest) {
  const usuario = await getFinanceiroUsuario();
  if (!usuario) {
    return new Response("Acesso restrito ao Financeiro.", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const departamentoId = searchParams.get("departamentoId") || undefined;

  const statusParam = searchParams.get("status") || undefined;
  if (statusParam && !(statusParam in STATUS_LEGIVEL)) {
    return new Response("Status inválido.", { status: 400 });
  }

  const de = parseData(searchParams.get("de"), "inicio");
  const ate = parseData(searchParams.get("ate"), "fim");
  if (de === null || ate === null) {
    return new Response("Data inválida.", { status: 400 });
  }

  const solicitacoes = await listarSolicitacoesParaExportar({
    departamentoId,
    // Já validado contra STATUS_LEGIVEL acima — mesma fonte de verdade que
    // gera as opções do <select> em /exportar, então os dois não podem
    // divergir sobre o que é um status válido.
    status: statusParam as StatusSolicitacao | undefined,
    de,
    ate,
  });

  const cabecalho = [
    "Descrição",
    "Valor",
    "Departamento",
    "Tipo de compra",
    "Solicitante",
    "Aprovador nível 1",
    "Aprovador nível 2",
    "Comprador",
    "Status",
    "Data de criação",
    "Data da situação atual",
    "Histórico (evento e data de cada transição)",
  ];

  const linhas = solicitacoes.map((s) => {
    const aprovadores = extrairAprovadores(s.historico);
    return [
      s.descricao,
      formatarReais(s.valor),
      s.departamento.nome,
      s.tipoCompra.nome,
      s.solicitante.nome,
      aprovadores.nivel1,
      aprovadores.nivel2,
      s.comprador?.nome ?? "",
      STATUS_LEGIVEL[s.status] ?? s.status,
      formatarDataHora(s.criadoEm),
      formatarDataHora(s.atualizadoEm),
      s.historico
        .map((h) => `${EVENTO_LEGIVEL[h.evento] ?? h.evento} (${formatarDataHora(h.criadoEm)})`)
        .join(" | "),
    ];
  });

  const csv = paraCsv(cabecalho, linhas);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="solicitacoes.csv"',
    },
  });
}
