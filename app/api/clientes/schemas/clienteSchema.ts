import { z } from 'zod';

/**
 * Esquema de validación para usuarios
 */
export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre no puede exceder los 255 caracteres'),
  apellido: z.string().min(1, 'El apellido es requerido').max(255, 'El apellido no puede exceder los 255 caracteres'),
  email: z.string().email('El formato de email es inválido').max(255, 'El email no puede exceder los 255 caracteres'),
  telefono: z.string().max(50, 'El teléfono no puede exceder los 50 caracteres').optional(),
  activo: z.string().min(1).max(255).default("pending"),
  reserva_id: z.number().int().optional().describe('ID de la reserva a asociar con este cliente')
});

export type Cliente = z.infer<typeof clienteSchema>;
