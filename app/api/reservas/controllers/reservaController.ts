import { logError } from "@/utils/error/logger";
import { ZodError } from "zod";
import { reservaHoldSchema } from "../schemas/reservaSchema";
import { createReservaHold, fetchReservas } from "../services/reservaService";
import {
  RespuestaHold,
  ReservaHoldInput,
  FiltrosReserva,
  RespuestaReservas,
} from "../types/reservaTypes";

export async function createReserva(input: unknown): Promise<RespuestaHold> {
  try {
    const data = reservaHoldSchema.parse(input) as ReservaHoldInput;
    return await createReservaHold(data); // ← devuelve
  } catch (err: any) {
    if (err instanceof ZodError) {
      return {
        code: 400,
        message: "Datos inválidos",
        errors: err.flatten().fieldErrors,
        isValidationError: true,
      };
    }
    logError(err, { endpoint: "/api/reservas/POST" });
    return { code: err.code || 500, message: err.message || "Error interno" };
  }
}

export async function getReservas(
  filtros: FiltrosReserva
): Promise<RespuestaReservas> {
  try {
    const data = await fetchReservas(filtros);

    // Si se busca por ID específico, devolver el primer elemento del array
    if (filtros.id && Array.isArray(data) && data.length > 0) {
      return { code: 200, message: "Reserva obtenida", data: data[0] };
    }

    // Si se busca por ID pero no se encuentra, devolver error
    if (filtros.id && Array.isArray(data) && data.length === 0) {
      return { code: 404, message: "Reserva no encontrada" };
    }

    return { code: 200, message: "Reservas obtenidas", data };
  } catch (err: any) {
    console.error("Error in getReservas:", err);
    logError(err, { endpoint: "/api/reservas/GET" });
    return { code: err.code || 500, message: err.message || "Error interno" };
  }
}
