import { z } from 'zod';

/**
 * Esquema de validación para usuarios
 */
export const usuarioSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID'), // 👈 nuevo campo
  agencia_id: z.number().int('El ID de agencia debe ser un número entero').optional(),
  rol_id: z.number().int('El ID de rol debe ser un número entero'),
  nombre: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre no puede exceder los 255 caracteres').optional(),
  apellido: z.string().min(1, 'El apellido es requerido').max(255, 'El apellido no puede exceder los 255 caracteres').optional(),
  email: z.string().email('El formato de email es inválido').max(255, 'El email no puede exceder los 255 caracteres'),
  telefono: z.string().max(50, 'El teléfono no puede exceder los 50 caracteres').optional(),
  activo: z.boolean().default(false)
});

export type Usuario = z.infer<typeof usuarioSchema>;
