import { createClient } from "@/utils/supabase/server";
import { logInfo } from "@/utils/error/logger";
import { PostgrestError } from "@supabase/supabase-js";

// Función para formatear precios en formato USD
function formatPrice(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

interface ReservaProps {
  reservaId: string;
  email: string;
  nombre: string;
  actividad?: string;
  fecha?: string;
  hora?: string;
  adicionales?: any[]; // ← por ahora no los usamos
  descuentoCodigo?: string | null; // ← idem
}

interface ConfirmEmailData {
  nombre: string;
  email: string;
  actividad: string;
  codigoReserva: string;
  fecha: string;
  participantes: number;
  tarifas: string[]; // Tarifas según idioma
  precioTotal: string;
  adicionales: string[]; // Adicionales según idioma
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  agenciaId: number;
  logoUrl?: string;
}

// Helper para formatear fecha y hora igual que en el frontend
function formatFechaHora(turno: any, language: string = "es") {
  if (!turno.fecha || !turno.hora_inicio) return "Fecha no disponible";
  const locale = language === "en" ? "en-US" : "es-ES";
  // Día y mes
  let fechaStr = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date(turno.fecha))
    .replace(/^\w/, (c) => c.toUpperCase());
  // Hora inicio
  let horaInicioStr = turno.hora_inicio.split("+")[0];
  let horaInicio = new Date(`2000-01-01T${horaInicioStr}`);
  let horaInicioFormateada = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(horaInicio)
    .replace(/a\.?m\.?/i, "AM")
    .replace(/p\.?m\.?/i, "PM");
  let result = `${fechaStr} - ${horaInicioFormateada}`;
  // Hora fin
  if (turno.hora_fin) {
    let horaFinStr = turno.hora_fin.split("+")[0];
    let horaFin = new Date(`2000-01-01T${horaFinStr}`);
    let horaFinFormateada = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .format(horaFin)
      .replace(/a\.?m\.?/i, "AM")
      .replace(/p\.?m\.?/i, "PM");
    result += ` - ${horaFinFormateada}`;
  }
  return result;
}

