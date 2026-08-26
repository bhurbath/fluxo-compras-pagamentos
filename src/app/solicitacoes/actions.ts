"use server";

import { redirect } from "next/navigation";
import { comUsuarioAutenticado } from "@/lib/require-usuario";
import { redirectComErro } from "@/lib/redirect-with-error";
import { toFriendlyError } from "@/lib/prisma-errors";
import { exigirTodos, lerCampos } from "@/lib/form-helpers";
import {
  criarSolicitacao,
  enviarSolicitacao,
  type CriarSolicitacaoInput,
} from "@/lib/workflow";
import { FormaPagamento, type Usuario } from "@prisma/client";

function parseSolicitacaoForm(
  usuario: Usuario,
  formData: FormData
): CriarSolicitacaoInput {
  const campos = lerCampos(formData, [
    "descricao",
    "valor",
    "departamentoId",
    "tipoCompraId",
    "fornecedor",
    "formaPagamento",
    "centroCustoId",
    "centroResultadoId",
    "contaContabilId",
    "empresaId",
  ]);
  exigirTodos(
    campos,
    "Descrição, valor, departamento, tipo de compra, fornecedor, forma de pagamento, " +
      "centro de custo, centro de resultado, conta contábil e empresa são obrigatórios."
  );

  const opcionais = lerCampos(formData, ["linkCompra", "informacoesComplementares"]);

  return {
    solicitanteId: usuario.id,
    descricao: campos.descricao,
    valor: campos.valor,
    departamentoId: campos.departamentoId,
    tipoCompraId: campos.tipoCompraId,
    fornecedor: campos.fornecedor,
    formaPagamento: campos.formaPagamento as FormaPagamento,
    centroCustoId: campos.centroCustoId,
    centroResultadoId: campos.centroResultadoId,
    contaContabilId: campos.contaContabilId,
    empresaId: campos.empresaId,
    linkCompra: opcionais.linkCompra || null,
    informacoesComplementares: opcionais.informacoesComplementares || null,
  };
}

export const criarRascunhoAction = comUsuarioAutenticado(
  async (usuario, formData: FormData) => {
    let solicitacao: Awaited<ReturnType<typeof criarSolicitacao>>;
    try {
      const input = parseSolicitacaoForm(usuario, formData);
      solicitacao = await criarSolicitacao(input);
    } catch (error) {
      redirectComErro("/solicitacoes/nova", toFriendlyError(error));
    }

    redirect(`/solicitacoes/${solicitacao.id}`);
  }
);

export const criarEEnviarAction = comUsuarioAutenticado(
  async (usuario, formData: FormData) => {
    let solicitacao: Awaited<ReturnType<typeof criarSolicitacao>> | null = null;
    try {
      const input = parseSolicitacaoForm(usuario, formData);
      solicitacao = await criarSolicitacao(input);
      solicitacao = await enviarSolicitacao(solicitacao.id);
    } catch (error) {
      // Se a solicitação já foi criada (rascunho) antes do envio falhar, o
      // erro tem que voltar para a página dela, não para o formulário em
      // branco — senão o usuário não sabe que um rascunho já existe e, ao
      // tentar de novo, acaba criando um segundo rascunho órfão.
      if (solicitacao) {
        redirectComErro(`/solicitacoes/${solicitacao.id}`, toFriendlyError(error));
      }
      redirectComErro("/solicitacoes/nova", toFriendlyError(error));
    }

    redirect(`/solicitacoes/${solicitacao.id}`);
  }
);
