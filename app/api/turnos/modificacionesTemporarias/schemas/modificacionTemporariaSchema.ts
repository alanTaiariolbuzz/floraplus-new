import { z } from "zod";

/**
 * Tipos de modificación temporaria
 */
export enum TipoModificacionTemporaria {
  CAMBIAR_HORA_INICIO = "CAMBIAR_HORA_INICIO",
  CAMBIAR_CUPOS = "CAMBIAR_CUPOS",
  BLOQUEAR_HORARIO = "BLOQUEAR_HORARIO",
  BLOQUEAR_ACTIVIDAD = "BLOQUEAR_ACTIVIDAD",
  BLOQUEAR_TODAS = "BLOQUEAR_TODAS",
}

// Base schema without refinements
export const baseModificacionTemporariaSchema = z.object({
  tipo_modificacion: z
    .nativeEnum(TipoModificacionTemporaria, {
      required_error: "El tipo de modificación es requerido",
      invalid_type_error: "Tipo de modificación no válido",
    })
    .describe("Tipo de modificación temporaria"),
  horario_id: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe("ID del horario a modificar"),
  actividad_id: z
    .number()
    .int()
    .optional()
    .describe("ID de la actividad a modificar"),
  agencia_id: z
    .number()
    .int()
    .optional()
    .describe("ID de la agencia a modificar"),
  turno_id: z.number().int().optional().describe("ID del turno a modificar"),
  fecha_desde: z.string().describe("Fecha de inicio de la modificación"),
  fecha_hasta: z.string().describe("Fecha de fin de la modificación"),
  hora_inicio_actual: z
    .string()
    .nullable()
    .optional()
    .describe("Hora de inicio original"),
  hora_inicio_nueva: z
    .string()
    .nullable()
    .optional()
    .describe("Hora de inicio de la modificación"),
  horario_bloquear: z
    .string()
    .nullable()
    .optional()
    .describe("Hora a bloquear"),
  cupo_actual: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe("Cantidad de cupos original"),
  nuevos_cupos_totales: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe("Cantidad de cupos modificado"),
  activo: z.boolean().default(true).describe("Estado de la modificación"),
  deleted_at: z
    .string()
    .nullable()
    .optional()
    .describe("Fecha de eliminación de la modificación"),
});

// Apply refinements based on tipo_modificacion
export const modificacionTemporariaSchema = baseModificacionTemporariaSchema
  .refine(
    (data) => {
      if (
        data.tipo_modificacion === "BLOQUEAR_ACTIVIDAD" &&
        !data.actividad_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: "actividad_id es requerido para BLOQUEAR_ACTIVIDAD",
      path: ["actividad_id"],
    }
  )
  .refine(
    (data) => {
      const tiposQueRequierenHorario = [
        "CAMBIAR_HORA_INICIO",
        "CAMBIAR_CUPOS",
        "BLOQUEAR_HORARIO",
      ];
      if (
        tiposQueRequierenHorario.includes(data.tipo_modificacion) &&
        !data.horario_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: "horario_id es requerido para este tipo de modificación",
      path: ["horario_id"],
    }
  );