export async function getReservaDataForConfirmacion(
  reservaId: string,
  language: string = "es"
): Promise<ConfirmEmailData> {
  if (!reservaId) throw new Error("reservaId requerido");

  const db = await createClient();

  // ── consulta directa a las tablas ───────────────────────────────
  const { data: reserva, error: reservaError } = await db
    .from("reservas")
    .select(
      `
      *,
      turno:turnos (
        id,
        actividad_id,
        agencia_id,
        fecha,
        hora_inicio,
        hora_fin
      ),
      cliente:clientes (
        id,
        nombre,
        apellido,
        email,
        telefono
      ),
      agencia:agencias (
        id,
        nombre,
        nombre_comercial,
        email_contacto,
        telefono,
        telefono_departamento_reservas,
        email_departamento_reservas
      ),
      reserva_items:reserva_items (
        id,
        cantidad,
        item_type,
        item_id,
        descripcion,
        total,
        precio_unitario
      )
    `
    )
    .eq("id", reservaId)
    .single();

  if (reservaError) throw reservaError as PostgrestError;
  if (!reserva) throw new Error("reserva no encontrada");

  // ── obtener datos de pago ─────────────────────────────────────
  const { data: pagos, error: pagosError } = await db
    .from("pagos")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("created_at", { ascending: false });

  if (pagosError) {
    logInfo("Error obteniendo pagos", { reservaId, pagosError });
  }

  const data = {
    ...reserva,
    pago: pagos || [],
  };

  const cliente = (data as any).cliente ?? {};
  const turno = (data as any).turno ?? {};
  const agencia = (data as any).agencia ?? {};
  const reservaItems = (data as any).reserva_items ?? [];

  // ── log de reserva items ─────────────────────────────────────

  logInfo("Reserva items obtenidos", {
    reservaId,
    reservaItems,
    itemIds: reservaItems.map((item: any) => ({
      itemId: item.item_id,
      itemType: item.item_type,
      cantidad: item.cantidad,
      descripcion: item.descripcion,
    })),
  });

  // ── calcular participantes (solo tarifas) ─────────────────────
  const participantes = reservaItems
    .filter((item: any) => item.item_type === "tarifa")
    .reduce((total: number, item: any) => total + item.cantidad, 0);

  // ── obtener tarifas con nombres según idioma ──
  const tarifas = await Promise.all(
    reservaItems
      .filter((item: any) => item.item_type === "tarifa")
      .map(async (item: any) => {
        try {
          const { data: tarifaData } = await db
            .from("tarifas")
            .select("nombre, nombre_en")
            .eq("id", item.item_id)
            .single();

          if (tarifaData) {
            // Si es inglés y tiene nombre_en, usa nombre_en; si no, usa nombre
            const nombre =
              language === "en" && tarifaData.nombre_en
                ? tarifaData.nombre_en
                : tarifaData.nombre;

            return `${item.cantidad} ${nombre}`;
          }
        } catch (err) {
          logInfo("Error obteniendo nombre de tarifa", {
            itemId: item.item_id,
            err,
          });
        }
        // Fallback a la descripción original si no se puede obtener el nombre
        logInfo("Usando fallback para tarifa", {
          itemId: item.item_id,
          descripcion: item.descripcion,
        });
        return `${item.cantidad} ${item.descripcion}`;
      })
  );

  // ── obtener adicionales con nombres según idioma ──
  const adicionales = await Promise.all(
    reservaItems
      .filter(
        (item: any) =>
          item.item_type === "adicional" || item.item_type === "transporte"
      )
      .map(async (item: any) => {
        try {
          const { data: adicionalData } = await db
            .from("adicionales")
            .select("titulo, titulo_en")
            .eq("id", item.item_id)
            .single();

          if (adicionalData) {
            // Si es inglés y tiene titulo_en, usa titulo_en; si no, usa titulo
            const titulo =
              language === "en" && adicionalData.titulo_en
                ? adicionalData.titulo_en
                : adicionalData.titulo;

            return `${item.cantidad}x ${titulo}`;
          }
        } catch (err) {
          logInfo("Error obteniendo nombre de adicional", {
            itemId: item.item_id,
            err,
          });
        }
        // Fallback a la descripción original si no se puede obtener el nombre
        return `${item.cantidad}x ${item.descripcion}`;
      })
  );

  // ── formatear fecha y hora ────────────────────────────────────
  let fechaCompleta = "Fecha no disponible";
  if (turno.fecha && turno.hora_inicio) {
    fechaCompleta = formatFechaHora(turno, language);
  }

  // ── obtener título de la actividad ───────────────────────────
  let actividadTitulo = "Actividad";
  if (data.actividad_id) {
    try {
      const { data: actividadData } = await db
        .from("actividades")
        .select("titulo, titulo_en")
        .eq("id", data.actividad_id)
        .is("deleted_at", null)
        .single();

      if (actividadData) {
        actividadTitulo =
          language === "en" && actividadData.titulo_en
            ? actividadData.titulo_en
            : actividadData.titulo;
      }
    } catch (err) {
      logInfo("Error obteniendo título de actividad", {
        actividadId: data.actividad_id,
        err,
      });
    }
  }

  // ── obtener logo de la agencia ───────────────────────────────
  let logoUrl: string | undefined;
  try {
    const { data: correoData } = await db
      .from("correos")
      .select("logo_url")
      .eq("agencia_id", agencia.id)
      .single();

    if (correoData?.logo_url) {
      logoUrl = correoData.logo_url;
    }
  } catch (err) {
    logInfo("Error obteniendo logo de agencia", {
      agenciaId: agencia.id,
      err,
    });
  }

  // ── log ─────────────────────────────────────────────────────

  logInfo("getReservaDataForConfirmacion", {
    reservaId,
    data,
    pago: data.pago,
    montoTotal: data.monto_total,
    reservaItems,
    tarifas,
    adicionales,
    precioTotal: formatPrice(data.pago?.[0]?.amount ?? 0),
    language,
  });

  // ── salida ─────────────────────────────────────────────────
  const resultado = {
    nombre: cliente.nombre ?? "",
    email: cliente.email ?? "",
    actividad: actividadTitulo,
    codigoReserva: data.codigo_reserva ?? "",
    fecha: fechaCompleta,
    precioTotal: formatPrice(data.pago?.[0]?.amount ?? 0),
    participantes: participantes,
    tarifas: tarifas,
    adicionales: adicionales,
    telefonoContacto:
      agencia.telefono_departamento_reservas || agencia.telefono || "",
    correoContacto:
      agencia.email_departamento_reservas || agencia.email_contacto || "",
    nombreComercial: agencia.nombre_comercial ?? agencia.nombre ?? "Agencia",
    agenciaId: agencia.id,
    logoUrl,
  };

  return resultado;
}

