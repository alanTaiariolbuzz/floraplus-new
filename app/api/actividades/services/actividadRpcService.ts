import { actividadInputSchema, ActividadInput } from '../schemas/actividadSchema';
import { createClient } from '@/utils/supabase/server';

export async function crearActividadCompletaRPC(body: unknown) {
  const supabase = await createClient();
  const input: ActividadInput = actividadInputSchema.parse(body);
 
  //console.dir(input, { depth: null });
  const { data, error } = await supabase.rpc('crear_actividad_desde_json', { _input: input });

  if (error) throw error;
  return data as {
    id: number,
    cronograma: any[],
    tarifas: any[],
    adicionales: any[],
    transportes: any[],
    descuentos: any[]
  };
}


// type ActividadData = z.infer<typeof actividadSchema>;
// type CronoRPC = {
//   fecha_inicio?: string;
//   dias?: number[];
//   dia_completo?: boolean;
//   hora_inicio?: string;
//   hora_fin?: string;
//   cupo?: number;
// };
// type TarifaRPC = { nombre: string; precio: number; es_principal: boolean; };

// export async function crearActividadCompletaRPC(data: ActividadData): Promise<number> {
//   const supabase = await createClient();

//   const { data: idArray, error } = await supabase.rpc('crear_actividad_completa', {
//     _agencia_id:            AGENCIA_ID,
//     _titulo:                data.titulo,
//     _descripcion:           data.descripcion,
//     _es_privada:            data.es_privada,
//     _imagen:                data.imagen,
//     _estado:                data.estado,
//     _ubicacion:             data.ubicacion ?? null,
//     _minimo_personas_reserva: data.detalles?.minimo_reserva ?? 1,
//     _limite_reserva_minutos: data.limite_reserva_minutos ?? null,
//     _umbral_limite_personas: data.umbral_limite_personas ?? null
//     _umbral_limite_minutos: data.umbral_limite_minutos ?? null,
//     _umbral_limite_tipo:    data.umbral_limite_tipo ?? null,
//     _cronograma: data.cronograma?.map<CronoRPC>(c => ({
//       fecha_inicio:  c.fecha_inicio,
//       dias:          c.dias,
//       dia_completo:  c.dia_completo,
//       hora_inicio:   c.hora_inicio,
//       hora_fin:      c.hora_fin,
//       cupo:          c.cupo
//     })) ?? null,
//     _tarifas: data.tarifas?.map<TarifaRPC>(t => ({
//       nombre:        t.descripcion,
//       precio:        t.precio,
//       es_principal:  false
//     })) ?? null,
//     _adicionales_ids: data.adicionales ?? null,
//     _transporte_ids:  data.transporte  ?? null,
//     _descuentos_ids:  data.descuentos  ?? null
//   });

//   if (error) throw new Error(error.message);
//   return idArray as unknown as number; // la función devuelve bigint → number
// }
