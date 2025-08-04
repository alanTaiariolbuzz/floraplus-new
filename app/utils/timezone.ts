/**
 * Utilidades para manejo de zonas horarias
 * Centraliza la lógica de conversión de fechas y horas según la zona horaria de la agencia
 */

// Mapeo de países a zonas horarias
const TIMEZONE_MAP: { [key: string]: string } = {
  CR: "America/Costa_Rica",
  ES: "Europe/Madrid",
  MX: "America/Mexico_City",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  CO: "America/Bogota",
  PE: "America/Lima",
  EC: "America/Guayaquil",
  PA: "America/Panama",
  GT: "America/Guatemala",
  SV: "America/El_Salvador",
  HN: "America/Tegucigalpa",
  NI: "America/Managua",
  VE: "America/Caracas",
  UY: "America/Montevideo",
  PY: "America/Asuncion",
  BO: "America/La_Paz",
  BR: "America/Sao_Paulo",
};

/**
 * Obtiene la zona horaria para un país específico
 * @param pais Código de país (ej: "CR", "ES")
 * @returns Zona horaria IANA
 */
export function getAgencyTimeZone(pais: string): string {
  return TIMEZONE_MAP[pais] || "UTC";
}

/**
 * Convierte una fecha local a la zona horaria de la agencia
 * @param fecha Fecha en formato YYYY-MM-DD
 * @param pais Código de país de la agencia
 * @returns Fecha en la zona horaria de la agencia
 */
export function convertDateToAgencyTimezone(fecha: string, pais: string): Date {
  const timezone = getAgencyTimeZone(pais);

  // Crear la fecha en la zona horaria de la agencia
  const agencyDate = new Date(`${fecha}T00:00:00`);

  // Convertir a la zona horaria específica
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const localDateString = agencyDate.toLocaleString("en-CA", options);
  return new Date(localDateString);
}

/**
 * Obtiene la fecha actual en la zona horaria de la agencia
 * @param pais Código de país de la agencia
 * @returns Fecha actual en la zona horaria de la agencia
 */
