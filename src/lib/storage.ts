import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Anexos de solicitação (nota fiscal, comprovante de pagamento) — bucket
// privado, já que são documentos financeiros internos. A URL assinada
// (gerarUrlAssinada) é a única forma de acesso, e expira.
const BUCKET = "anexos-solicitacoes";

const EXTENSOES_PERMITIDAS = ["pdf", "jpg", "jpeg", "png"];

let client: SupabaseClient | undefined;

// Lazy singleton, mesmo padrão de src/lib/email/index.ts — construído no
// primeiro uso para não exigir as variáveis de ambiente em contextos (ex:
// testes do módulo workflow) que nunca de fato enviam um anexo.
function getStorageClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos para enviar anexos."
      );
    }
    client = createClient(url, serviceRoleKey);
  }
  return client;
}

// Envia um anexo (nota fiscal/comprovante) para o Storage, sob um caminho
// namespaced pela solicitação, e devolve esse caminho — não uma URL, já que
// o bucket é privado; quem exibe o anexo precisa gerar uma URL assinada
// (gerarUrlAssinada) na hora de renderizar.
export async function uploadAnexo(file: File, solicitacaoId: string): Promise<string> {
  const extensao = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    throw new Error("Formato de arquivo não suportado. Envie um PDF, JPG ou PNG.");
  }

  const caminho = `${solicitacaoId}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;
  const { error } = await getStorageClient()
    .storage.from(BUCKET)
    .upload(caminho, file, { contentType: file.type || undefined });
  if (error) {
    throw new Error(`Falha ao enviar o arquivo: ${error.message}`);
  }
  return caminho;
}

// Gera uma URL temporária (1 hora) para um caminho já enviado. Retorna null
// em caso de falha (ex: arquivo removido do bucket por fora) em vez de
// lançar — quem exibe o anexo trata isso como "link indisponível", não como
// um erro que derruba a página inteira.
export async function gerarUrlAssinada(caminho: string): Promise<string | null> {
  const { data, error } = await getStorageClient()
    .storage.from(BUCKET)
    .createSignedUrl(caminho, 60 * 60);
  if (error || !data) {
    return null;
  }
  return data.signedUrl;
}
