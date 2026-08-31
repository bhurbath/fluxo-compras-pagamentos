import { listarTiposCompra } from "@/lib/tipos-compra";
import { listarCentrosCusto } from "@/lib/centro-custo";
import { listarCentrosResultado } from "@/lib/centro-resultado";
import { listarContasContabeis } from "@/lib/conta-contabil";
import { listarEmpresas } from "@/lib/empresa";

// The 5 dropdown lists the solicitação form (create at /solicitacoes/nova,
// edit-after-rejection at /solicitacoes/[id]) needs — shared so both pages
// fetch them the same way instead of repeating the same Promise.all.
// Departamento não entra aqui: a solicitação sempre herda o departamento do
// próprio solicitante (ver parseSolicitacaoForm em solicitacoes/actions.ts),
// nunca é uma escolha no formulário.
export async function listarListasSolicitacao() {
  const [tiposCompra, centrosCusto, centrosResultado, contasContabeis, empresas] =
    await Promise.all([
      listarTiposCompra(),
      listarCentrosCusto(),
      listarCentrosResultado(),
      listarContasContabeis(),
      listarEmpresas(),
    ]);
  return { tiposCompra, centrosCusto, centrosResultado, contasContabeis, empresas };
}
