import { z } from "zod";

export type CreateNuevaAgenciaInput = z.infer<typeof createNuevaAgenciaSchema>;

// Esquema simplificado - solo nombre_sociedad y mail son obligatorios
export const createNuevaAgenciaSchema = z.object({
  agencia: z.object({
    nombre_sociedad: z.string().min(1),
    nombre_comercial: z.string().optional(),
    cedula_juridica: z.string().optional(),
    pais: z.string().optional(),
    sitio_web: z.string().url().optional(),
    direccion: z.string().optional(),
  }),
  condiciones_comerciales: z.preprocess(
    // Si el valor es null o undefined, proporcionar un objeto con valores predeterminados
    (val) =>
      val || { comision: 0, terminos_condiciones: "Términos predeterminados" },
    z.object({
      comision: z.number().min(0).max(100).optional().default(0),
      terminos_condiciones: z
        .string()
        .optional()
        .default("Términos predeterminados"),
    })
  ),
  configuracion_fees: z
    .object({
      tax: z.number().min(0).max(100).nullable().optional(),
      convenience_fee_fijo: z.boolean().optional(),
      convenience_fee_fijo_valor: z.number().min(0).nullable().optional(),
      convenience_fee_variable: z.boolean().optional(),
      convenience_fee_variable_valor: z.number().min(0).nullable().optional(),
    })
    .optional(),
  usuario_administrador: z.object({
    nombre: z.string().optional(),
    mail: z.string().email(),
    telefono: z.string().optional(),
  }),
});
