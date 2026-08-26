// Shared by every Server Action file that parses a plain <form> submission.
// Kept out of any "use server" file — those may only export async
// functions, so these helpers can't live alongside the actions that use
// them.

export function lerCampos<Chaves extends string>(
  formData: FormData,
  chaves: Chaves[]
): Record<Chaves, string> {
  const valores = {} as Record<Chaves, string>;
  for (const chave of chaves) {
    valores[chave] = String(formData.get(chave) ?? "").trim();
  }
  return valores;
}

export function exigirTodos(valores: Record<string, string>, mensagem: string): void {
  if (Object.values(valores).some((valor) => !valor)) {
    throw new Error(mensagem);
  }
}
