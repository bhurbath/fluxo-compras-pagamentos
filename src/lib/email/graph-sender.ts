import type { EmailMessage, EmailSender } from "./types";

const TOKEN_ENDPOINT = (tenantId: string) =>
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

const SEND_MAIL_ENDPOINT = (mailbox: string) =>
  `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/sendMail`;

/**
 * Sends mail via Microsoft Graph, authenticating as the app itself
 * (client-credentials flow) using the same Azure AD app registration as
 * login. Requires the app to have the Mail.Send application permission
 * (admin-consented), and `mailbox` to be a real mailbox in the tenant.
 */
// Refresh this many seconds before actual expiry, so a token that's about
// to expire mid-request never gets handed out.
const TOKEN_REFRESH_MARGIN_SECONDS = 300;

export class GraphEmailSender implements EmailSender {
  private cachedToken: { value: string; expiresAt: number } | undefined;

  constructor(
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
    private mailbox: string
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const response = await fetch(TOKEN_ENDPOINT(this.tenantId), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Falha ao obter token do Microsoft Graph: ${response.status} ${await response.text()}`
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.cachedToken = {
      value: data.access_token,
      expiresAt:
        Date.now() + (data.expires_in - TOKEN_REFRESH_MARGIN_SECONDS) * 1000,
    };

    return this.cachedToken.value;
  }

  async send(message: EmailMessage): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(SEND_MAIL_ENDPOINT(this.mailbox), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: message.subject,
          body: { contentType: "HTML", content: message.html },
          toRecipients: [{ emailAddress: { address: message.to } }],
        },
        saveToSentItems: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Falha ao enviar e-mail via Microsoft Graph: ${response.status} ${await response.text()}`
      );
    }
  }
}