export function getCurrentDateInAgencyTimezone(pais: string): Date {
  const timezone = getAgencyTimeZone(pais);
  const now = new Date();

  // Convertir la hora actual a la zona horaria de la agencia
  const agencyNowString = now.toLocaleString("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return new Date(agencyNowString);
}

/**
 * Formatea una fecha para mostrar en la zona horaria de la agencia
 * @param fecha Fecha en formato YYYY-MM-DD
 * @param pais Código de país de la agencia
 * @param language Idioma para el formato
 * @returns Fecha formateada en la zona horaria de la agencia
 */
export function formatDateInAgencyTimezone(
  fecha: string,
  pais: string,
  language: "en" | "es" = "es"
): string {
  try {
    const timezone = getAgencyTimeZone(pais);

    // Validar que la fecha tenga el formato correcto
    if (!fecha || typeof fecha !== "string") {
      console.warn("formatDateInAgencyTimezone: fecha inválida", fecha);
      return "Fecha inválida";
    }

    // Limpiar la fecha si viene con formato ISO
    let cleanFecha = fecha;
    if (fecha.includes("T")) {
      cleanFecha = fecha.split("T")[0];
    }

    // Asegurar que la fecha esté en formato YYYY-MM-DD
    const dateParts = cleanFecha.split("-");
    if (dateParts.length !== 3) {
      console.warn(
        "formatDateInAgencyTimezone: formato de fecha inválido",
        fecha
      );
      return "Formato de fecha inválido";
    }

    // Crear la fecha de manera más segura
    const [year, month, day] = dateParts.map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexed months

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn("formatDateInAgencyTimezone: fecha no válida", fecha);
      return "Fecha no válida";
    }

    // Formatear la fecha en la zona horaria de la agencia
    const formatted = new Intl.DateTimeFormat(
      language === "en" ? "en-US" : "es-ES",
      {
        timeZone: timezone,
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    )
      .format(date)
      .replace(/^\w/, (c) => c.toUpperCase());

    return formatted;
  } catch (error) {
    console.error("Error en formatDateInAgencyTimezone:", error, {
      fecha,
      pais,
      language,
    });
    // TEMPORAL: Retornar un formato básico si hay error
    try {
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date
          .toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
          .replace(/^\w/, (c) => c.toUpperCase());
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
    return "Error al formatear fecha";
  }
}

/**
 * Formatea una hora para mostrar en la zona horaria de la agencia
 * @param hora Hora en formato HH:MM
 * @param pais Código de país de la agencia
 * @param language Idioma para el formato
 * @returns Hora formateada en formato 12 horas
 */
export function formatTimeInAgencyTimezone(
  hora: string,
  pais: string,
  language: "en" | "es" = "es"
): string {
  try {
    const timezone = getAgencyTimeZone(pais);

    // Validar que la hora tenga el formato correcto
    if (!hora || typeof hora !== "string") {
      console.warn("formatTimeInAgencyTimezone: hora inválida", hora);
      return "Hora inválida";
    }

    // Limpiar la hora si viene con formato ISO o timezone
    let cleanHora = hora;
    if (hora.includes("+")) {
      cleanHora = hora.split("+")[0];
    }
    if (cleanHora.includes("T")) {
      cleanHora = cleanHora.split("T")[1];
    }

    // Validar formato HH:MM o HH:MM:SS
    const timeParts = cleanHora.split(":");
    if (timeParts.length < 2 || timeParts.length > 3) {
      console.warn(
        "formatTimeInAgencyTimezone: formato de hora inválido",
        hora
      );
      return "Formato de hora inválido";
    }

    const [hours, minutes] = timeParts.map(Number);

    // Validar rangos
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      console.warn(
        "formatTimeInAgencyTimezone: valores de hora fuera de rango",
        { hours, minutes }
      );
      return "Hora fuera de rango";
    }

    // Crear una fecha con la hora específica de manera más segura
    const date = new Date(2000, 0, 1, hours, minutes, 0); // Usar constructor con parámetros individuales

    // Formatear la hora en la zona horaria de la agencia
    const formattedTime = new Intl.DateTimeFormat(
      language === "en" ? "en-US" : "es-ES",
      {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    ).format(date);

    const result = formattedTime
      .replace(/a\.?m\.?/i, "AM")
      .replace(/p\.?m\.?/i, "PM");

    return result;
  } catch (error) {
    console.error("Error en formatTimeInAgencyTimezone:", error, {
      hora,
      pais,
      language,
    });
    // TEMPORAL: Retornar un formato básico si hay error
    try {
      // Intentar diferentes formatos de hora
      let timeString = hora;

      // Si viene con formato ISO completo, extraer solo la hora
      if (hora.includes("T")) {
        timeString = hora.split("T")[1];
      }

      // Si viene con timezone, removerlo
      if (timeString.includes("+")) {
        timeString = timeString.split("+")[0];
      }

      const timeParts = timeString.split(":");
      if (timeParts.length === 2) {
        const [hours, minutes] = timeParts.map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const date = new Date(2000, 0, 1, hours, minutes, 0);
          return date
            .toLocaleTimeString(language === "en" ? "en-US" : "es-ES", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .replace(/a\.?m\.?/i, "AM")
            .replace(/p\.?m\.?/i, "PM");
        }
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
    return "Error al formatear hora";
  }
}

/**
 * Verifica si una fecha y hora están en el pasado según la zona horaria de la agencia
 * @param fecha Fecha en formato YYYY-MM-DD
 * @param hora Hora en formato HH:MM
 * @param pais Código de país de la agencia
 * @returns true si la fecha/hora está en el pasado
 */
export function isDateTimeInPast(
  fecha: string,
  hora: string,
  pais: string
): boolean {
  try {
    const timezone = getAgencyTimeZone(pais);
    const now = new Date();

    // Validar fecha y hora
    if (!fecha || !hora) {
      console.warn("isDateTimeInPast: fecha o hora inválida", { fecha, hora });
      return false;
    }

    // Limpiar la fecha si viene con formato ISO
    let cleanFecha = fecha;
    if (fecha.includes("T")) {
      cleanFecha = fecha.split("T")[0];
    }

    // Limpiar la hora si viene con formato ISO o timezone
    let cleanHora = hora;
    if (hora.includes("+")) {
      cleanHora = hora.split("+")[0];
    }
    if (cleanHora.includes("T")) {
      cleanHora = cleanHora.split("T")[1];
    }

    // Crear la fecha y hora del turno de manera más segura
    const dateParts = cleanFecha.split("-");
    const timeParts = cleanHora.split(":");

    if (
      dateParts.length !== 3 ||
      timeParts.length < 2 ||
      timeParts.length > 3
    ) {
      console.warn("isDateTimeInPast: formato inválido", { fecha, hora });
      return false;
    }

    const [year, month, day] = dateParts.map(Number);
    const [hours, minutes] = timeParts.map(Number);

    const turnoDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    if (isNaN(turnoDateTime.getTime())) {
      console.warn("isDateTimeInPast: fecha/hora no válida", { fecha, hora });
      return false;
    }

    // Obtener la hora actual en la zona horaria de la agencia
    const agencyNowString = now.toLocaleString("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const agencyNow = new Date(agencyNowString);

    return turnoDateTime <= agencyNow;
  } catch (error) {
    console.error("Error en isDateTimeInPast:", error, { fecha, hora, pais });
    return false;
  }
}

/**
 * Formatea una fecha para mostrar (SIN conversión de timezone)
 * Muestra la fecha tal como fue cargada por la agencia
 * @param fecha Fecha en formato YYYY-MM-DD
 * @param language Idioma para el formato
 * @returns Fecha formateada
 */
export function formatDisplayDate(
  fecha: string,
  language: "en" | "es" = "es"
): string {
  try {
    // Limpiar la fecha si viene con formato ISO
    let cleanFecha = fecha;
    if (fecha.includes("T")) {
      cleanFecha = fecha.split("T")[0];
    }

    // Crear la fecha usando componentes individuales
    const [year, month, day] = cleanFecha.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Formatear sin especificar timezone para mostrar exactamente como lo cargó la agencia
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-ES", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
      .format(date)
      .replace(/^\w/, (c) => c.toUpperCase());
  } catch (error) {
    console.error("Error en formatDisplayDate:", error, { fecha });
    return fecha;
  }
}

/**
 * Formatea una hora para mostrar (SIN conversión de timezone)
 * Muestra la hora tal como fue cargada por la agencia
 * @param hora Hora en formato HH:MM
 * @param language Idioma para el formato
 * @returns Hora formateada
 */
export function formatDisplayTime(
  hora: string,
  language: "en" | "es" = "es"
): string {
  try {
    // Limpiar la hora si viene con formato ISO o timezone
    let cleanHora = hora;
    if (hora.includes("+")) {
      cleanHora = hora.split("+")[0];
    }
    if (cleanHora.includes("T")) {
      cleanHora = cleanHora.split("T")[1];
    }

    const [hours, minutes] = cleanHora.split(":").map(Number);

    // Crear una fecha simple sin timezone
    const date = new Date(2000, 0, 1, hours, minutes, 0);

    // Formatear sin especificar timezone para mostrar exactamente como lo cargó la agencia
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-ES", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
      .format(date)
      .replace(/a\.?m\.?/i, "AM")
      .replace(/p\.?m\.?/i, "PM");
  } catch (error) {
    console.error("Error en formatDisplayTime:", error, { hora });
    return hora;
  }
}

/**
 * Obtiene la hora actual en la zona horaria de la agencia
 * @param agenciaTimezone Zona horaria de la agencia (ej: "America/Costa_Rica")
 * @returns Fecha actual en la zona horaria de la agencia
 */
export function getCurrentTimeInAgencyTimezone(agenciaTimezone: string): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: agenciaTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const p = (t: string) => Number(parts.find((x) => x.type === t)!.value);

  // Crear una fecha que represente la hora actual en la zona horaria de la agencia
  // pero como si fuera en UTC para que la comparación sea correcta
  const agencyDate = new Date(
    Date.UTC(
      p("year"),
      p("month") - 1,
      p("day"),
      p("hour"),
      p("minute"),
      p("second")
    )
  );

  return agencyDate;
}

/**
 * Verifica si un turno está disponible comparando con la hora actual de la agencia
 * @param fecha Fecha del turno en formato YYYY-MM-DD
 * @param hora Hora del turno en formato HH:MM
 * @param agenciaTimezone Zona horaria de la agencia (ej: "America/Costa_Rica")
 * @returns true si el turno está disponible (no ha pasado)
 */
export function isTurnoAvailable(
  fecha: string,
  hora: string,
  agenciaTimezone: string
): boolean {
  try {
    const [y, m, d] = fecha.split("T")[0].split("-").map(Number);
    const [h, min] = hora.split(":").map(Number);

    // Crear la fecha del turno en la zona horaria de la agencia
    const turnoDate = new Date(Date.UTC(y, m - 1, d, h, min));

    // Obtener la hora actual en la zona horaria de la agencia
    const agencyNow = getCurrentTimeInAgencyTimezone(agenciaTimezone);

    return turnoDate > agencyNow;
  } catch (e) {
    console.error("Error en isTurnoAvailable:", e, {
      fecha,
      hora,
      agenciaTimezone,
    });
    return false;
  }
}

/**
 * Calcula la diferencia en minutos entre una fecha/hora y ahora en la zona horaria de la agencia
 * @param fecha Fecha en formato YYYY-MM-DD
 * @param hora Hora en formato HH:MM
 * @param pais Código de país de la agencia
 * @returns Diferencia en minutos (positiva si está en el futuro, negativa si está en el pasado)
 */
export function getMinutesDifference(
  fecha: string,
  hora: string,
  pais: string
): number {
  try {
    const timezone = getAgencyTimeZone(pais);
    const now = new Date();

    // Validar fecha y hora
    if (!fecha || !hora) {
      console.warn("getMinutesDifference: fecha o hora inválida", {
        fecha,
        hora,
      });
      return 0;
    }

    // Limpiar la fecha si viene con formato ISO
    let cleanFecha = fecha;
    if (fecha.includes("T")) {
      cleanFecha = fecha.split("T")[0];
    }

    // Limpiar la hora si viene con formato ISO o timezone
    let cleanHora = hora;
    if (hora.includes("+")) {
      cleanHora = hora.split("+")[0];
    }
    if (cleanHora.includes("T")) {
      cleanHora = cleanHora.split("T")[1];
    }

    // Crear la fecha y hora del turno de manera más segura
    const dateParts = cleanFecha.split("-");
    const timeParts = cleanHora.split(":");

    if (
      dateParts.length !== 3 ||
      timeParts.length < 2 ||
      timeParts.length > 3
    ) {
      console.warn("getMinutesDifference: formato inválido", { fecha, hora });
      return 0;
    }

    const [year, month, day] = dateParts.map(Number);
    const [hours, minutes] = timeParts.map(Number);

    const turnoDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    if (isNaN(turnoDateTime.getTime())) {
      console.warn("getMinutesDifference: fecha/hora no válida", {
        fecha,
        hora,
      });
      return 0;
    }

    // Obtener la hora actual en la zona horaria de la agencia
    const agencyNowString = now.toLocaleString("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const agencyNow = new Date(agencyNowString);

    const diffMs = turnoDateTime.getTime() - agencyNow.getTime();
    return Math.floor(diffMs / (1000 * 60));
  } catch (error) {
    console.error("Error en getMinutesDifference:", error, {
      fecha,
      hora,
      pais,
    });
    return 0;
  }
}
