/**
 * Registra advertencias importantes para propósitos de seguimiento
 * @param message - El mensaje principal
 * @param data - Datos adicionales a registrar
 */
export function logWarning(message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const warnData = {
    timestamp,
    message,
    ...data
  };
  // Formatear como JSON para logging
  const formattedWarn = JSON.stringify(warnData, null, 2);
  // Escribir a la consola
  console.warn(`[WARNING] ${timestamp} - ${message}`, data);
  return warnData;
}
