import { Resend } from "resend";
import { ResendAdapter } from "./resendAdapter";
import { EmailSender } from "@/src/backend/services/email/Sender";
import { logInfo, logError } from "@/utils/error/logger";
import { createAdminClient } from "@/utils/supabase/admin";
import { trackEmailSent, EmailTrackingData } from "./tracking";

const provider =
  process.env.EMAIL_PROVIDER === "postmark" ? "postmark" : "resend";

const templateSender: EmailSender = new ResendAdapter();

const rawClient = new Resend(process.env.RESEND_API_KEY!);

// BCC automático para backup de todos los emails enviados
const BACKUP_EMAIL = "backupfloraplus@gmail.com";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, unknown>;
  textBody?: string;
  htmlBody?: string;
  from?: string;
  replyTo?: string;
  fromName?: string;
  // Parámetros para tracking
  agencia_id?: number;
  reserva_id?: number;
  template_name?: string;
}

export interface CorreoConfig {
  logoUrl?: string;
  emailFrom?: string; // Nombre del remitente (ej: "Flora Plus")
  emailReplyTo?: string; // Email de respuesta (ej: "info@agencia.com")
}

export async function getCorreoConfig(
  agenciaId: number
): Promise<CorreoConfig> {
  try {
    const supabase = createAdminClient();
    const { data: correoData } = await supabase
      .from("correos")
      .select("email_from, email_reply_to, logo_url, logo_filename")
      .eq("agencia_id", agenciaId)
      .single();

    if (correoData) {
      return {
        logoUrl: correoData.logo_url,
        emailFrom: correoData.email_from,
        emailReplyTo: correoData.email_reply_to,
      };
    }
  } catch (error) {
    logError(error, {
      context: "getCorreoConfig",
      agenciaId,
      message: "Error al obtener configuración de correos",
    });
  }

  return {};
}

export async function sendEmail({
  to,
  subject,
  template,
  data = {},
  textBody,
  htmlBody,
  from,
  replyTo,
  fromName,
  agencia_id,
  reserva_id,
  template_name,
}: SendEmailParams): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  // Siempre usar no-reply@getfloraplus.com como from email
  const fromEmail = "no-reply@getfloraplus.com";

  // Configurar el from con nombre personalizado si está disponible
  let fromAddress = fromEmail;
  if (fromName) {
    fromAddress = `${fromName} <${fromEmail}>`;
  }

  // Log detallado para diagnosticar tracking
  logInfo("sendEmail iniciado", {
    to: recipients,
    subject,
    template,
    agencia_id,
    reserva_id,
    template_name,
    hasTrackingData: !!(agencia_id && template_name),
  });

  try {
    // Agregar log de debug para verificar configuración
    logInfo("Configuración del email service", {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      RESEND_API_KEY: process.env.RESEND_API_KEY
        ? "configurado"
        : "no configurado",
      EMAIL_FROM: process.env.EMAIL_FROM,
      provider,
    });

    logInfo("Enviando email", {
      to: recipients,
      subject,
      template,
      data,
      from: fromEmail,
      replyTo,
      fromName,
      bcc: BACKUP_EMAIL,
    });

    if (template) {
      logInfo("Usando template para enviar email", {
        template,
        provider,
      });
      await templateSender.send(recipients, template, data, {
        from: fromEmail,
        replyTo,
        fromName,
      });

      // Log después del envío exitoso
      logInfo("Email enviado exitosamente con template", {
        template,
        to: recipients,
      });
    } else {
      logInfo("Enviando email directo con Resend", {
        to: recipients,
        subject,
        from: fromEmail,
        replyTo,
      });

      await (rawClient as Resend).emails.send({
        from: fromAddress,
        to: recipients,
        subject,
        html: htmlBody,
        text: textBody || "", // Ensure text is always a string
        replyTo,
        bcc: [BACKUP_EMAIL],
      });

      // Log después del envío exitoso
      logInfo("Email enviado exitosamente con Resend directo", {
        to: recipients,
        subject,
      });
    }

    // Registrar el correo enviado si tenemos los datos necesarios
    if (agencia_id && template_name) {
      logInfo("Iniciando tracking de email", {
        agencia_id,
        template_name,
        reserva_id,
        email_to: recipients[0],
      });

      const trackingData: EmailTrackingData = {
        agencia_id,
        reserva_id,
        template_name,
        email_to: recipients[0], // Tomamos el primer destinatario
        email_from: fromAddress,
        subject,
        status: "enviado",
        metadata: {
          template,
          data,
          replyTo,
          fromName,
        },
      };

      // No esperamos a que termine el tracking para no bloquear el envío
      trackEmailSent(trackingData).catch((trackingError) => {
        logError("Error en tracking de email", {
          context: "sendEmail",
          trackingError,
          trackingData,
        });
      });

      logInfo("Tracking de email iniciado (async)", {
        agencia_id,
        template_name,
      });
    } else {
      logInfo("No se puede hacer tracking - faltan datos", {
        agencia_id: agencia_id || "undefined",
        template_name: template_name || "undefined",
        hasAgenciaId: !!agencia_id,
        hasTemplateName: !!template_name,
      });
    }
  } catch (error) {
    // Registrar el error en tracking si tenemos los datos necesarios
    if (agencia_id && template_name) {
      logInfo("Registrando error en tracking", {
        agencia_id,
        template_name,
        error: (error as Error).message,
      });

      const trackingData: EmailTrackingData = {
        agencia_id,
        reserva_id,
        template_name,
        email_to: recipients[0],
        email_from: fromAddress,
        subject,
        status: "fallido",
        error_message: (error as Error).message,
        metadata: {
          template,
          data,
          replyTo,
          fromName,
        },
      };

      trackEmailSent(trackingData).catch((trackingError) => {
        logError("Error en tracking de email fallido", {
          context: "sendEmail",
          trackingError,
          trackingData,
        });
      });
    }

    logError("Error enviando email", {
      to,
      subject,
      template,
      data,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new Error(`Error enviando email: ${(error as Error).message}`);
  }
}
