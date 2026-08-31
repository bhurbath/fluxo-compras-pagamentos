"use server";

import { redirect } from "next/navigation";
import { comUsuarioAutenticado } from "@/lib/require-usuario";
import { redirectComErro } from "@/lib/redirect-with-error";
import { toFriendlyError } from "@/lib/prisma-errors";
import { exigirTodos, lerCampos } from "@/lib/form-helpers";
import { uploadAnexo } from "@/lib/storage";
import {
  confirmarCompra,
  criarSolicitacao,
  editarSolicitacao,
  enviarParaPagamento,
  enviarSolicitacao,
  obterSolicitacao,
  reenviarParaPagamento,
  reenviarSolicitacao,
  type CriarSolicitacaoInput,
  type EnviarParaPagamentoInput,
} from "@/lib/workflow";
import { FormaPagamento, MetodoPagamento, type Usuario } from "@prisma/client";

// Anexo já existente (edição de uma solicitação sem compra rejeitada, sem
// reenvio de um novo arquivo) — ver editarEReenviarAction. Sem isso o
// solicitante seria obrigado a reanexar a mesma documentação a cada
// correção, já que um <input type="file"> nunca vem pré-preenchido.
async function lerCamposSemCompra(
  formData: FormData,
  solicitacaoId: string,
  notaFiscalUrlAtual: string | null
): Promise<Pick<CriarSolicitacaoInput, "metodoPagamento" | "dadosPagamento" | "fornecedorDocumento" | "notaFiscalUrl">> {
  const campos = lerCampos(formData, ["metodoPagamento", "dadosPagamento", "fornecedorDocumento"]);
  exigirTodos(
    campos,
    "Método de pagamento, dados de pagamento e CNPJ/CPF do fornecedor são obrigatórios " +
      "para uma solicitação sem compra."
  );

  const notaFiscal = formData.get("notaFiscal");
  let notaFiscalUrl = notaFiscalUrlAtual;
  if (notaFiscal instanceof File && notaFiscal.size > 0) {
    notaFiscalUrl = await uploadAnexo(notaFiscal, solicitacaoId);
  }
  if (!notaFiscalUrl) {
    throw new Error("A documentação (nota fiscal/guia) é obrigatória para uma solicitação sem compra.");
  }

  return {
    notaFiscalUrl,
    metodoPagamento: campos.metodoPagamento as MetodoPagamento,
    dadosPagamento: campos.dadosPagamento,
    fornecedorDocumento: campos.fornecedorDocumento,
  };
}

