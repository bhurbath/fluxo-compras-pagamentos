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
import { toFriendlyError } from "@/lib/prisma-errors";

function parseDepartamentoForm(formData: FormData): DepartamentoInput {
  const nome = String(formData.get("nome") ?? "").trim();
  const responsavelId = String(formData.get("responsavelId") ?? "");
  const diretorId = String(formData.get("diretorId") ?? "");

  if (!nome || !responsavelId || !diretorId) {
    throw new Error("Nome, responsável e diretor são obrigatórios.");
  }

  return { nome, responsavelId, diretorId };
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
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const departamentoIdRaw = String(formData.get("departamentoId") ?? "");

  try {
    if (!usuarioId) {
      throw new Error("Funcionário inválido.");
    }
    await atribuirDepartamento(usuarioId, departamentoIdRaw || null);
  } catch (error) {
    redirectComErro("/admin/funcionarios", toFriendlyError(error));
  }

  revalidatePath("/admin/funcionarios");
});

function parseFaixaForm(formData: FormData): FaixaAlcadaInput {
  const valorMin = String(formData.get("valorMin") ?? "").trim();
  const valorMaxRaw = String(formData.get("valorMax") ?? "").trim();
  const exigeNivel2 = formData.get("exigeNivel2") === "on";

  if (!valorMin) {
    throw new Error("Valor mínimo é obrigatório.");
  }

  return { valorMin, valorMax: valorMaxRaw || null, exigeNivel2 };
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
