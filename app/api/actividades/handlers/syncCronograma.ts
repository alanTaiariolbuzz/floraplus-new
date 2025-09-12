import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { horarioSchema } from '@/app/api/horarios/schemas/horarioSchema';
import {
  DuplicateIdError,
  PastDateError,
  TimeRangeError,
  ReservationsConflictError,
} from './error-types';
import { generarTurnosDesdeHorario } from '@/app/services/turnoGenerator';
import { ActualizacionActividad } from './validateBody';

type Supa = Awaited<ReturnType<typeof createClient>>;
type HorarioPayload = z.infer<typeof horarioSchema>;   // ⬅️  Horario con id? opcional

/**
 * Sincroniza cronograma ⇆ horarios ⇆ turnos.
 * - Inserta, actualiza y soft-borra horarios
 * - Crea o regenera turnos en consecuencia
 */
export async function syncCronograma(
  supa: Supa,
  actividadId: number,
  cronograma: ActualizacionActividad['cronograma'],
agenciaId: number, 
): Promise<void> {
  if (!cronograma) return;               // nada que hacer si no vino

  const todayISO = new Date().toISOString().slice(0, 10);

  /* 1️⃣  Validaciones previas ------------------------------------------- */
  const idSet = new Set<number>();

  cronograma.forEach((h, idx) => {
    if (h.id && idSet.has(h.id)) throw new DuplicateIdError();
    if (h.id) idSet.add(h.id);
    const isNewOrEdited = !(h as any).id || (h as any)._updated;
    if(isNewOrEdited) {
      if (h.fecha_inicio < todayISO) throw new PastDateError();
    }
    

    if (!h.dia_completo && (!h.hora_inicio || !h.hora_fin))
      throw new TimeRangeError();

    if (
      h.hora_inicio &&
      h.hora_fin &&
      h.hora_inicio >= h.hora_fin
    ) {
      throw new TimeRangeError();
    }
  });

  /* 2️⃣  Horarios existentes ------------------------------------------- */
  const { data: existentes, error: eErr } = await supa
    .from('horarios')
    .select('id')
    .eq('actividad_id', actividadId)
    .is('deleted_at', null);

  if (eErr) throw eErr;

  const existentesIds = (existentes ?? []).map((h) => h.id);
  const incomingIds   = cronograma.filter((h) => h.id).map((h) => h.id!);

  const aInsert:  HorarioPayload[] = cronograma.filter((h) => !h.id);
  const aUpdate:  HorarioPayload[] = cronograma.filter((h) => h.id);
  const aDelete                = existentesIds.filter((id) => !incomingIds.includes(id));

  /* 3️⃣  Bloquear delete si hay reservas confirmadas ------------------- */
  if (aDelete.length) {
        const { data: turnos, error } = await supa
            .from('turnos')
            .select('id, cupo_total, cupo_disponible')
            .in('horario_id', aDelete)
            .is('deleted_at', null);          // por si usas soft-delete

        if (error) throw error;

        // ¿Alguno tiene reservas?  cupo_disponible < cupo_total
        const hayReservas = turnos?.some(
            (t) => t.cupo_disponible < t.cupo_total,
        );

        if (hayReservas) throw new ReservationsConflictError();
  }

  const now = new Date().toISOString();

  /* 4️⃣  Soft-delete horarios + turnos --------------------------------- */
  if (aDelete.length) {
    await supa
      .from('horarios')
      .update({ deleted_at: now })
      .in('id', aDelete);

    await supa
      .from('turnos')
      .update({ deleted_at: now })
      .in('horario_id', aDelete);
  }

  /* 5️⃣  Updates -------------------------------------------------------- */
  for (const h of aUpdate) {
    await supa
      .from('horarios')
      .update({
        fecha_inicio : h.fecha_inicio,
        dia_completo : h.dia_completo,
        dias         : h.dias ?? null,
        hora_inicio  : h.hora_inicio ?? null,
        hora_fin     : h.hora_fin ?? null,
        cupo         : h.cupo,
        updated_at   : now,
      })
      .eq('id', h.id!);

      await supa
      .from('turnos')
      .update({ deleted_at: now })
      .eq('horario_id', h.id!);

    // Regenerar turnos futuros
    await generarTurnosDesdeHorario({
      ...h,
      id          : h.id!,
      actividad_id: actividadId,
      agencia_id  : agenciaId, // ⬅️  Agregar agenciaId
    } as any);
  }

  /* 6️⃣  Inserts -------------------------------------------------------- */
  if (aInsert.length) {
    const rows = aInsert.map((h) => ({
      agencia_id: agenciaId, // ⬅️  Agregar agenciaId
      actividad_id: actividadId,
      fecha_inicio: h.fecha_inicio,
      dias        : h.dias ?? [0, 1, 2, 3, 4, 5, 6],
      dia_completo: h.dia_completo,
      hora_inicio : h.hora_inicio ?? null,
      hora_fin    : h.hora_fin ?? null,
      cupo        : h.cupo,
      created_at  : now,
      updated_at  : now,
    }));

    const { data: inserted, error: insErr } = await supa
    .from('horarios')
    .insert(rows)
    .select('*');                // ⬅️ selecciona todas las columnas, no sólo id

    if (insErr) throw insErr;

    if (inserted) {
    for (const horarioRow of inserted) {
        await generarTurnosDesdeHorario(horarioRow as any);
    }
    }

  }
}