// O departamento nunca vem do formulário: cada funcionário já tem um
// departamento fixo no cadastro (ver /admin/funcionarios), então a
// solicitação sempre herda o do solicitante — nunca é uma escolha dele.
async function parseSolicitacaoForm(
  usuario: Usuario,
  formData: FormData,
  // Usado só como prefixo do caminho no Storage quando há upload de anexo
  // (solicitação sem compra) — ver uploadAnexo em src/lib/storage.ts. Uma
  // solicitação nova ainda não tem id nesse ponto, daí o placeholder.
  solicitacaoIdParaAnexo: string,
  notaFiscalUrlAtual: string | null = null
): Promise<CriarSolicitacaoInput> {
  if (!usuario.departamentoId) {
    throw new Error(
      "Seu usuário ainda não tem um departamento definido — peça ao Financeiro para " +
        "configurar isso em Cadastros > Funcionários antes de criar uma solicitação."
    );
  }

  const campos = lerCampos(formData, [
    "descricao",
    "valor",
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
    "Descrição, valor, tipo de compra, fornecedor, forma de pagamento, " +
      "centro de custo, centro de resultado, conta contábil e empresa são obrigatórios."
  );

  const opcionais = lerCampos(formData, ["linkCompra", "informacoesComplementares"]);
  const semCompra = formData.get("semCompra") === "on";

  return {
    solicitanteId: usuario.id,
    descricao: campos.descricao,
    valor: campos.valor,
    departamentoId: usuario.departamentoId,
    tipoCompraId: campos.tipoCompraId,
    fornecedor: campos.fornecedor,
    formaPagamento: campos.formaPagamento as FormaPagamento,
    centroCustoId: campos.centroCustoId,
    centroResultadoId: campos.centroResultadoId,
    contaContabilId: campos.contaContabilId,
    empresaId: campos.empresaId,
    linkCompra: opcionais.linkCompra || null,
    informacoesComplementares: opcionais.informacoesComplementares || null,
    semCompra,
    ...(semCompra
      ? await lerCamposSemCompra(formData, solicitacaoIdParaAnexo, notaFiscalUrlAtual)
      : {}),
  };
}

export const criarRascunhoAction = comUsuarioAutenticado(
  async (usuario, formData: FormData) => {
    let solicitacao: Awaited<ReturnType<typeof criarSolicitacao>>;
    try {
      const input = await parseSolicitacaoForm(usuario, formData, crypto.randomUUID());
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
      const input = await parseSolicitacaoForm(usuario, formData, crypto.randomUUID());
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

export const editarEReenviarAction = comUsuarioAutenticado(
  async (usuario, id: string, formData: FormData) => {
    try {
      const atual = await obterSolicitacao(id);
      const input = await parseSolicitacaoForm(usuario, formData, id, atual?.notaFiscalUrl ?? null);
      await editarSolicitacao(id, usuario.id, input);
      await reenviarSolicitacao(id);
    } catch (error) {
      // Diferente de criarEEnviarAction, aqui não existe risco de órfão: o
      // id já existe antes da chamada, então qualquer falha (na edição ou
      // no reenvio) sempre pode voltar para a própria página da solicitação
      // — o pior caso é ela ficar com os campos editados mas ainda
      // REJEITADO, o que é perfeitamente reenviável de novo.
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

export const confirmarCompraAction = comUsuarioAutenticado(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (usuario, id: string, _formData: FormData) => {
    try {
      await confirmarCompra(id, usuario.id);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

// Compartilhado por enviarParaPagamentoAction e reenviarParaPagamentoAction
// — mesmos campos, mesma validação, mesmo upload; só a função do workflow
// que cada uma chama depois muda (qual status de origem é aceito).
async function lerCamposEnviarPagamento(
  id: string,
  formData: FormData
): Promise<EnviarParaPagamentoInput> {
  const campos = lerCampos(formData, [
    "metodoPagamento",
    "dadosPagamento",
    "fornecedorDocumento",
  ]);
  exigirTodos(
    campos,
    "Método de pagamento, dados de pagamento e CNPJ/CPF do fornecedor são obrigatórios."
  );

  // Arquivo, não texto — lerCampos (que faz String(...)) não serve aqui.
  const notaFiscal = formData.get("notaFiscal");
  if (!(notaFiscal instanceof File) || notaFiscal.size === 0) {
    throw new Error("A nota fiscal/comprovante da compra é obrigatória.");
  }

  const notaFiscalUrl = await uploadAnexo(notaFiscal, id);
  return {
    notaFiscalUrl,
    metodoPagamento: campos.metodoPagamento as MetodoPagamento,
    dadosPagamento: campos.dadosPagamento,
    fornecedorDocumento: campos.fornecedorDocumento,
  };
}

export const enviarParaPagamentoAction = comUsuarioAutenticado(
  async (usuario, id: string, formData: FormData) => {
    try {
      const input = await lerCamposEnviarPagamento(id, formData);
      await enviarParaPagamento(id, usuario.id, input);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

export const reenviarParaPagamentoAction = comUsuarioAutenticado(
  async (usuario, id: string, formData: FormData) => {
    try {
      const input = await lerCamposEnviarPagamento(id, formData);
      await reenviarParaPagamento(id, usuario.id, input);
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);
