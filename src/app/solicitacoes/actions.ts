"use server";

import { redirect } from "next/navigation";
import { comUsuarioAutenticado } from "@/lib/require-usuario";
import { redirectComErro } from "@/lib/redirect-with-error";
import { toFriendlyError } from "@/lib/prisma-errors";
import { exigirTodos, lerCampos } from "@/lib/form-helpers";
import { uploadAnexo } from "@/lib/storage";
import { obterTipoCompra } from "@/lib/tipos-compra";
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

// Um <input type="file" multiple> manda um File por entrada repetida sob o
// mesmo name — formData.getAll() (não .get(), que só pega a primeira) é o
// jeito de ler todas. Faz o upload de cada uma em paralelo.
async function lerArquivos(formData: FormData, name: string, solicitacaoId: string): Promise<string[]> {
  const arquivos = formData
    .getAll(name)
    .filter((valor): valor is File => valor instanceof File && valor.size > 0);
  return Promise.all(arquivos.map((arquivo) => uploadAnexo(arquivo, solicitacaoId)));
}

// Anexos já existentes (edição de uma solicitação sem compra rejeitada, sem
// reenvio de novos arquivos) — ver editarEReenviarAction. Sem isso o
// solicitante seria obrigado a reanexar a mesma documentação a cada
// correção, já que um <input type="file"> nunca vem pré-preenchido. Quando
// vem pelo menos um arquivo novo, ele substitui o conjunto anterior inteiro
// (não acumula) — mesmo padrão que um <input multiple> já sugere ao usuário.
async function lerCamposSemCompra(
  formData: FormData,
  solicitacaoId: string,
  notaFiscalUrlsAtuais: string[]
): Promise<Pick<CriarSolicitacaoInput, "metodoPagamento" | "dadosPagamento" | "fornecedorDocumento" | "notaFiscalUrls">> {
  const campos = lerCampos(formData, ["metodoPagamento", "dadosPagamento", "fornecedorDocumento"]);
  exigirTodos(
    campos,
    "Método de pagamento, dados de pagamento e CNPJ/CPF do fornecedor são obrigatórios " +
      "para uma solicitação sem compra."
  );

  const enviados = await lerArquivos(formData, "notaFiscal", solicitacaoId);
  const notaFiscalUrls = enviados.length > 0 ? enviados : notaFiscalUrlsAtuais;
  if (notaFiscalUrls.length === 0) {
    throw new Error("A documentação (nota fiscal/guia) é obrigatória para uma solicitação sem compra.");
  }

  return {
    notaFiscalUrls,
    metodoPagamento: campos.metodoPagamento as MetodoPagamento,
    dadosPagamento: campos.dadosPagamento,
    fornecedorDocumento: campos.fornecedorDocumento,
  };
}

// Cotação/orçamento — opcional e independente de semCompra (apoia a decisão
// do aprovador, não é a documentação fiscal da compra em si). Mesmo padrão
// de "mantém o anexo atual se nenhum arquivo novo vier" que lerCamposSemCompra
// usa para notaFiscal, para não obrigar reanexar a cada edição.
async function lerCotacaoUrl(
  formData: FormData,
  solicitacaoId: string,
  cotacaoUrlAtual: string | null
): Promise<string | null> {
  const cotacao = formData.get("cotacao");
  if (cotacao instanceof File && cotacao.size > 0) {
    return uploadAnexo(cotacao, solicitacaoId);
  }
  return cotacaoUrlAtual;
}

// Despesa de pessoal (ver TipoCompra.despesaPessoal) — campos próprios, bem
// mais enxutos que o resto do formulário. Mesmo padrão de "mantém o anexo
// atual se nenhum arquivo novo vier" que lerCamposSemCompra usa.
async function lerCamposDespesaPessoal(
  formData: FormData,
  solicitacaoId: string,
  notaFiscalUrlsAtuais: string[]
): Promise<
  Pick<
    CriarSolicitacaoInput,
    "categoriaDespesaPessoalId" | "numeroPedido" | "dataVencimento" | "dadosPagamento" | "notaFiscalUrls"
  >
