export function ErroMensagem({ erro }: { erro?: string }) {
  if (!erro) return null;
  return <p className="error-text">{erro}</p>;
}