interface RefundEmailData {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fecha: string; // fecha del reembolso
  participantes: number;
  precio: string;
  montoReembolsado: string;
  tipoReembolso: "Parcial" | "Completo";
  motivo: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  logoUrl?: string;
}

export async function getRefundDataForEmail(
  reservaId: string,
  refundAmount: number,
  reason?: string,
  tipoReembolso: "Parcial" | "Completo" = "Completo"
): Promise<RefundEmailData> {
  if (!reservaId) throw new Error("reservaId requerido");

  const db = await createClient();

  // ── consulta completa a la vista ───────────────────────────────
  const { data, error } = await db
    .from("reservas_detalle")
    .select(
      `
      id,
      actividad_id,
      monto_total,
      codigo_reserva,
      cliente,
      turno,
      agencia:agencias (
        id,
        nombre,
        nombre_comercial,
        email_contacto,
        telefono,
        telefono_departamento_reservas,
        email_departamento_reservas
      ),
      pago:pagos(
        id,
        amount,
        final_tax,
        final_fee
      ),
      reserva_items (
        id,
        cantidad,
        item_type,
        descripcion,
        total
      )
    `
    )
    .eq("id", reservaId)
    .single();

  if (error) throw error as PostgrestError;
  if (!data) throw new Error("reserva no encontrada");

  const cliente = (data as any).cliente ?? {};
  const turno = (data as any).turno ?? {};
  const agencia = (data as any).agencia ?? {};
  const reservaItems = (data as any).reserva_items ?? [];
  const pago = (data as any).pago?.[0] ?? {};

  // ── calcular participantes (solo tarifas) ─────────────────────
  const participantes = reservaItems
    .filter((item: any) => item.item_type === "tarifa")
    .reduce((total: number, item: any) => total + item.cantidad, 0);

  // ── obtener título de la actividad ───────────────────────────
  let actividadTitulo = "Actividad";
  if (data.actividad_id) {
    try {
      const { data: actividadData } = await db
        .from("actividades")
        .select("titulo")
        .eq("id", data.actividad_id)
        .is("deleted_at", null)
        .single();

      if (actividadData) {
        actividadTitulo = actividadData.titulo;
      }
    } catch (err) {
      logInfo("Error obteniendo título de actividad", {
        actividadId: data.actividad_id,
        err,
      });
    }
  }

  // ── formatear montos ─────────────────────────────────────────
  const montoReembolsado = formatPrice(refundAmount / 100);
  const precioOriginal = formatPrice(pago.amount || 0);

  // ── formatear fecha de la actividad ───────────────────────────
  let fechaActividad = "Fecha no disponible";
  if (turno.fecha && turno.hora_inicio) {
    fechaActividad = formatFechaHora(turno, "es");
  }

  // ── obtener logo de la agencia ───────────────────────────────
  let logoUrl: string | undefined;
  try {
    const { data: correoData } = await db
      .from("correos")
      .select("logo_url")
      .eq("agencia_id", agencia.id)
      .single();

    if (correoData?.logo_url) {
      logoUrl = correoData.logo_url;
    }
  } catch (err) {
    logInfo("Error obteniendo logo de agencia", {
      agenciaId: agencia.id,
      err,
    });
  }

  // ── log ─────────────────────────────────────────────────────
  logInfo("getRefundDataForEmail", {
    reservaId,
    refundAmount,
    tipoReembolso,
    motivo: reason,
  });

  // ── salida ─────────────────────────────────────────────────
  return {
    nombre: cliente.nombre ?? "",
    actividad: actividadTitulo,
    codigoReserva: data.codigo_reserva ?? "",
    fecha: fechaActividad,
    participantes: participantes,
    precio: precioOriginal,
    montoReembolsado: montoReembolsado,
    tipoReembolso,
    motivo: reason || "Cancelación de reserva",
    telefonoContacto:
      agencia.telefono_departamento_reservas || agencia.telefono || "",
    correoContacto:
      agencia.email_departamento_reservas || agencia.email_contacto || "",
    nombreComercial: agencia.nombre_comercial ?? agencia.nombre ?? "Agencia",
    logoUrl,
  };
}
