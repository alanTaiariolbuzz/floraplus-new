import { getReservaDataForConfirmacion } from "@/src/backend/services/email/Service";
import { sendEmail, getCorreoConfig } from "@/utils/email/service";
import { logInfo, logError } from "@/utils/error/logger";
import { updateReservaToConfirmed } from "@/utils/stripe/db";

/* ---------- Tipado ---------- */
interface ReservaProps {
  reservaId: string;
  email: string;
  nombre: string;
  actividad?: string;
  fecha?: string;
  hora?: string;
  adicionales?: any[];
  descuentoCodigo?: string | null;
}

/* ---------- Utilidad para encolar tareas sin bloquear el webhook ---------- */
const enqueue =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (fn: () => void) => Promise.resolve().then(fn);

/* ---------- Handler principal ---------- */
export const handleReservaConfirmada = async (
  reservaId: string,
  language?: string
): Promise<{ success: boolean; message: string }> => {
  let props: any;

  /* ---- Fetch ---- */
  try {
    props = await getReservaDataForConfirmacion(reservaId, language);

    // Agregar log de debug
    logInfo("Datos obtenidos para confirmación de reserva", {
      reservaId,
      email: props.email,
      nombre: props.nombre,
      actividad: props.actividad,
      language,
    });
  } catch (err) {
    logError("Error obteniendo datos de reserva", { reservaId, err });
    return { success: false, message: "Error obteniendo datos" };
  }

  if (!props.email) {
    logError("Reserva sin email", { reservaId });
    return { success: false, message: "Sin email de contacto" };
  }

  //actualizar reserva en la base de datos a confirmed
  try {
    await updateReservaToConfirmed(reservaId);
  } catch (error) {
    logError("Error actualizando reserva a confirmed", { reservaId, error });
    // return { success: false, message: 'Error actualizando reserva' };
  }

  /* ---- fire-and-forget ---- */

  // Log para debuggear qué datos se están pasando
  logInfo("Datos que se pasan al template", {
    reservaId,
    props,
    templateData: {
      nombre: props.nombre,
      actividad: props.actividad,
      codigoReserva: props.codigoReserva,
      fecha: props.fecha,
      participantes: props.participantes,
      tarifas: props.tarifas,
      precioBase: props.precioBase,
      tax: props.tax,
      convenienceFee: props.convenienceFee,
      precioTotal: props.precioTotal,
      adicionales: props.adicionales,
      telefonoContacto: props.telefonoContacto,
      correoContacto: props.correoContacto,
      nombreComercial: props.nombreComercial,
      logoUrl: props.logoUrl,
    },
  });

  // Obtener configuración de correos de la agencia
  let correoConfig: {
    emailFrom?: string;
    emailReplyTo?: string;
    logoUrl?: string;
  } = {};
  try {
    correoConfig = await getCorreoConfig(props.agenciaId);
  } catch (correoError) {
    logError(correoError, {
      context: "reservaConfirmada",
      reservaId,
      agenciaId: props.agenciaId,
      message: "Error al obtener configuración de correos para email",
    });
  }

  // Agregar log antes de enviar email
  logInfo("Intentando enviar email de confirmación", {
    reservaId,
    email: props.email,
    template: language === "en" ? "confirm.en" : "confirm",
    language,
  });

  await sendEmail({
    to: props.email,
    subject: "Reserva confirmada",
    template: language === "en" ? "confirm.en" : "confirm",
    replyTo: correoConfig.emailReplyTo,
    fromName: correoConfig.emailFrom || props.nombreComercial,
    agencia_id: props.agenciaId,
    reserva_id: parseInt(reservaId),
    template_name: language === "en" ? "confirm.en" : "confirm",
    data: {
      nombre: props.nombre,
      actividad: props.actividad,
      codigoReserva: props.codigoReserva,
      fecha: props.fecha,
      participantes: props.participantes,
      tarifas: props.tarifas,
      precioBase: props.precioBase,
      tax: props.tax,
      convenienceFee: props.convenienceFee,
      precioTotal: props.precioTotal,
      adicionales: props.adicionales,
      telefonoContacto: props.telefonoContacto,
      correoContacto: props.correoContacto,
      nombreComercial: props.nombreComercial,
      logoUrl: props.logoUrl,
      ...correoConfig,
    },
  }).catch((e) =>
    logError("Error enviando confirmación", {
      reservaId,
      email: props.email,
      e,
    })
  );

  logInfo("Confirmación de reserva encolada", {
    reservaId,
    email: props.email,
  });
  return { success: true, message: "Email de confirmación encolado" };
};
