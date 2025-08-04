// app/api/reservas/services/reservaService.ts
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  ReservaHoldInput,
  RespuestaHold,
  HoldSQLResult,
  FiltrosReserva,
} from "../types/reservaTypes";
import { logError, logInfo } from "@/utils/error/logger";
import { createCliente } from "../../clientes/services/clienteService";

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

/**
 * Verifica el estado de los turnos antes y después de una operación
 * @param turnoId ID del turno específico
 * @param horarioId ID del horario (opcional, para verificar otros turnos)
 */
async function verificarEstadoTurnos(turnoId: number, horarioId?: number) {
  const supabase = await createAdminClient();

  // Verificar el turno específico
  const { data: turnoEspecifico, error: errorTurno } = await supabase
    .from("turnos")
    .select("id, cupo_total, cupo_disponible, fecha, hora_inicio")
    .eq("id", turnoId)
    .single();

  if (errorTurno) {
    logError("Error verificando turno específico", errorTurno);
    return;
  }

  logInfo("Estado del turno específico", {
    turno_id: turnoId,
    cupo_total: turnoEspecifico.cupo_total,
    cupo_disponible: turnoEspecifico.cupo_disponible,
    fecha: turnoEspecifico.fecha,
    hora_inicio: turnoEspecifico.hora_inicio,
  });

  // Si se proporciona horarioId, verificar otros turnos del mismo horario
  if (horarioId) {
    const { data: otrosTurnos, error: errorOtros } = await supabase
      .from("turnos")
      .select("id, cupo_total, cupo_disponible, fecha, hora_inicio")
      .eq("horario_id", horarioId)
      .neq("id", turnoId)
      .gte("fecha", turnoEspecifico.fecha)
      .lte("fecha", turnoEspecifico.fecha);

    if (errorOtros) {
      logError("Error verificando otros turnos", errorOtros);
      return;
    }

    if (otrosTurnos && otrosTurnos.length > 0) {
      logInfo("Estado de otros turnos del mismo horario y fecha", {
        horario_id: horarioId,
        turnos: otrosTurnos.map((t) => ({
          id: t.id,
          cupo_total: t.cupo_total,
          cupo_disponible: t.cupo_disponible,
          fecha: t.fecha,
          hora_inicio: t.hora_inicio,
        })),
      });
    }
  }
}

export async function createReservaHold(
  payload: ReservaHoldInput
): Promise<RespuestaHold> {
  const supabase = await createAdminClient();

  // Log para debuggear el turno_id que se está enviando
  logInfo("Creando reserva hold", {
    turno_id: payload.turno_id,
    items: payload.items,
    total_items: payload.items.reduce((sum, item) => sum + item.cantidad, 0),
  });

  // Obtener información del turno para verificar el horario_id
  const { data: turnoInfo, error: errorTurno } = await supabase
    .from("turnos")
    .select("horario_id")
    .eq("id", payload.turno_id)
    .single();

  if (errorTurno) {
    logError("Error obteniendo información del turno", errorTurno);
  }

  // Verificar estado ANTES de crear la reserva
  await verificarEstadoTurnos(payload.turno_id, turnoInfo?.horario_id);

  // 1) Crear el hold de la reserva
  const { data: holdResult, error } = await supabase
    .rpc("create_reserva_hold", {
      p_turno_id: payload.turno_id,
      p_items: payload.items, // array JS, supabase lo castea a jsonb
      p_hold_minutes: 5, // opcional: si no lo envías toma 5
    })
    .single<HoldSQLResult>();

  if (error || !holdResult) {
    throw { code: 409, message: error?.message || "Sin cupo o ítem inválido" };
  }

  // Verificar estado DESPUÉS de crear la reserva
  await verificarEstadoTurnos(payload.turno_id, turnoInfo?.horario_id);

  // 2) Si hay cliente, usar la API de clientes existente para crearlo/asociarlo
  let clienteInfo = null;
  if (payload.cliente) {
    try {
      // Usar el servicio existente de clientes para crear o encontrar al cliente
      // y asociarlo con esta reserva - solo el email es obligatorio
      const clienteResult = await createCliente({
        nombre: payload.cliente.nombre || "",
        apellido: payload.cliente.apellido || "",
        email: payload.cliente.email,
        telefono: payload.cliente.telefono,
        activo: payload.cliente.activo || "pending",
        reserva_id: holdResult.reserva_id,
      });

      if (clienteResult.error) {
        logError(clienteResult.error, {
          action: "crearCliente",
          reservaId: holdResult.reserva_id,
          endpoint: "/api/reservas/createReservaHold",
        });
      } else {
        clienteInfo = {
          id: clienteResult.data?.id,
          isExisting: clienteResult.isExisting || false,
          reservaActualizada: clienteResult.reservaActualizada || false,
        };

        logInfo("Cliente asociado a reserva", {
          clienteId: clienteResult.data?.id,
          reservaId: holdResult.reserva_id,
          isExisting: clienteResult.isExisting || false,
        });
      }
    } catch (clienteError) {
      // No fallamos toda la operación si falla solo la creación del cliente
      logError(clienteError, {
        action: "crearCliente",
        reservaId: holdResult.reserva_id,
        endpoint: "/api/reservas/createReservaHold",
      });
    }
  }

  //si se creo el cliente, se asocia a la reserva
  logInfo("RESERVA SERVICE: Asociando cliente a reserva", {
    reservaId: holdResult.reserva_id,
    clienteId: clienteInfo ? clienteInfo.id : "No cliente asociado",
  });
  if (clienteInfo) {
    const { data, error } = await supabase
      .from("reservas")
      .update({ cliente_id: clienteInfo.id })
      .eq("id", holdResult.reserva_id)
      .select("id, cliente_id")
      .single() // ⇒ error si 0 ó >1 filas
      .throwOnError(); // ⇒ lanza excepción si `error` ≠ null

    // si llegas aquí, todo OK

    logInfo("Resultado de la actualización de cliente en reserva", {
      reservaId: holdResult.reserva_id,
      clienteId: clienteInfo.id,
      data: data,
    });
  }
  // 3) generar payment_intent desde stripe (pendiente)

  // 4) Guardar el payment_intent_id (pendiente)

  return {
    code: 201,
    message: clienteInfo
      ? "Reserva creada y asociada a cliente"
      : "Reserva hold creada",
    data: {
      reservaId: holdResult.reserva_id,
      clientSecret: "Integracion Stripe",
      expiresAt: holdResult.expires_at ?? "",
      cliente: clienteInfo,
    },
  };
}

