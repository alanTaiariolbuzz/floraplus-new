import { z } from 'zod';

/**
 * Esquema de validación para la solicitud de cambio de rol
 * Permite identificar al usuario por ID o por email
 * @swagger
 * components:
 *   schemas:
 *     CambiarRolRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: UUID del usuario (opcional si se proporciona email)
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         email:
 *           type: string
 *           description: Email del usuario (opcional si se proporciona id)
 *           format: email
 *           example: usuario@ejemplo.com
 *         rol_id:
 *           type: number
 *           description: ID del nuevo rol a asignar
 *           example: 2
 *       required:
 *         - rol_id
 */
export const cambiarRolSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido').optional(),
  email: z.string().email('El formato de email es inválido').optional(),
  rol_id: z.number().int('El ID de rol debe ser un número entero'),
}).refine(data => data.id || data.email, {
  message: "Debe proporcionar el ID o el email del usuario",
  path: ["id", "email"],
});

export type CambiarRolRequest = z.infer<typeof cambiarRolSchema>;
