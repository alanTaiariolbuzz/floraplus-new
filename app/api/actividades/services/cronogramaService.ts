import { logError } from '@/utils/error/logger';
import { createClient } from '@/utils/supabase/server';

export async function getCronogramaByActividadId(actividadId: number) {
  const supabase = await createClient();
  
  const { data: cronograma, error: cronogramaError } = await supabase
    .from('horarios')
    .select('*')
    .eq('actividad_id', actividadId)
    .is('deleted_at', null)
    .order('fecha_inicio', { ascending: true });
  
  if (cronogramaError) {
    logError(cronogramaError, { endpoint: '/api/actividades/GET', actividadId });
    return [];
  }
  
  // Formatear el cronograma incluyendo todos los campos relevantes
  return cronograma ? cronograma.map(c => ({
    id: c.id,
    dia_completo: c.dia_completo || false,
    fecha_inicio: c.fecha_inicio,
    dias: c.dias || [],
    hora_inicio: c.hora_inicio,
    hora_fin: c.hora_fin,
    cupo: c.cupo,
    created_at: c.created_at,
    updated_at: c.updated_at
  })) : [];
}
