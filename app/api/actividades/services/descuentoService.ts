import { logError } from '@/utils/error/logger';
import { Descuento } from '../schemas/actividadSchema';
import { createClient } from '@/utils/supabase/server';

export async function getDescuentosByActividadId(actividadId: number): Promise<Descuento[]> {
  const supabase = await createClient();
  
  // Obtener descuentos relacionados con la actividad
  const { data: descuentosRel, error: descuentosRelError } = await supabase
    .from('actividad_descuento')
    .select('descuento_id')
    .eq('actividad_id', actividadId);
  
  /* COMENTADO: Ya no se utiliza el concepto de descuentos globales
  // También obtener descuentos globales
  const { data: descuentosGlobales, error: descuentosGlobalesError } = await supabase
    .from('descuentos')
    .select('*')
    .eq('alcance', 'global')
    .eq('agencia_id', AGENCIA_ID);
  */
  
  let descuentos: Descuento[] = [];
  let descuentosIds: number[] = [];
  
  if (!descuentosRelError && descuentosRel) {
    descuentosIds = descuentosRel.map(rel => rel.descuento_id);
  }
  
  if (descuentosIds.length > 0) {
    const { data: descuentosData, error: descuentosError } = await supabase
      .from('descuentos')
      .select('*')
      .in('id', descuentosIds)
      .eq('activo', true)
      .is('deleted_at', null);
    
    if (!descuentosError && descuentosData) {
      descuentos = descuentosData.map(d => ({
        id: d.id,
        codigo: d.codigo,
        descripcion: d.descripcion,
        porcentaje: d.porcentaje || 0,
        precio: d.valor,
        moneda: 'USD', // Valor por defecto
        aplica_a_todas: false,
        actividad_ids: [actividadId],
        created_at: d.created_at,
        updated_at: d.updated_at,
        activo: d.activo
      }));
    } else if (descuentosError) {
      logError(descuentosError, { endpoint: '/api/actividades/GET', actividadId });
    }
  }
  
  /* COMENTADO: Ya no se procesan descuentos globales
  if (!descuentosGlobalesError && descuentosGlobales) {
    descuentos = [...descuentos, ...descuentosGlobales.map(d => ({
      descripcion: d.codigo,
      precio: d.valor,
      moneda: 'USD', // Valor por defecto
      aplica_a_todas: true,
      actividad_ids: []
    }))];
  }
  */
  
  return descuentos;
}