> {
  const campos = lerCampos(formData, [
    "categoriaDespesaPessoalId",
    "numeroPedido",
    "dataVencimento",
    "dadosPagamentoDespesa",
  ]);
  const enviados = await lerArquivos(formData, "notaFiscal", solicitacaoId);
  return {
    categoriaDespesaPessoalId: campos.categoriaDespesaPessoalId || null,
    numeroPedido: campos.numeroPedido || null,
    dataVencimento: campos.dataVencimento || null,
    dadosPagamento: campos.dadosPagamentoDespesa || null,
    notaFiscalUrls: enviados.length > 0 ? enviados : notaFiscalUrlsAtuais,
  };
}

// RDV (ver TipoCompra.rdv) — prestação de contas de reembolso, campos
// próprios e diferentes dos de despesa de pessoal. Mesmo padrão de "mantém
// o anexo atual se nenhum arquivo novo vier" que lerCamposSemCompra usa.
async function lerCamposRdv(
  formData: FormData,
  solicitacaoId: string,
  notaFiscalUrlsAtuais: string[]
): Promise<
  Pick<
    CriarSolicitacaoInput,
    "valorCartaoOnfly" | "dataRdv" | "numeroRdv" | "possuiAdiantamento" | "notaFiscalUrls"
  >
> {
  const campos = lerCampos(formData, ["valorCartaoOnfly", "dataRdv", "numeroRdv"]);
  const enviados = await lerArquivos(formData, "notaFiscal", solicitacaoId);
  return {
    valorCartaoOnfly: campos.valorCartaoOnfly || null,
    dataRdv: campos.dataRdv || null,
    numeroRdv: campos.numeroRdv || null,
    possuiAdiantamento: formData.get("possuiAdiantamento") === "on",
    notaFiscalUrls: enviados.length > 0 ? enviados : notaFiscalUrlsAtuais,
  };
}

