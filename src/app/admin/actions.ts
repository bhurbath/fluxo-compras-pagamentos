"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withFinanceiro } from "@/lib/admin/guard";
import { redirectComErro } from "@/lib/redirect-with-error";
import {
  alternarFlagFinanceiro,
  atribuirDepartamento,
  atualizarDepartamento,
  criarDepartamento,
  type DepartamentoInput,
} from "@/lib/departamentos";
import {
  atualizarFaixaAlcada,
  criarFaixaAlcada,
  excluirFaixaAlcada,
  type FaixaAlcadaInput,
} from "@/lib/alcada";
import {
  atualizarTipoCompra,
  criarTipoCompra,
  excluirTipoCompra,
  type TipoCompraInput,
} from "@/lib/tipos-compra";
import { atualizarCentroCusto, criarCentroCusto, excluirCentroCusto } from "@/lib/centro-custo";
import {
  atualizarCentroResultado,
  criarCentroResultado,
  excluirCentroResultado,
} from "@/lib/centro-resultado";
import {
  atualizarContaContabil,
  criarContaContabil,
  excluirContaContabil,
} from "@/lib/conta-contabil";
import { atualizarEmpresa, criarEmpresa, excluirEmpresa } from "@/lib/empresa";
import {
  atualizarCategoriaDespesaPessoal,
  criarCategoriaDespesaPessoal,
  excluirCategoriaDespesaPessoal,
} from "@/lib/categoria-despesa-pessoal";
import {
  atualizarEntradaMatriz,
  criarEntradaMatriz,
  excluirEntradaMatriz,
  type MatrizCompradorInput,
} from "@/lib/matriz-comprador";
import { toFriendlyError } from "@/lib/prisma-errors";
import { exigirTodos, lerCampos } from "@/lib/form-helpers";

function parseDepartamentoForm(formData: FormData): DepartamentoInput {
  const campos = lerCampos(formData, ["nome", "responsavelId", "diretorId"]);
  exigirTodos(campos, "Nome, responsável e diretor são obrigatórios.");
  return campos;
}

export const criarDepartamentoAction = withFinanceiro(async (_usuario, formData: FormData) => {
  try {
    const input = parseDepartamentoForm(formData);
    await criarDepartamento(input);
  } catch (error) {
    redirectComErro("/admin/departamentos/novo", toFriendlyError(error));
  }

  revalidatePath("/admin/departamentos");
  redirect("/admin/departamentos");
});

export const atualizarDepartamentoAction = withFinanceiro(
  async (_usuario, id: string, formData: FormData) => {
    try {
      const input = parseDepartamentoForm(formData);
      await atualizarDepartamento(id, input);
    } catch (error) {
      redirectComErro(`/admin/departamentos/${id}`, toFriendlyError(error));
    }

    revalidatePath("/admin/departamentos");
    redirect("/admin/departamentos");
  }
);

export const atribuirDepartamentoAction = withFinanceiro(async (_usuario, formData: FormData) => {
  const { usuarioId, departamentoId } = lerCampos(formData, ["usuarioId", "departamentoId"]);

  try {
    exigirTodos({ usuarioId }, "Funcionário inválido.");
    await atribuirDepartamento(usuarioId, departamentoId || null);
  } catch (error) {
    redirectComErro("/admin/funcionarios", toFriendlyError(error));
  }

  revalidatePath("/admin/funcionarios");
});

export const alternarFinanceiroAction = withFinanceiro(async (usuario, formData: FormData) => {
  const { usuarioId, valor } = lerCampos(formData, ["usuarioId", "valor"]);

  try {
    exigirTodos({ usuarioId }, "Funcionário inválido.");
    await alternarFlagFinanceiro(usuarioId, valor === "true", usuario.id);
  } catch (error) {
    redirectComErro("/admin/funcionarios", toFriendlyError(error));
  }

  revalidatePath("/admin/funcionarios");
});

function parseFaixaForm(formData: FormData): FaixaAlcadaInput {
  const { valorMin, valorMax } = lerCampos(formData, ["valorMin", "valorMax"]);
  const exigeNivel2 = formData.get("exigeNivel2") === "on";
  exigirTodos({ valorMin }, "Valor mínimo é obrigatório.");
  return { valorMin, valorMax: valorMax || null, exigeNivel2 };
}

