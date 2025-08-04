// app/api/actividades/handlers/validateBody.ts
import { z } from 'zod';
import { ValidationError } from './error-types';
import { horarioSchema } from '@/app/api/horarios/schemas/horarioSchema';

// Re-exporta este tipo si lo necesitas en otros módulos
export type ActualizacionActividad = z.infer<typeof schema>;

const tarifaSchema = z.object({
  id          : z.number().int().positive().optional(),
  nombre      : z.string().min(1),
  nombre_en   : z.string().min(1).optional(),
  precio      : z.number().min(0),
  moneda      : z.string().min(1).default('USD'),
  es_principal: z.boolean().optional(),
  activa      : z.boolean().optional(),
});

const schema = z.object({
  titulo          : z.string().min(1).optional(),
  titulo_en       : z.string().optional(),
  descripcion     : z.string().optional(),
  descripcion_en  : z.string().optional(),
  es_privada      : z.boolean().optional(),
  imagen          : z.string().optional(),
  estado          : z.enum(['borrador', 'publicado']).optional(),
  iframe_code     : z.string().optional(),
  detalles        : z.object({
    minimo_reserva           : z.number().min(1).optional(),
    limite_reserva_minutos   : z.number().min(1).optional(),
    umbral_limite_personas   : z.number().min(1).optional(),
    umbral_limite_minutos    : z.number().min(1).optional(),
    umbral_limite_tipo       : z.string().optional(),
  }).partial().optional(),
  ubicacion       : z.object({
    lat       : z.number(),
    lng       : z.number(),
    direccion : z.string().optional(),
  }).optional(),
  tarifas         : z.array(tarifaSchema).optional(),
  adicionales     : z.array(z.number().int().positive()).optional(),
  transportes     : z.array(z.number().int().positive()).optional(),
  descuentos      : z.array(z.number().int().positive()).optional(),
  cronograma: z.array(horarioSchema).optional(),
  // cronograma se quita/ignora hasta que haya soporte
}).strict();

export function validateBody(raw: unknown): ActualizacionActividad {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }
  return parsed.data;
}
