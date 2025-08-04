import { createClient } from '@/utils/supabase/server';
import { logError, logInfo } from '@/utils/error/logger';


export async function syncTarifas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: number,
  tarifas: any[],
  now: string,
) {
  // 1. Obtener tarifas vigentes
  const { data: existentes, error: extErr } = await supabase
    .from('tarifas')
    .select('id, nombre, es_principal')
    .eq('actividad_id', id)
    .is('deleted_at', null);

  if (extErr) throw extErr;

  // 2. Normalizar payload
  const vistos = new Set<string>();
  let principalAsignado = false;
  const payload = tarifas.map((t: any, idx: number) => {
    const key = t.nombre.trim().toLowerCase();
    if (vistos.has(key)) {
      throw new Error(`Tarifa duplicada en índice ${idx}: «${t.nombre}»`);
    }
    vistos.add(key);

    if (t.es_principal) {
      if (principalAsignado) t.es_principal = false;
      else principalAsignado = true;
    }
    return t;
  });

  // 3. Soft-delete de faltantes
  const existentesIds   = (existentes ?? []).map(t => t.id);
  const actualizadasIds = payload.filter(t => t.id).map(t => t.id);
  const aBorrar         = existentesIds.filter(id => !actualizadasIds.includes(id));

  if (aBorrar.length) {
    const { error } = await supabase
      .from('tarifas')
      .update({ activa: false, deleted_at: now, updated_at: now })
      .in('id', aBorrar);

    if (error && error.code !== '23503') throw error;
  }

  // 4. Updates + inserts
  const inserts: any[] = [];
  for (const t of payload) {
    if (t.id) {
      const { error } = await supabase
        .from('tarifas')
        .update({
          nombre        : t.nombre,
          nombre_en     : t.nombre_en ?? null,
          precio        : t.precio,
          es_principal  : t.es_principal ?? false,
          activa        : t.activa  ?? true,
          updated_at    : now,
        })
        .eq('id', t.id);
      if (error) throw error;
    } else {
      inserts.push({
        actividad_id : id,
        nombre        : t.nombre,
        nombre_en     : t.nombre_en ?? null,
        precio        : t.precio,
        es_principal  : t.es_principal ?? false,
        activa        : t.activa  ?? true,
        created_at    : now,
        updated_at    : now,
      });
    }
  }
  if (inserts.length) {
    const { error } = await supabase.from('tarifas').insert(inserts);
    if (error) throw error;
  }

  // 5. Garantizar única principal
  if (!principalAsignado) {
    const { data: firstActive } = await supabase
      .from('tarifas')
      .select('id')
      .eq('actividad_id', id)
      .eq('activa', true)
      .is('deleted_at', null)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstActive) {
      await supabase
        .from('tarifas')
        .update({ es_principal: true, updated_at: now })
        .eq('id', firstActive.id);
    }
  }
}

export async function syncPivot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  column: string,
  actividadId: number,
  ids: number[],
) {
  await supabase.from(table).delete().eq('actividad_id', actividadId);
  if (ids.length) {
    const rows = ids.map(id => ({
      actividad_id: actividadId,
      [column]: id,
    }));
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
  }
}