"use server";

import { redirect } from "next/navigation";
import { comUsuarioAutenticado } from "@/lib/require-usuario";
import { withFinanceiro } from "@/lib/admin/guard";
import { redirectComErro } from "@/lib/redirect-with-error";
import { toFriendlyError } from "@/lib/prisma-errors";
import { gerarUrlAssinada, uploadAnexo } from "@/lib/storage";
import {
  aprovarNivel1,
  aprovarNivel2,
  confirmarComprovante,
  designarCompradorManualmente,
  registrarPagamento,
  recusarPagamento,
  rejeitar,
} from "@/lib/workflow";

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

export const designarCompradorManualmenteAction = withFinanceiro(
  async (usuario, id: string, formData: FormData) => {
    const compradorId = String(formData.get("compradorId") ?? "");
    try {
      await designarCompradorManualmente(id, usuario.id, compradorId);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

export const recusarPagamentoAction = withFinanceiro(
  async (usuario, id: string, formData: FormData) => {
    const motivo = String(formData.get("motivo") ?? "");
    try {
      await recusarPagamento(id, usuario.id, motivo);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

// Primeira etapa (ver registrarPagamento em workflow.ts) — nunca lê anexo
// nenhum aqui, mesmo para tipos que exigem comprovante: isso fica pra
// confirmarComprovanteAction, a segunda etapa, abaixo.
export const registrarPagamentoAction = withFinanceiro(
  async (usuario, id: string, formData: FormData) => {
    const dataPrevistaPagamento = String(formData.get("dataPrevistaPagamento") ?? "");
    try {
      await registrarPagamento(id, usuario.id, { dataPrevistaPagamento });
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

// Segunda etapa (ver confirmarComprovante em workflow.ts) — só alcançável
// depois que registrarPagamentoAction já deixou a solicitação aguardando o
// comprovante. Aceita mais de um arquivo (ex.: comprovante do banco +
// extrato) — formData.getAll(), não .get(), como em lerArquivos de
// src/app/solicitacoes/actions.ts.
export const confirmarComprovanteAction = withFinanceiro(
  async (usuario, id: string, formData: FormData) => {
    const comprovantes = formData
      .getAll("comprovante")
      .filter((valor): valor is File => valor instanceof File && valor.size > 0);
    if (comprovantes.length === 0) {
      redirectComErro(`/solicitacoes/${id}`, "O comprovante de pagamento é obrigatório.");
    }

    try {
      const comprovantePagamentoUrls = await Promise.all(
        comprovantes.map((arquivo) => uploadAnexo(arquivo, id))
      );
      // Validade maior que o padrão de página (1h) — o e-mail pode ser
      // aberto dias depois de enviado.
      const comprovanteUrlsAssinadas = await Promise.all(
        comprovantePagamentoUrls.map((url) => gerarUrlAssinada(url, 7 * 24 * 60 * 60))
      );
      await confirmarComprovante(id, usuario.id, {
        comprovantePagamentoUrls,
        comprovanteUrlsAssinadas,
      });
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);
