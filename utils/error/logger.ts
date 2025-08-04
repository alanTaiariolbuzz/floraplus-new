/**
 * Módulo centralizado para el manejo de errores y logging
 * Proporciona funciones consistentes para registrar errores en toda la aplicación
 * Versión compatible con Edge Runtime (sin operaciones de filesystem)
 * REVISAR
 */

// Versión simplificada que solo usa console.log/error
// Compatible con Edge Runtime

/**
 * Registra un error estructurado con contexto adicional
 * 
 * @param error - El error que se está registrando
 * @param context - Contexto adicional como endpoint, operación, etc.
 */
export function logError(error: any, context: any = {}) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    ...context,
    error: error instanceof Error
      ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      : error
  };

  // Formatear como JSON para logging
  const formattedError = JSON.stringify(errorInfo, null, 2);
  
  // Escribir a la consola
  console.error(`[ERROR] ${timestamp}`, error, context);
  
  return errorInfo;
}

/**
 * Registra información (no errores) para propósitos de seguimiento
 * 
 * @param message - El mensaje principal
 * @param data - Datos adicionales a registrar
 */
export function logInfo(message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const infoData = {
    timestamp,
    message,
    ...data
  };
  
  // Formatear como JSON para logging
  const formattedInfo = JSON.stringify(infoData, null, 2);
  
  // Escribir a la consola
  console.info(`[INFO] ${timestamp} - ${message}`, data);
  
  return infoData;
}

export function logWarn(message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const warnData = {
    timestamp,
    message,
    ...data
  };
  // Formatear como JSON para logging
  const formattedWarn = JSON.stringify(warnData, null, 2);
  // Escribir a la consola
  console.warn(`[WARN] ${timestamp} - ${message}`, data);

  return warnData;
}
/**
 * Obtiene los últimos N logs de error
 * En entorno Edge siempre devuelve un array vacío ya que no hay persistencia
 * @param count - Número de logs a retornar
 */
export function getLastErrorLogs(count: number = 20): string[] {
  // En Edge Runtime no hay acceso a filesystem
  console.info('getLastErrorLogs no está disponible en Edge Runtime');
  return [];
}

/**
 * Obtiene los últimos N logs de información
 * En entorno Edge siempre devuelve un array vacío ya que no hay persistencia
 * @param count - Número de logs a retornar
 */
export function getLastInfoLogs(count: number = 20): string[] {
  // En Edge Runtime no hay acceso a filesystem
  console.info('getLastInfoLogs no está disponible en Edge Runtime');
  return [];
}
