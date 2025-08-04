import { logError } from '@/utils/error/logger';
import { createClient } from '@/utils/supabase/server';

export async function getTarifasByActividadId(actividadId: number) {
  const supabase = await createClient();
  
  const { data: tarifas, error: tarifasError } = await supabase
    .from('tarifas')
    .select('*')
    .eq('actividad_id', actividadId)
    .is('deleted_at', null)
    .order('es_principal', { ascending: false });
    // ;
  
  if (tarifasError) {
    logError(tarifasError, { endpoint: '/api/actividades/GET', actividadId });
    return [];
  }
  
  // Formatear las tarifas incluyendo todos los campos relevantes
  return tarifas ? tarifas.map(t => ({
    id: t.id,
    nombre: t.nombre,
    nombre_en: t.nombre_en,
    precio: t.precio,
    moneda: 'USD', // Valor por defecto
    es_principal: t.es_principal || false,
    created_at: t.created_at,
    updated_at: t.updated_at
  })) : [];
}
