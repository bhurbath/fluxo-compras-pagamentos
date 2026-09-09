import Link from "next/link";
import type { StatusSolicitacao } from "@prisma/client";
import { AcessoRestrito } from "../admin/_components/acesso-restrito";
import { getGestorUsuario } from "@/lib/gestor";
import { listarSolicitacoesParaExportar } from "@/lib/workflow";
import { parseDataFiltro } from "@/lib/format";
import { STATUS_LEGIVEL } from "../solicitacoes/_components/status-legivel";
import { PainelConsultaSolicitacoes } from "../_components/painel-consulta-solicitacoes";

export default async function DepartamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ departamentoId?: string; status?: string; de?: string; ate?: string }>;
}) {
  const gestor = await getGestorUsuario();
  if (!gestor) {
    return (
      <AcessoRestrito mensagem="Acesso restrito a quem é responsável ou diretor de algum departamento." />
    );
  }
  const { departamentos } = gestor;
  const idsGeridos = departamentos.map((d) => d.id);

  const params = await searchParams;
  // Nunca confia direto no departamentoId da query string: só aceita se for
  // um dos departamentos que esse usuário de fato gerencia (responsável
  // e/ou diretor) — sem essa checagem, alguém poderia trocar o valor na URL
  // e ver solicitações de um departamento alheio.
  const departamentoIdParam = params.departamentoId || undefined;
  const departamentoIdFiltro =
    departamentoIdParam && idsGeridos.includes(departamentoIdParam)
      ? departamentoIdParam
      : undefined;

  const statusParam = params.status || undefined;
  const statusInvalido = Boolean(statusParam && !(statusParam in STATUS_LEGIVEL));

  const de = parseDataFiltro(params.de ?? null, "inicio");
  const ate = parseDataFiltro(params.ate ?? null, "fim");
  const dataInvalida = de === null || ate === null;

  const solicitacoes =
    statusInvalido || dataInvalida
      ? []
      : await listarSolicitacoesParaExportar({
          departamentoId: departamentoIdFiltro,
          departamentoIds: departamentoIdFiltro ? undefined : idsGeridos,
          status: statusInvalido ? undefined : (statusParam as StatusSolicitacao | undefined),
          de: de ?? undefined,
          ate: ate ?? undefined,
          ordenacao: "desc",
        });

  const titulo =
    departamentos.length === 1
      ? `Solicitações do departamento ${departamentos[0].nome}`
      : "Solicitações dos meus departamentos";

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "64rem" }}>
        <PainelConsultaSolicitacoes
          titulo={titulo}
          descricao="Solicitações dos departamentos onde você é responsável ou diretor, com o status atual de cada uma."
          departamentos={departamentos}
          mostrarFiltroDepartamento={departamentos.length > 1}
          params={{ departamentoId: departamentoIdFiltro, status: statusParam, de: params.de, ate: params.ate }}
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
