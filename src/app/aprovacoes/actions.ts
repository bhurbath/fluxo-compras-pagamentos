"use server";

import { redirect } from "next/navigation";
import { comUsuarioAutenticado } from "@/lib/require-usuario";
import { redirectComErro } from "@/lib/redirect-with-error";
import { toFriendlyError } from "@/lib/prisma-errors";
import { aprovarNivel1, aprovarNivel2, rejeitar } from "@/lib/workflow";

export const aprovarNivel1Action = comUsuarioAutenticado(
  // formData is required so Args includes it (the <form action> always
  // passes it), even though this action doesn't need any of its fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (usuario, id: string, _formData: FormData) => {
    try {
      await aprovarNivel1(id, usuario.id);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

export const aprovarNivel2Action = comUsuarioAutenticado(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (usuario, id: string, _formData: FormData) => {
    try {
      await aprovarNivel2(id, usuario.id);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

export const rejeitarAction = comUsuarioAutenticado(
  async (usuario, id: string, formData: FormData) => {
    const motivo = String(formData.get("motivo") ?? "");
    try {
      await rejeitar(id, usuario.id, motivo);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);