export const criarFaixaAlcadaAction = withFinanceiro(async (_usuario, formData: FormData) => {
  try {
    const input = parseFaixaForm(formData);
    await criarFaixaAlcada(input);
  } catch (error) {
    redirectComErro("/admin/alcada/novo", toFriendlyError(error));
  }

  revalidatePath("/admin/alcada");
  redirect("/admin/alcada");
});

export const atualizarFaixaAlcadaAction = withFinanceiro(
  async (_usuario, id: string, formData: FormData) => {
    try {
      const input = parseFaixaForm(formData);
      await atualizarFaixaAlcada(id, input);
    } catch (error) {
      redirectComErro(`/admin/alcada/${id}`, toFriendlyError(error));
    }

    revalidatePath("/admin/alcada");
    redirect("/admin/alcada");
  }
);

export const excluirFaixaAlcadaAction = withFinanceiro(
  // formData is required so Args includes it (the <form action> always
  // passes it), even though this action doesn't need any of its fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_usuario, id: string, _formData: FormData) => {
    try {
      await excluirFaixaAlcada(id);
    } catch (error) {
      redirectComErro("/admin/alcada", toFriendlyError(error));
    }

    revalidatePath("/admin/alcada");
  }
);

function parseMatrizForm(formData: FormData): MatrizCompradorInput {
  const campos = lerCampos(formData, ["departamentoId", "tipoCompraId", "compradorId"]);
  exigirTodos(campos, "Departamento, tipo de compra e comprador são obrigatórios.");
  return campos;
}

export const criarEntradaMatrizAction = withFinanceiro(async (_usuario, formData: FormData) => {
  try {
    const input = parseMatrizForm(formData);
    await criarEntradaMatriz(input);
  } catch (error) {
    redirectComErro("/admin/matriz-comprador/novo", toFriendlyError(error));
  }

  revalidatePath("/admin/matriz-comprador");
  redirect("/admin/matriz-comprador");
});

export const atualizarEntradaMatrizAction = withFinanceiro(
  async (_usuario, id: string, formData: FormData) => {
    try {
      const input = parseMatrizForm(formData);
      await atualizarEntradaMatriz(id, input);
    } catch (error) {
      redirectComErro(`/admin/matriz-comprador/${id}`, toFriendlyError(error));
    }

    revalidatePath("/admin/matriz-comprador");
    redirect("/admin/matriz-comprador");
  }
);

export const excluirEntradaMatrizAction = withFinanceiro(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_usuario, id: string, _formData: FormData) => {
    try {
      await excluirEntradaMatriz(id);
    } catch (error) {
      redirectComErro("/admin/matriz-comprador", toFriendlyError(error));
    }

    revalidatePath("/admin/matriz-comprador");
  }
);

// Shared shape for every "just a name" admin resource (tipos de compra,
// centro de custo, centro de resultado, conta contábil, empresa) — same
// create/update/delete/redirect/revalidate dance five times over, so it's
// built once instead of copy-pasted per entity.
function criarAcoesNomeSimples(config: {
  criar: (input: { nome: string }) => Promise<unknown>;
  atualizar: (id: string, input: { nome: string }) => Promise<unknown>;
  excluir: (id: string) => Promise<void>;
  basePath: string;
  mensagemNomeObrigatorio: string;
}) {
  function parseForm(formData: FormData): { nome: string } {
    const campos = lerCampos(formData, ["nome"]);
    exigirTodos(campos, config.mensagemNomeObrigatorio);
    return campos;
  }

  const criarAction = withFinanceiro(async (_usuario, formData: FormData) => {
    try {
      const input = parseForm(formData);
      await config.criar(input);
    } catch (error) {
      redirectComErro(`${config.basePath}/novo`, toFriendlyError(error));
    }

    revalidatePath(config.basePath);
    redirect(config.basePath);
  });

  const atualizarAction = withFinanceiro(
    async (_usuario, id: string, formData: FormData) => {
      try {
        const input = parseForm(formData);
        await config.atualizar(id, input);
      } catch (error) {
        redirectComErro(`${config.basePath}/${id}`, toFriendlyError(error));
      }

      revalidatePath(config.basePath);
      redirect(config.basePath);
    }
  );

  const excluirAction = withFinanceiro(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_usuario, id: string, _formData: FormData) => {
      try {
        await config.excluir(id);
      } catch (error) {
        redirectComErro(config.basePath, toFriendlyError(error));
      }

      revalidatePath(config.basePath);
    }
  );

  return { criarAction, atualizarAction, excluirAction };
}

