import { listarDepartamentos } from "@/lib/departamentos";
import { listarTiposCompra } from "@/lib/tipos-compra";
import { listarCentrosCusto } from "@/lib/centro-custo";
import { listarCentrosResultado } from "@/lib/centro-resultado";
import { listarContasContabeis } from "@/lib/conta-contabil";
import { listarEmpresas } from "@/lib/empresa";

// The 6 dropdown lists the solicitação form (create at /solicitacoes/nova,
// edit-after-rejection at /solicitacoes/[id]) needs — shared so both pages
// fetch them the same way instead of repeating the same Promise.all.
export async function listarListasSolicitacao() {
  const [departamentos, tiposCompra, centrosCusto, centrosResultado, contasContabeis, empresas] =
    await Promise.all([
      listarDepartamentos(),
      listarTiposCompra(),
      listarCentrosCusto(),
      listarCentrosResultado(),
      listarContasContabeis(),
      listarEmpresas(),
    ]);
  return { departamentos, tiposCompra, centrosCusto, centrosResultado, contasContabeis, empresas };
}
