"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withFinanceiro } from "@/lib/admin/guard";
import { redirectComErro } from "@/lib/admin/redirect-with-error";
import {
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
import {
  atualizarEntradaMatriz,
  criarEntradaMatriz,
  excluirEntradaMatriz,
  type MatrizCompradorInput,
} from "@/lib/matriz-comprador";
import { toFriendlyError } from "@/lib/prisma-errors";

// Reads a fixed set of string fields from FormData, trimmed. Every admin
// form reads a handful of required (and sometimes optional) string fields
// this same way — this just removes the repeated `String(formData.get(...)
// ?? "").trim()` per field, not the required-field message itself (each
// form keeps its own specific wording below).
function lerCampos<Chaves extends string>(
  formData: FormData,
  chaves: Chaves[]
): Record<Chaves, string> {
  const valores = {} as Record<Chaves, string>;
  for (const chave of chaves) {
    valores[chave] = String(formData.get(chave) ?? "").trim();
  }
  return valores;
}

function exigirTodos(valores: Record<string, string>, mensagem: string): void {
  if (Object.values(valores).some((valor) => !valor)) {
    throw new Error(mensagem);
  }
}

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

function parseTipoCompraForm(formData: FormData): TipoCompraInput {
  const campos = lerCampos(formData, ["nome"]);
  exigirTodos(campos, "O nome do tipo de compra é obrigatório.");
  return campos;
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
