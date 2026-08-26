"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withFinanceiro } from "@/lib/admin/guard";
import {
  atribuirDepartamento,
  atualizarDepartamento,
  criarDepartamento,
  type DepartamentoInput,
} from "@/lib/departamentos";
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
  const input = parseDepartamentoForm(formData);

  try {
    await criarDepartamento(input);
  } catch (error) {
    throw toFriendlyError(error);
  }

  revalidatePath("/admin/departamentos");
  redirect("/admin/departamentos");
});

export const atualizarDepartamentoAction = withFinanceiro(
  async (_usuario, id: string, formData: FormData) => {
    const input = parseDepartamentoForm(formData);

    try {
      await atualizarDepartamento(id, input);
    } catch (error) {
      throw toFriendlyError(error);
    }

    revalidatePath("/admin/departamentos");
    redirect("/admin/departamentos");
  }
);

export const atribuirDepartamentoAction = withFinanceiro(async (_usuario, formData: FormData) => {
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const departamentoIdRaw = String(formData.get("departamentoId") ?? "");

  if (!usuarioId) {
    throw new Error("Funcionário inválido.");
  }

  try {
    await atribuirDepartamento(usuarioId, departamentoIdRaw || null);
  } catch (error) {
    throw toFriendlyError(error);
  }

  revalidatePath("/admin/funcionarios");
});
