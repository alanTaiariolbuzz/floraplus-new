/**
 * Utilidades para mapeo y transformación de datos entre la BD y las API
 * REVISAR
 */

/**
 * Construye un mapa de relaciones muchos a muchos a partir de una lista de registros de relación
 * 
 * Esta función toma una lista de relaciones (por ejemplo, de la tabla actividad_adicionales)
 * y construye un mapa donde las claves son los IDs de una entidad (ej: adicionales_id)
 * y los valores son arrays de IDs de la otra entidad (ej: actividad_id)
 * 
 * @param relations Lista de objetos de relación
 * @param idFieldFrom Campo que sirve como clave en el mapa resultante
 * @param idFieldTo Campo que se agregará al array en el mapa
 * @returns Un objeto Record donde las claves son los IDs y los valores son arrays de IDs relacionados
 */
export function buildRelationMap<T extends Record<string, any>>(
  relations: T[] | null,
  idFieldFrom: keyof T,
  idFieldTo: keyof T
): Record<number, number[]> {
  const map: Record<number, number[]> = {};

  if (!relations) return map;

  for (const rel of relations) {
    const fromId = rel[idFieldFrom] as number;
    const toId = rel[idFieldTo] as number;
    
    if (!map[fromId]) {
      map[fromId] = [];
    }
    
    map[fromId].push(toId);
  }

  return map;
}

/**
 * Formatea datos de adicionales para la API a partir de los datos de BD y sus relaciones
 * 
 * @param adicionales Array de adicionales de la DB
 * @param relationMap Mapa de relaciones actividad-adicional
 * @returns Array formateado para la API
 */
export function formatAdicionalesResponse(
  adicionales: any[] | null,
  relationMap: Record<number, number[]>
): any[] {
  if (!adicionales) return [];
  
  return adicionales.map((ad) => ({
    id: ad.id,
    agencia_id: ad.agencia_id,
    titulo: ad.titulo || '',
    titulo_en: ad.titulo_en || '',
    descripcion: ad.descripcion || '',
    descripcion_en: ad.descripcion_en || '',
    precio: ad.precio || 0,
    moneda: ad.moneda || 'USD',
    imagen: ad.imagen || null,
    // Usar el valor explícito de la columna aplica_a_todas en lugar de calcularlo
    aplica_a_todas: ad.aplica_a_todas !== undefined ? ad.aplica_a_todas : false,
    actividad_ids: relationMap[ad.id] || [],
    activo: ad.activo !== undefined ? ad.activo : true,
    created_at: ad.created_at,
    updated_at: ad.updated_at
  }));
}

/**
 * Formatea datos de descuentos para la API a partir de los datos de BD y sus relaciones
 * 
 * @param descuentos Array de descuentos de la DB
 * @param relationMap Mapa de relaciones actividad-descuento
 * @returns Array formateado para la API
 */
export function formatDescuentosResponse(
  descuentos: any[] | null,
  relationMap: Record<number, number[]>
): any[] {
  if (!descuentos) return [];
  
  return descuentos.map((d) => ({
    id: d.id,
    agencia_id: d.agencia_id,
    titulo: d.titulo || '',
    tipo: d.tipo || '',
    valor: d.valor || 0,
    alcance: d.alcance || '',
    valido_desde: d.valido_desde,
    valido_hasta: d.valido_hasta,
    activo: d.activo !== undefined ? d.activo : true,
    uso_maximo: d.uso_maximo,
    usos_hechos: d.usos_hechos,
    moneda: d.moneda || 'USD',
    created_at: d.created_at,
    updated_at: d.updated_at,
    deleted_at: d.deleted_at,
    actividad_ids: relationMap[d.id] || []
  }));
}

/**
 * Formatea datos de transportes para la API a partir de los datos de BD y sus relaciones
 * 
 * @param transportes Array de transportes de la DB
 * @param actividadId ID de actividad opcional (para cuando se filtran por actividad)
 * @returns Array formateado para la API
 */
export function formatTransportesResponse(
  transportes: any[] | null,
  actividadIdFilter: number | null = null
): any[] {
  if (!transportes) return [];
  
  return transportes.map((tr) => {
    let salida: string | null = null;
    let llegada: string | null = null;
    
    if (tr.detalle) {
      try {
        const detalleObj = JSON.parse(tr.detalle);
        salida = detalleObj.salida;
        llegada = detalleObj.llegada;
      } catch {
        // Fallback: parsear detalle si es una cadena con separador '-'
        if (typeof tr.detalle === 'string' && tr.detalle.includes('-')) {
          const [sal, lleg] = tr.detalle.split('-');
          salida = sal.trim();
          llegada = lleg.trim();
        }
      }
    }
    
    return {
      id: tr.id,
      descripcion: tr.nombre,
      precio: tr.precio,
      moneda: 'USD',
      salida,
      llegada,
      cupo: tr.cupo_maximo,
      actividad_id: tr.actividad_id || actividadIdFilter
    };
  });
}
