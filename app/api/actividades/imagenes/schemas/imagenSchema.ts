import { z } from 'zod';

/**
 * Esquema de validación para usuarios
 */
export const imagenSchema = z.object({
  image: z
    .any()
    .refine((file) => file instanceof File || file instanceof Blob, {
      message: 'Debe ser un archivo',
    }),
});

export type Cliente = z.infer<typeof imagenSchema>;
