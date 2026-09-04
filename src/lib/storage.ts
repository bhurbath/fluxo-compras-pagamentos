import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Anexos de solicitação (nota fiscal, comprovante de pagamento) — bucket
// privado, já que são documentos financeiros internos. A URL assinada
// (gerarUrlAssinada) é a única forma de acesso, e expira.
const BUCKET = "anexos-solicitacoes";

const EXTENSOES_PADRAO = ["pdf", "jpg", "jpeg", "png"];

// pt-BR readable join for the error message below — "PDF, JPG, PNG" or
// "PDF, JPG ou PNG" depending on how many.
function listaLegivel(extensoes: string[]): string {
  const maiusculas = extensoes.map((e) => e.toUpperCase());
  if (maiusculas.length <= 1) {
    return maiusculas.join("");
  }
  return `${maiusculas.slice(0, -1).join(", ")} ou ${maiusculas[maiusculas.length - 1]}`;
}

let client: SupabaseClient | undefined;

// O cliente do Storage manda essas variáveis cru nos cabeçalhos HTTP
// (Authorization/apikey) de toda requisição. Um caractere fora de Latin-1
// nelas (ex: um "•" colado sem querer ao configurar a variável na Vercel)
// derruba QUALQUER upload com "Cannot convert argument to a ByteString...",
// já visto duas vezes seguidas mesmo depois de duas correções no envio do
// arquivo em si — o que só faz sentido se o problema estiver aqui, não no
// arquivo. Falha cedo com uma mensagem que aponta a variável e a posição,
// em vez de deixar o erro genérico do fetch se espalhar.
function assertSomenteLatin1(nomeVariavel: string, valor: string) {
  for (let i = 0; i < valor.length; i++) {
    const codigo = valor.codePointAt(i)!;
    if (codigo > 255) {
      throw new Error(
        `A variável de ambiente ${nomeVariavel} tem um caractere inválido (código ${codigo}) ` +
          `na posição ${i} — provavelmente um caractere especial colado por engano ao configurar ` +
          `essa variável na Vercel. Corrija o valor em Project Settings > Environment Variables e ` +
          `faça um novo deploy.`
      );
    }
  }
}

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
    assertSomenteLatin1("SUPABASE_URL", url);
    assertSomenteLatin1("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
    client = createClient(url, serviceRoleKey);
  }
  return client;
}

// Envia um anexo (nota fiscal/comprovante) para o Storage, sob um caminho
// namespaced pela solicitação, e devolve esse caminho — não uma URL, já que
// o bucket é privado; quem exibe o anexo precisa gerar uma URL assinada
// (gerarUrlAssinada) na hora de renderizar.
export async function uploadAnexo(
  file: File,
  solicitacaoId: string,
  // Alguns anexos aceitam formatos além do padrão (ex.: os da despesa de
  // pessoal, que também aceitam CSV/Excel — ver lerCamposDespesaPessoal em
  // actions.ts) — cada chamador decide, o padrão continua o mesmo de antes.
  extensoesPermitidas: string[] = EXTENSOES_PADRAO
): Promise<string> {
  const extensao = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensoesPermitidas.includes(extensao)) {
    throw new Error(`Formato de arquivo não suportado. Envie um ${listaLegivel(extensoesPermitidas)}.`);
  }

  const caminho = `${solicitacaoId}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;
  // Manda os bytes crus (Buffer), não o File em si. O cliente do Storage
  // trata qualquer Blob/File como um caso especial: empacota numa
  // FormData e usa o nome do arquivo para montar um cabeçalho — e um nome
  // com "•" ou outro caractere fora de Latin-1 (comum em prints de tela)
  // derruba o upload inteiro com "Cannot convert argument to a
  // ByteString...". Um Buffer não é Blob/File, então o cliente cai no
  // caminho que manda os bytes direto, sem nunca tocar no nome do arquivo
  // — que também não é usado em nenhum outro lugar do sistema.
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await getStorageClient()
    .storage.from(BUCKET)
    .upload(caminho, bytes, { contentType: file.type || undefined });
  if (error) {
    throw new Error(`Falha ao enviar o arquivo: ${error.message}`);
  }
  return caminho;
}

// Gera uma URL temporária para um caminho já enviado (1 hora por padrão —
// suficiente pra uma visualização de página; um link indo por e-mail passa
// uma validade maior, já que pode ser aberto dias depois). Retorna null em
// caso de falha (ex: arquivo removido do bucket por fora) em vez de lançar
// — quem exibe o anexo trata isso como "link indisponível", não como um
// erro que derruba a página (ou o registro do pagamento) inteiro.
export async function gerarUrlAssinada(
  caminho: string,
  expiraEmSegundos = 60 * 60
): Promise<string | null> {
  const { data, error } = await getStorageClient()
    .storage.from(BUCKET)
    .createSignedUrl(caminho, expiraEmSegundos);
  if (error || !data) {
    return null;
  }
  return data.signedUrl;
}
