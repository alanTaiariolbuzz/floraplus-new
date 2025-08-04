import { logError } from '@/utils/error/logger';
import { createClient } from '@/utils/supabase/server';
import { Adicional } from '../schemas/actividadSchema';

export async function getAdicionalesByActividadId(actividadId: number): Promise<Adicional[]> {
  const supabase = await createClient();
  
  // Obtener adicionales relacionados
  const { data: adicionalesRel, error: adicionalesRelError } = await supabase
    .from('actividad_adicionales')
    .select('adicionales_id')
    .eq('actividad_id', actividadId);
  
  let adicionales: Adicional[] = [];
  if (!adicionalesRelError && adicionalesRel && adicionalesRel.length > 0) {
    const adicionalesIds = adicionalesRel.map((rel: { adicionales_id: any; }) => rel.adicionales_id);
    const { data: adicionalesData, error: adicionalesError } = await supabase
      .from('adicionales')
      .select('*')
      .in('id', adicionalesIds)
      .eq('activo', true)
      .is('deleted_at', null);
    
    if (!adicionalesError && adicionalesData) {
      adicionales = adicionalesData.map(a => ({
        id: a.id,
        titulo: a.titulo,
        titulo_en: a.titulo_en || '',
        descripcion: a.descripcion,
        descripcion_en: a.descripcion_en || '',
        precio: a.precio,
        moneda: 'USD', // Valor por defecto
        imagen: a.imagen,
        activo: a.activo || true,
        created_at: a.created_at,
        updated_at: a.updated_at
      }));
    } else if (adicionalesError) {
      logError(adicionalesError, { endpoint: '/api/actividades/GET', actividadId });
    }
  }
  
  return adicionales;
}
