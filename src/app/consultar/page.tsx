import Link from "next/link";
import type { StatusSolicitacao } from "@prisma/client";
import { AcessoRestrito } from "../admin/_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos } from "@/lib/departamentos";
import { listarSolicitacoesParaExportar } from "@/lib/workflow";
import { parseDataFiltro } from "@/lib/format";
import { STATUS_LEGIVEL } from "../solicitacoes/_components/status-legivel";
import { PainelConsultaSolicitacoes } from "../_components/painel-consulta-solicitacoes";

export default async function ConsultarPage({
  searchParams,
}: {
  searchParams: Promise<{ departamentoId?: string; status?: string; de?: string; ate?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const params = await searchParams;
  const departamentoId = params.departamentoId || undefined;

  const statusParam = params.status || undefined;
  const statusInvalido = Boolean(statusParam && !(statusParam in STATUS_LEGIVEL));

  const de = parseDataFiltro(params.de ?? null, "inicio");
  const ate = parseDataFiltro(params.ate ?? null, "fim");
  const dataInvalida = de === null || ate === null;

  const [departamentos, solicitacoes] = await Promise.all([
    listarDepartamentos(),
    statusInvalido || dataInvalida
      ? Promise.resolve([])
      : listarSolicitacoesParaExportar({
          departamentoId,
          status: statusInvalido ? undefined : (statusParam as StatusSolicitacao | undefined),
          de: de ?? undefined,
          ate: ate ?? undefined,
          ordenacao: "desc",
        }),
  ]);

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "64rem" }}>
        <PainelConsultaSolicitacoes
          titulo="Consultar solicitações"
          descricao="Todas as solicitações do sistema, com o status atual de cada uma."
          departamentos={departamentos}
          params={{ departamentoId, status: statusParam, de: params.de, ate: params.ate }}
          statusInvalido={statusInvalido}
          dataInvalida={dataInvalida}
          solicitacoes={solicitacoes}
        />

        <Link href="/" className="link">
          &larr; Voltar
        </Link>
      </div>
    </main>
  );
}
