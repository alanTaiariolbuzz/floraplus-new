import { z } from "zod";

export const agencyadminSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  agencia_id: z
    .number()
    .int()
    .positive("El ID de agencia debe ser un número positivo"),
});

export type AgencyAdminInput = z.infer<typeof agencyadminSchema>;
