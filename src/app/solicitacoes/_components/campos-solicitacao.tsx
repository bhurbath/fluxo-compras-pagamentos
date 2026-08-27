type Lista = { id: string; nome: string };

const FORMAS_PAGAMENTO = [
  { value: "ADIANTAMENTO", label: "Adiantamento" },
  { value: "A_VISTA", label: "À vista" },
  { value: "PARCELADO", label: "Parcelado" },
];

// Just the <label>/<input>/<select> fields, no <form> wrapper and no submit
// buttons — each page supplies its own <form action={...}> and button row,
// since /solicitacoes/nova needs two submit actions (rascunho/enviar) and
// the edit-after-rejection section on /solicitacoes/[id] needs only one
// (salvar e reenviar).
export function CamposSolicitacao({
  defaultValues,
  departamentos,
  tiposCompra,
  centrosCusto,
  centrosResultado,
  contasContabeis,
  empresas,
}: {
  defaultValues?: {
    descricao?: string;
    valor?: string;
    departamentoId?: string;
    tipoCompraId?: string;
    fornecedor?: string;
    formaPagamento?: string;
    centroCustoId?: string;
    centroResultadoId?: string;
    contaContabilId?: string;
    empresaId?: string;
    linkCompra?: string | null;
    informacoesComplementares?: string | null;
  };
  departamentos: Lista[];
  tiposCompra: Lista[];
  centrosCusto: Lista[];
  centrosResultado: Lista[];
  contasContabeis: Lista[];
  empresas: Lista[];
}) {
  return (
    <>
      <label className="flex flex-col gap-1">
        Descrição
        <textarea
          name="descricao"
          required
          defaultValue={defaultValues?.descricao}
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Valor (R$)
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultValues?.valor}
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Departamento
        <select
          name="departamentoId"
          defaultValue={defaultValues?.departamentoId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Tipo de compra
        <select
          name="tipoCompraId"
          defaultValue={defaultValues?.tipoCompraId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {tiposCompra.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Fornecedor
        <input
          name="fornecedor"
          type="text"
          required
          defaultValue={defaultValues?.fornecedor}
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Forma de pagamento
        <select
          name="formaPagamento"
          defaultValue={defaultValues?.formaPagamento ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Centro de custo
        <select
          name="centroCustoId"
          defaultValue={defaultValues?.centroCustoId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {centrosCusto.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Centro de resultado
        <select
          name="centroResultadoId"
          defaultValue={defaultValues?.centroResultadoId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {centrosResultado.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Conta contábil
        <select
          name="contaContabilId"
          defaultValue={defaultValues?.contaContabilId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {contasContabeis.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Empresa
        <select
          name="empresaId"
          defaultValue={defaultValues?.empresaId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Link da compra (opcional)
        <input
          name="linkCompra"
          type="text"
          defaultValue={defaultValues?.linkCompra ?? ""}
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Informações complementares (opcional)
        <textarea
          name="informacoesComplementares"
          defaultValue={defaultValues?.informacoesComplementares ?? ""}
          className="rounded border px-2 py-1"
        />
      </label>
    </>
  );
}
