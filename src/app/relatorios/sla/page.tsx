import Link from "next/link";
import { StatusSolicitacao } from "@prisma/client";
import { AcessoRestrito } from "../../admin/_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { getDb } from "@/lib/db";
import { parseDataFiltro } from "@/lib/format";
import { construirRelatorioMensal, construirRelatorioSla, calcularFilaParada } from "@/lib/sla";
import { PainelSla } from "./_components/painel-sla";

// Duas consultas separadas de listarSolicitacoesParaExportar (que filtra
// por criadoEm) de propósito: a tendência mensal (RelatorioSla.porMes)
// agrupa pela data do evento "pago", não pela criação — uma solicitação
// criada em agosto e paga em setembro conta pra setembro. Por isso busca
// TODAS as pagas (sem filtro de período) só pra montar a tendência
// completa, e filtra as demais estatísticas pelo período pedido em
// memória, pela data de pagamento (não de criação).
export default async function RelatorioSlaPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const params = await searchParams;
  const de = parseDataFiltro(params.de ?? null, "inicio");
  const ate = parseDataFiltro(params.ate ?? null, "fim");
  const dataInvalida = de === null || ate === null;

  // Uma consulta só: o SLA mensal por gestor e o registro do Financeiro
  // existem mesmo em solicitações que ainda não foram pagas (ou que nunca
  // serão — rejeitadas, canceladas), então não dá para partir só das pagas.
  // calcularFilaParada já ignora, pelo status, o que não está em aberto.
  const enviadas = await getDb().solicitacao.findMany({
    where: { status: { not: StatusSolicitacao.RASCUNHO } },
    include: {
      tipoCompra: true,
      historico: { include: { ator: true }, orderBy: { criadoEm: "asc" } },
    },
    orderBy: { criadoEm: "asc" },
  });
  const todasPagas = enviadas.filter((s) => s.status === StatusSolicitacao.PAGO);

  const pagasNoPeriodo = dataInvalida
    ? []
    : todasPagas.filter((s) => {
        const pago = s.historico.find((h) => h.evento === "pago");
        if (!pago) return false;
        if (de && pago.criadoEm < de) return false;
        if (ate && pago.criadoEm > ate) return false;
        return true;
      });

  const relatorioPeriodo = construirRelatorioSla(pagasNoPeriodo);
  const relatorioCompleto = construirRelatorioSla(todasPagas);
  const filaParada = calcularFilaParada(enviadas);
  const relatorioMensal = construirRelatorioMensal(enviadas);

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "68rem" }}>
        <h1 className="page-title">SLA de aprovação e pagamento</h1>
        <p className="muted">
          Tempo entre cada etapa do fluxo, exclusivo do Financeiro. O filtro de período se
          aplica pela data em que a solicitação foi paga, não pela data de criação.
        </p>

        <PainelSla
          params={{ de: params.de, ate: params.ate }}
          dataInvalida={dataInvalida}
          relatorio={relatorioPeriodo}
          tendenciaMensal={relatorioCompleto.porMes}
          mensal={relatorioMensal}
          filaParada={filaParada}
        />

        <Link href="/" className="link">
          &larr; Voltar
        </Link>
      </div>
    </main>
  );
}
