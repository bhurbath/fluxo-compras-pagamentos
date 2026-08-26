# Setup do ambiente

Passo a passo para preencher as variáveis de `.env` (copie de `.env.example`).

## 1. Banco de dados (Postgres via Supabase)

Precisamos de duas connection strings do **mesmo** projeto Supabase: uma para o pooler em modo transação (`DATABASE_URL`, porta 6543 — usada pelo app em runtime) e uma para o pooler em modo sessão (`DIRECT_URL`, porta 5432 — usada por migrations, que precisam de prepared statements). No painel do projeto, clique em **"Connect"** → aba **"ORM"** → **Prisma**, e copie os dois valores prontos.

A conexão direta (IPv6-only) costuma não ser alcançável de ambientes sem rota IPv6 — use sempre a connection string do **pooler**.

O banco de testes **não é um projeto separado**: é o mesmo projeto, isolado no schema Postgres `"test"` em vez de `"public"`. Copie as mesmas duas URLs para `DATABASE_URL_TEST`/`DIRECT_URL_TEST`, adicionando `&schema=test` (ou `?schema=test` se a URL ainda não tiver `?`) no final.

Depois de preencher, rode:

```bash
npm run db:migrate       # aplica as migrations no schema "public" (dev)
npm run db:migrate:test  # aplica as mesmas migrations no schema "test"
```

## 2. Login Microsoft (Azure AD / Entra ID)

1. Acesse o [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Nome: "Fluxo de Compras e Pagamentos" (ou outro nome interno).
3. Em **Supported account types**, escolha "Accounts in this organizational directory only" (single tenant — é uma ferramenta interna, e o envio de e-mail via Graph no passo 3 exige um tenant concreto de qualquer forma).
4. Em **Redirect URI**, escolha "Web" e informe:
   - Desenvolvimento: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
   - Produção: `https://<seu-domínio>/api/auth/callback/microsoft-entra-id`
5. Depois de criado, na página **Overview**, copie:
   - **Application (client) ID** → `AUTH_MICROSOFT_ENTRA_ID_ID`
   - **Directory (tenant) ID** → `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`
6. Em **Certificates & secrets** → **New client secret**, crie um segredo e copie o **Value** (não o Secret ID) → `AUTH_MICROSOFT_ENTRA_ID_SECRET`.
7. Gere o `AUTH_SECRET` localmente com:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

## 3. E-mail transacional (Microsoft Graph)

Reaproveita o mesmo app registrado no passo 2 — não é preciso criar conta em nenhum serviço terceiro.

1. No mesmo app (Azure Portal → App registrations → o app criado no passo 2) → **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions** → marque **Mail.Send** → **Add permissions**.
2. Clique em **"Grant admin consent for \<tenant\>"** (precisa de um administrador do tenant).
3. Defina `EMAIL_FROM` com uma caixa de e-mail real do tenant (ex: `ti@suaempresa.com.br`) — o app passa a poder enviar e-mail **como** essa caixa.

## 4. Acesso à área de administração (Financeiro)

Não existe tela para conceder a flag Financeiro (nada poderia conceder a primeira). Depois de fazer login pelo menos uma vez, rode:

```bash
npx tsx scripts/set-financeiro.ts seu-email@suaempresa.com.br
```

## 5. Deploy

Recomendado: [Vercel](https://vercel.com), que integra nativamente com Next.js.

1. Conecte o repositório no painel da Vercel.
2. Copie todas as variáveis de `.env` para as **Environment Variables** do projeto na Vercel (ajustando o Redirect URI no app registration para o domínio de produção — ver passo 2.4 acima).
3. Deploy.
