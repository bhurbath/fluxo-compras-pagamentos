export function ErroMensagem({ erro }: { erro?: string }) {
  if (!erro) return null;
  return <p className="text-red-600">{erro}</p>;
}
