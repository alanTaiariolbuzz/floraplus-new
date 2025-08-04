import { Resend } from "resend";
import { EmailSender } from "@/src/backend/services/email/Sender";
// import { emailSendSuccessTotal, emailSendFailureTotal, emailLatencyMs } from './metrics';

export async function resolveTemplate(
  templateId: string,
  data: Record<string, unknown>
): Promise<{ subject: string; html: string }> {
  // Detectar el idioma del templateId (ej: "confirm.en" -> "en", "confirm" -> "es")
  const lang = templateId.includes(".")
    ? templateId.split(".").pop() || "es"
    : "es";
  const template = templateId.includes(".")
    ? templateId.split(".")[0]
    : templateId;

  let renderTemplate: (data: Record<string, unknown>) => {
    subject: string;
    html: string;
  };
  try {
    const mod = await import(
      `@/src/backend/templates/mails/${template}.${lang}`
    );
    renderTemplate = mod.default;
  } catch {
    const mod = await import(`@/src/backend/templates/mails/${template}`);
    renderTemplate = mod.default;
  }
  return renderTemplate(data);
}

export class ResendAdapter implements EmailSender {
  private client = new Resend(process.env.RESEND_API_KEY!);

  // BCC automático para backup de todos los emails enviados
  private readonly BACKUP_EMAIL = "backupfloraplus@gmail.com";

  async send(
    to: string[],
    templateId: string,
    data: Record<string, unknown>,
    options?: {
      from?: string;
      replyTo?: string;
      fromName?: string;
    }
  ): Promise<void> {
    // const end = emailLatencyMs.startTimer();
    try {
      const { subject, html } = await resolveTemplate(templateId, data);

      // Siempre usar no-reply@getfloraplus.com como from email
      const fromEmail = "no-reply@getfloraplus.com";

      // Configurar el from con nombre personalizado si está disponible
      let fromAddress = fromEmail;
      if (options?.fromName) {
        fromAddress = `${options.fromName} <${fromEmail}>`;
      }

      // Log del envío incluyendo BCC

      await this.client.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
        replyTo: options?.replyTo,
        bcc: [this.BACKUP_EMAIL],
      });
      // emailSendSuccessTotal.inc();
    } catch (err) {
      // emailSendFailureTotal.inc();
      throw err;
    } // finally {
    //   end();
    // }
  }
}
