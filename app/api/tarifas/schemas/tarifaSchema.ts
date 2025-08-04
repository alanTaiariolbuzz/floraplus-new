import { z } from 'zod';

/**
 * Esquema de validación para tarifas
 */
export const tarifaSchema = z.object({
  actividad_id: z.number().int('El ID de actividad debe ser un número entero'),
  nombre: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre no puede exceder los 255 caracteres'),
  nombre_en: z.string().max(255, 'El nombre en inglés no puede exceder los 255 caracteres').nullable().optional(),
  precio: z.number().nonnegative('El precio no puede ser negativo'),
  es_principal: z.boolean().default(false),
  activa: z.boolean().default(true)
});

export type Tarifa = z.infer<typeof tarifaSchema>;
