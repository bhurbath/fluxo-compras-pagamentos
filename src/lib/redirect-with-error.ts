import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Redirects back to `path` with the error message attached as a query
 * param, instead of throwing. Next.js redacts thrown Server Action error
 * messages by default in production — a friendly, hand-written message
 * (e.g. "já existe um departamento com esse nome") would never actually
 * reach the user, replaced by a generic "Application error" screen. Encoding
 * it in the redirect URL sidesteps that redaction entirely, since it never
 * goes through the thrown-error channel.
 */
export function redirectComErro(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Erro inesperado.";
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}

// Nome do cookie usado por redirectComErroPreservandoFormulario/
// lerFormularioPreservado, abaixo — só o formulário de solicitação usa isso
// por enquanto (ver CamposSolicitacao), daí o path restrito a /solicitacoes.
const COOKIE_FORMULARIO_PRESERVADO = "formulario_solicitacao_erro";

// Mesma ideia de redirectComErro acima, mas para formulários grandes
// (CamposSolicitacao tem ~40 campos): guarda os campos não-arquivo
// enviados num cookie de curta duração antes de redirecionar, para a
// página de destino conseguir reexibi-los já preenchidos em vez de deixar
// o usuário redigitar tudo. Cookie, não query string, porque o valor pode
// ser grande (descrição, informações complementares) e não faz sentido
// vazar isso pra URL. Curto (2 minutos): cobre com folga o round-trip de um
// envio que falhou, sem virar um estado obsoleto que reaparece se a pessoa
// voltar à mesma página bem depois por outro motivo — não há como limpar o
// cookie na leitura (Server Component não pode escrever cookie fora de uma
// Server Action/Route Handler), então a expiração curta é o mecanismo de
// limpeza. Campos de arquivo nunca são preserváveis (restrição do próprio
// navegador em <input type="file">.value) — são ignorados aqui de
// propósito, não por descuido.
//
// Duas funções, não uma só: preservarFormulario só grava o cookie e não
// mexe na navegação; quem chama sempre encadeia com redirectComErro logo
// em seguida (ver os três call sites em src/app/solicitacoes/actions.ts).
// Combinar as duas num único `async function ...: Promise<never>` parecia
// mais direto, mas o TypeScript não propaga a análise de fluxo "nunca
// retorna" através de um `await` numa Promise<never> do mesmo jeito que
// propaga para uma chamada síncrona de função `never` — o código depois
// ficava marcado como alcançável por engano. Chamar redirectComErro (que É
// síncrona e `never`) como a própria última instrução evita esse problema.
export async function preservarFormulario(formData: FormData): Promise<void> {
  const valores: Record<string, string> = {};
  for (const [nome, valor] of formData.entries()) {
    if (typeof valor === "string") {
      valores[nome] = valor;
    }
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_FORMULARIO_PRESERVADO, JSON.stringify(valores), {
    maxAge: 120,
    httpOnly: true,
    sameSite: "lax",
    path: "/solicitacoes",
  });
}

// Lido pela página que renderiza CamposSolicitacao (solicitacoes/nova e o
// painel de editar/reenviar) para reidratar o formulário com o que a
// pessoa acabou de digitar, quando o envio anterior falhou — ver
// redirectComErroPreservandoFormulario acima. undefined no fluxo normal
// (sem erro recente), quando CamposSolicitacao usa seus defaultValues
// habituais (derivados do banco, no caso de edição, ou vazios, no de
// criação).
export async function lerFormularioPreservado(): Promise<Record<string, string> | undefined> {
  const cookieStore = await cookies();
  const bruto = cookieStore.get(COOKIE_FORMULARIO_PRESERVADO)?.value;
  if (!bruto) {
    return undefined;
  }
  try {
    return JSON.parse(bruto) as Record<string, string>;
  } catch {
    return undefined;
  }
}