export async function fetchReservas(filtros: FiltrosReserva) {
  const supabase = await createClient();

  // Consultar la tabla base 'reservas' en lugar de la vista 'reservas_detalle'
  let query = supabase
    .from("reservas")
    .select(
      `
      *,
      turno:turnos (
        id,
        horario_id,
        actividad_id,
        agencia_id,
        cupo_disponible,
        created_at,
        updated_at,
        deleted_at,
        bloquear,
        fecha,
        hora_inicio,
        hora_fin,
        cupo_total
      ),
      cliente:clientes (
        id,
        nombre,
        apellido,
        email,
        telefono,
        created_at,
        updated_at,
        deleted_at,
        activo
      ),
      agencia:agencias (
        id,
        nombre
      ),
      reserva_items:reserva_items (
        id,
        total,
        item_id,
        cantidad,
        item_type,
        descripcion,
        precio_unitario
      )
    `
    )
    .order("id", { ascending: true });

  if (filtros.id) query = query.eq("id", filtros.id);
  if (filtros.actividad_id)
    query = query.eq("turno.actividad_id", filtros.actividad_id);
  if (filtros.turno_id) query = query.eq("turno_id", filtros.turno_id);
  if (filtros.agencia_id)
    query = query.eq("turno.agencia_id", filtros.agencia_id);
  if (filtros.created_at) {
    const date = new Date(filtros.created_at);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
    query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
  }
  if (filtros.cancelled_at) {
    const date = new Date(filtros.cancelled_at);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
    query = query.gte("cancelled_at", startOfDay).lte("cancelled_at", endOfDay);
  }

  const { data, error } = await query;

  if (error) throw { code: 500, message: error.message };

  // Obtener los títulos de las actividades (incluyendo soft deleted para mostrar en reservas)
  const actividadIds = data
    .map((reserva) => reserva.turno?.actividad_id)
    .filter(Boolean);
  const { data: actividades, error: actividadesError } = await supabase
    .from("actividades")
    .select("id, titulo")
    .in("id", actividadIds);

  if (actividadesError) throw { code: 500, message: actividadesError.message };

  // Crear un mapa de actividades por ID
  const actividadesMap: Record<number, string> = actividades.reduce(
    (acc: Record<number, string>, actividad) => {
      acc[actividad.id] = actividad.titulo;
      return acc;
    },
    {}
  );

  // Obtener todos los item_ids de las reservas
  const itemIds = data.flatMap((reserva) =>
    reserva.reserva_items.map((item: { item_id: number }) => item.item_id)
  );

  // Obtener los detalles de las tarifas
  const { data: tarifas, error: tarifasError } = await supabase
    .from("tarifas")
    .select("*")
    .in("id", itemIds);

  if (tarifasError) throw { code: 500, message: tarifasError.message };

  // Crear un mapa de tarifas por ID
  const tarifasMap: Record<number, any> = tarifas.reduce(
    (acc: Record<number, any>, tarifa) => {
      acc[tarifa.id] = tarifa;
      return acc;
    },
    {}
  );

  const reservaIds = data.map((r) => r.id);

  const { data: pagos, error: pagosError } = await supabase
    .from("pagos")
    .select(
      `
      reserva_id, 
      agencia_id,
      customer_id,
      status,
      amount,
      currency,
      receipt_url,
      external_status,
      stripe_session_id,
      stripe_customer_id,
      customer_email,
      customer_name,
      payment_method,
      net_amount,
      client_reference_id,
      final_tax,
      final_fee,
      fee_flora_plus,
      created_at,
      updated_at
    `
    )
    .in("reserva_id", reservaIds);

  if (pagosError) throw { code: 500, message: pagosError.message };

  const pagosMap: Record<number, any> = {};
  pagos.forEach((pago) => {
    pagosMap[pago.reserva_id] = pago;
  });

  // ──────── Armar respuesta ────────
  const reservasCompletas = data.map((reserva) => ({
    ...reserva,
    actividad_id: reserva.turno?.actividad_id,
    actividad_titulo:
      actividadesMap[reserva.turno?.actividad_id || 0] ??
      "Actividad no encontrada",
    reserva_items: reserva.reserva_items.map((item: any) => ({
      ...item,
      detalle: tarifasMap[item.item_id] ?? null,
    })),
    pago: pagosMap[reserva.id] ?? null, // incluye toda la información del pago
  }));

  return reservasCompletas;
}