// O departamento nunca vem do formulário: cada funcionário já tem um
// departamento fixo no cadastro (ver /admin/funcionarios), então a
// solicitação sempre herda o do solicitante — nunca é uma escolha dele. Qual
// conjunto de campos ler (padrão ou despesa de pessoal) depende do tipo de
// compra escolhido, não de uma opção do próprio formulário — ver
// TipoCompra.despesaPessoal.
async function parseSolicitacaoForm(
  usuario: Usuario,
  formData: FormData,
  // Usado só como prefixo do caminho no Storage quando há upload de anexo
  // (cotação, ou a documentação de uma solicitação sem compra/despesa de
  // pessoal) — ver uploadAnexo em src/lib/storage.ts. Uma solicitação nova
  // ainda não tem id nesse ponto, daí o placeholder.
  solicitacaoIdParaAnexo: string,
  notaFiscalUrlsAtuais: string[] = [],
  cotacaoUrlAtual: string | null = null
): Promise<CriarSolicitacaoInput> {
  if (!usuario.departamentoId) {
    throw new Error(
      "Seu usuário ainda não tem um departamento definido — peça ao Financeiro para " +
        "configurar isso em Cadastros > Funcionários antes de criar uma solicitação."
    );
  }

  const campos = lerCampos(formData, ["descricao", "valor", "tipoCompraId"]);
  exigirTodos(campos, "Descrição, valor e tipo de compra são obrigatórios.");

  // Fornecedor e empresa não são exigidos aqui: dependem do tipo de compra
  // (TipoCompra.dispensaFornecedorForma/empresaFixaId — ex.: Mercado
  // Livre), que só o workflow sabe decidir (ver validarCriarSolicitacao em
  // src/lib/workflow.ts).
  const opcionaisTopo = lerCampos(formData, ["fornecedor", "empresaId"]);
  const opcionais = lerCampos(formData, ["linkCompra", "informacoesComplementares"]);
  const cotacaoUrl = await lerCotacaoUrl(formData, solicitacaoIdParaAnexo, cotacaoUrlAtual);

  const base = {
    solicitanteId: usuario.id,
    descricao: campos.descricao,
    valor: campos.valor,
    departamentoId: usuario.departamentoId,
    tipoCompraId: campos.tipoCompraId,
    fornecedor: opcionaisTopo.fornecedor || null,
    empresaId: opcionaisTopo.empresaId || null,
    informacoesComplementares: opcionais.informacoesComplementares || null,
  };

  const tipoCompra = await obterTipoCompra(campos.tipoCompraId);
  if (tipoCompra?.despesaPessoal) {
    return {
      ...base,
      ...(await lerCamposDespesaPessoal(formData, solicitacaoIdParaAnexo, notaFiscalUrlsAtuais)),
    };
  }
  if (tipoCompra?.rdv) {
    return {
      ...base,
      ...(await lerCamposRdv(formData, solicitacaoIdParaAnexo, notaFiscalUrlsAtuais)),
    };
  }

  const padrao = lerCampos(formData, [
    "formaPagamento",
    "centroCustoId",
    "centroResultadoId",
    "contaContabilId",
  ]);
  exigirTodos(
    { centroCustoId: padrao.centroCustoId, centroResultadoId: padrao.centroResultadoId, contaContabilId: padrao.contaContabilId },
    "Centro de custo, centro de resultado e conta contábil são obrigatórios."
  );
  const semCompra = formData.get("semCompra") === "on";

  return {
    ...base,
    formaPagamento: (padrao.formaPagamento || null) as FormaPagamento | null,
    centroCustoId: padrao.centroCustoId,
    centroResultadoId: padrao.centroResultadoId,
    contaContabilId: padrao.contaContabilId,
    linkCompra: opcionais.linkCompra || null,
    cotacaoUrl,
    semCompra,
    ...(semCompra
      ? await lerCamposSemCompra(formData, solicitacaoIdParaAnexo, notaFiscalUrlsAtuais)
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
      const input = await parseSolicitacaoForm(
        usuario,
        formData,
        id,
        atual?.notaFiscalUrls ?? [],
        atual?.cotacaoUrl ?? null
      );
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
  async (usuario, id: string, formData: FormData) => {
    try {
      const previsaoChegada = String(formData.get("previsaoChegada") ?? "").trim() || null;
      await confirmarCompra(id, usuario.id, { previsaoChegada });
    } catch (error) {
      redirectComErro(`/solicitacoes/${id}`, toFriendlyError(error));
    }

    redirect(`/solicitacoes/${id}`);
  }
);

// Compartilhado por enviarParaPagamentoAction e reenviarParaPagamentoAction
// — mesmos campos, mesmo upload; só a função do workflow que cada uma chama
// depois muda (qual status de origem é aceito). A obrigatoriedade de método/
// CNPJ-CPF do fornecedor não é checada aqui: depende de a solicitação ser
// uma despesa de pessoal ou não (ver processarEnvioPagamento em
// src/lib/workflow.ts), que só o workflow sabe decidir.
async function lerCamposEnviarPagamento(
  id: string,
  formData: FormData
): Promise<EnviarParaPagamentoInput> {
  const campos = lerCampos(formData, [
    "metodoPagamento",
    "dadosPagamento",
    "fornecedorDocumento",
  ]);

  const notaFiscalUrls = await lerArquivos(formData, "notaFiscal", id);
  if (notaFiscalUrls.length === 0) {
    throw new Error("A nota fiscal/comprovante da compra é obrigatória.");
  }

  return {
    notaFiscalUrls,
    metodoPagamento: (campos.metodoPagamento || null) as MetodoPagamento | null,
    dadosPagamento: campos.dadosPagamento || null,
    fornecedorDocumento: campos.fornecedorDocumento || null,
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