function parseTipoCompraForm(formData: FormData): TipoCompraInput {
  const campos = lerCampos(formData, ["nome"]);
  exigirTodos(campos, "O nome do tipo de compra é obrigatório.");
  return {
    nome: campos.nome,
    compradorEhSolicitante: formData.get("compradorEhSolicitante") === "on",
    despesaPessoal: formData.get("despesaPessoal") === "on",
    exigePrevisaoChegada: formData.get("exigePrevisaoChegada") === "on",
    dispensaFornecedorForma: formData.get("dispensaFornecedorForma") === "on",
    empresaFixaId: String(formData.get("empresaFixaId") ?? "").trim() || null,
  };
}

export const criarTipoCompraAction = withFinanceiro(async (_usuario, formData: FormData) => {
  try {
    const input = parseTipoCompraForm(formData);
    await criarTipoCompra(input);
  } catch (error) {
    redirectComErro("/admin/tipos-compra/novo", toFriendlyError(error));
  }

  revalidatePath("/admin/tipos-compra");
  redirect("/admin/tipos-compra");
});

export const atualizarTipoCompraAction = withFinanceiro(
  async (_usuario, id: string, formData: FormData) => {
    try {
      const input = parseTipoCompraForm(formData);
      await atualizarTipoCompra(id, input);
    } catch (error) {
      redirectComErro(`/admin/tipos-compra/${id}`, toFriendlyError(error));
    }

    revalidatePath("/admin/tipos-compra");
    redirect("/admin/tipos-compra");
  }
);

export const excluirTipoCompraAction = withFinanceiro(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_usuario, id: string, _formData: FormData) => {
    try {
      await excluirTipoCompra(id);
    } catch (error) {
      redirectComErro("/admin/tipos-compra", toFriendlyError(error));
    }

    revalidatePath("/admin/tipos-compra");
  }
);

export const {
  criarAction: criarCentroCustoAction,
  atualizarAction: atualizarCentroCustoAction,
  excluirAction: excluirCentroCustoAction,
} = criarAcoesNomeSimples({
  criar: criarCentroCusto,
  atualizar: atualizarCentroCusto,
  excluir: excluirCentroCusto,
  basePath: "/admin/centros-custo",
  mensagemNomeObrigatorio: "O nome do centro de custo é obrigatório.",
});

export const {
  criarAction: criarCentroResultadoAction,
  atualizarAction: atualizarCentroResultadoAction,
  excluirAction: excluirCentroResultadoAction,
} = criarAcoesNomeSimples({
  criar: criarCentroResultado,
  atualizar: atualizarCentroResultado,
  excluir: excluirCentroResultado,
  basePath: "/admin/centros-resultado",
  mensagemNomeObrigatorio: "O nome do centro de resultado é obrigatório.",
});

export const {
  criarAction: criarContaContabilAction,
  atualizarAction: atualizarContaContabilAction,
  excluirAction: excluirContaContabilAction,
} = criarAcoesNomeSimples({
  criar: criarContaContabil,
  atualizar: atualizarContaContabil,
  excluir: excluirContaContabil,
  basePath: "/admin/contas-contabeis",
  mensagemNomeObrigatorio: "O nome da conta contábil é obrigatório.",
});

export const {
  criarAction: criarEmpresaAction,
  atualizarAction: atualizarEmpresaAction,
  excluirAction: excluirEmpresaAction,
} = criarAcoesNomeSimples({
  criar: criarEmpresa,
  atualizar: atualizarEmpresa,
  excluir: excluirEmpresa,
  basePath: "/admin/empresas",
  mensagemNomeObrigatorio: "O nome da empresa é obrigatório.",
});

export const {
  criarAction: criarCategoriaDespesaPessoalAction,
  atualizarAction: atualizarCategoriaDespesaPessoalAction,
  excluirAction: excluirCategoriaDespesaPessoalAction,
} = criarAcoesNomeSimples({
  criar: criarCategoriaDespesaPessoal,
  atualizar: atualizarCategoriaDespesaPessoal,
  excluir: excluirCategoriaDespesaPessoal,
  basePath: "/admin/categorias-despesa-pessoal",
  mensagemNomeObrigatorio: "O nome da categoria é obrigatório.",
});
