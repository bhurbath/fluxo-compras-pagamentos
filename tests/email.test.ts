import { describe, expect, it } from "vitest";
import { getEmailSender, setEmailSender } from "@/lib/email";
import type { EmailMessage } from "@/lib/email";

class FakeEmailSender {
  sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}

describe("infraestrutura de e-mail", () => {
  it("permite substituir o sender real por um fake nos testes", async () => {
    const fake = new FakeEmailSender();
    setEmailSender(fake);

    await getEmailSender().send({
      to: "solicitante@empresa.com.br",
      subject: "Solicitação enviada",
      html: "<p>Sua solicitação foi enviada.</p>",
    });

    expect(fake.sent).toHaveLength(1);
    expect(fake.sent[0].to).toBe("solicitante@empresa.com.br");
  });
});
