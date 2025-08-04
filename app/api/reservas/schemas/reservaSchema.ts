import { z } from 'zod';

export const reservaHoldSchema = z.object({
    turno_id: z.number().int(),
    items: z.array(
      z.object({
        item_type: z.enum(['tarifa','adicional','transporte']),
        item_id:   z.number().int(),
        cantidad:  z.number().int().positive()
      })
    ).min(1),
    cliente: z.object({
      // Para la ruta de reservas, solo email es obligatorio
      nombre: z.string().max(255, "El nombre no puede exceder los 255 caracteres").optional(),
      apellido: z.string().max(255, "El apellido no puede exceder los 255 caracteres").optional(),
      email: z.string().email("El formato de email es inválido").max(255, "El email no puede exceder los 255 caracteres"),
      telefono: z.string().max(50, "El teléfono no puede exceder los 50 caracteres").optional(),
      activo: z.string().min(1).max(255).default("pending").optional()
    }).optional()
  });
  