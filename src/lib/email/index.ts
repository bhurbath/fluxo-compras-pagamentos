import { GraphEmailSender } from "./graph-sender";
import type { EmailSender } from "./types";

export type { EmailMessage, EmailSender } from "./types";

let sender: EmailSender | undefined;

// Lazy singleton: constructed on first use so tests can substitute their own
// EmailSender (e.g. an in-memory fake) via setEmailSender before anything
// triggers the real Graph client.
export function getEmailSender(): EmailSender {
  if (!sender) {
    // Reuses the same Azure AD app registration as login, but reads the
    // tenant ID from its own dedicated var rather than parsing it out of
    // AUTH_MICROSOFT_ENTRA_ID_ISSUER: the issuer is allowed to be a
    // multi-tenant alias ("common"/"organizations") for login, which Graph's
    // client-credentials grant can't authenticate against — this needs a
    // concrete tenant regardless of how login is configured.
    const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;
    const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
    const clientSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;
    const mailbox = process.env.EMAIL_FROM;

    if (!tenantId || !clientId || !clientSecret || !mailbox) {
      throw new Error(
        "AUTH_MICROSOFT_ENTRA_ID_TENANT_ID, AUTH_MICROSOFT_ENTRA_ID_ID, " +
          "AUTH_MICROSOFT_ENTRA_ID_SECRET e EMAIL_FROM precisam estar definidos para enviar e-mails."
      );
    }

    sender = new GraphEmailSender(tenantId, clientId, clientSecret, mailbox);
  }

  return sender;
}

export function setEmailSender(customSender: EmailSender): void {
  sender = customSender;
}
