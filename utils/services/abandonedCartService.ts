import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AbandonedCartStats {
  movedCount: number;
  errorCount: number;
  errors: string[];
}

export async function moveAbandonedReservations(): Promise<AbandonedCartStats> {
  const stats: AbandonedCartStats = {
    movedCount: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    // 1. Buscar reservas en hold con más de 7 minutos
    const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000);

    const { data: abandonedReservations, error: fetchError } = await supabase
      .from("reservas")
      .select("*")
      .eq("estado", "hold")
      .lt("created_at", sevenMinutesAgo.toISOString());

    if (fetchError) {
      console.error("Error fetching abandoned reservations:", fetchError);
      stats.errors.push(
        `Error fetching abandoned reservations: ${fetchError.message}`
      );
      return stats;
    }

    if (!abandonedReservations || abandonedReservations.length === 0) {
      return stats;
    }

    // 2. Para cada reserva abandonada, mover a abandoned_cart
    for (const reservation of abandonedReservations) {
      try {
        // Preparar datos para abandoned_cart
        const abandonedCartData = {
          turno_id: reservation.turno_id,
          agencia_id: reservation.agencia_id,
          cliente_id: reservation.cliente_id,
          monto_total: reservation.monto_total,
          pago_referencia: reservation.pago_referencia,
          created_at: reservation.created_at,
          updated_at: reservation.updated_at,
          estado: reservation.estado,
          expires_at: reservation.expires_at,
          payment_intent_id: reservation.payment_intent_id,
          actividad_id: reservation.actividad_id,
          pago_id: reservation.pago_id,
          codigo_reserva: reservation.codigo_reserva,
          abandoned_at: new Date().toISOString(),
        };

        // Insertar en abandoned_cart
        const { error: insertError } = await supabase
          .from("abandoned_cart")
          .insert(abandonedCartData);

        if (insertError) {
          console.error(
            `Error inserting reservation ${reservation.id} to abandoned_cart:`,
            insertError
          );
          stats.errorCount++;
          stats.errors.push(
            `Error inserting reservation ${reservation.id}: ${insertError.message}`
          );
          continue;
        }

        // Liberar el cupo del turno antes de eliminar la reserva
        const { data: reservaItems, error: itemsError } = await supabase
          .from("reserva_items")
          .select("cantidad, item_type")
          .eq("reserva_id", reservation.id);

        if (itemsError) {
          console.error(
            `Error fetching reservation items for ${reservation.id}:`,
            itemsError
          );
          stats.errorCount++;
          stats.errors.push(
            `Error fetching reservation items for ${reservation.id}: ${itemsError.message}`
          );
          continue;
        }

        // Calcular el total de personas que se liberan (solo tarifas cuentan como personas)
        const personasALiberar =
          reservaItems?.reduce((total, item) => {
            return total + (item.item_type === "tarifa" ? item.cantidad : 0);
          }, 0) || 0;

        if (personasALiberar > 0) {
          // Actualizar el cupo disponible del turno
          const { error: updateCupoError } = await supabase.rpc(
            "liberar_cupo_turno",
            {
              p_turno_id: reservation.turno_id,
              p_personas_a_liberar: personasALiberar,
            }
          );

          if (updateCupoError) {
            console.error(
              `Error liberating cupo for turno ${reservation.turno_id}:`,
              updateCupoError
            );
            stats.errorCount++;
            stats.errors.push(
              `Error liberating cupo for turno ${reservation.turno_id}: ${updateCupoError.message}`
            );
            continue;
          }
        }

        // Eliminar de reservas
        const { error: deleteError } = await supabase
          .from("reservas")
          .delete()
          .eq("id", reservation.id);

        if (deleteError) {
          console.error(
            `Error deleting reservation ${reservation.id} from reservas:`,
            deleteError
          );
          stats.errorCount++;
          stats.errors.push(
            `Error deleting reservation ${reservation.id}: ${deleteError.message}`
          );
          continue;
        }

        stats.movedCount++;
      } catch (error) {
        console.error(`Error processing reservation ${reservation.id}:`, error);
        stats.errorCount++;
        stats.errors.push(
          `Error processing reservation ${reservation.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return stats;
  } catch (error) {
    console.error("Unexpected error in moveAbandonedReservations:", error);
    stats.errors.push(
      `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return stats;
  }
}

// Función para recuperar una reserva desde abandoned_cart (para webhooks de pago tardío)
export async function recoverAbandonedReservation(codigoReserva: string) {
  try {
    // Buscar en abandoned_cart
    const { data: abandonedReservation, error: fetchError } = await supabase
      .from("abandoned_cart")
      .select("*")
      .eq("codigo_reserva", codigoReserva)
      .single();

    if (fetchError || !abandonedReservation) {
      return null;
    }

    // Preparar datos para restaurar en reservas
    const reservationData = {
      turno_id: abandonedReservation.turno_id,
      agencia_id: abandonedReservation.agencia_id,
      cliente_id: abandonedReservation.cliente_id,
      monto_total: abandonedReservation.monto_total,
      pago_referencia: abandonedReservation.pago_referencia,
      created_at: abandonedReservation.created_at,
      updated_at: new Date().toISOString(),
      estado: "confirmada", // Cambiar a confirmada
      expires_at: abandonedReservation.expires_at,
      payment_intent_id: abandonedReservation.payment_intent_id,
      actividad_id: abandonedReservation.actividad_id,
      pago_id: abandonedReservation.pago_id,
      codigo_reserva: abandonedReservation.codigo_reserva,
      cancelled_at: null, // Asegurar que no tenga cancelled_at cuando se confirma
    };

    // Insertar en reservas
    const { data: newReservation, error: insertError } = await supabase
      .from("reservas")
      .insert(reservationData)
      .select()
      .single();

    if (insertError) {
      console.error(
        `Error restoring reservation ${codigoReserva}:`,
        insertError
      );
      return null;
    }

    // Ocupar el cupo del turno nuevamente
    const { data: reservaItems, error: itemsError } = await supabase
      .from("reserva_items")
      .select("cantidad, item_type")
      .eq("reserva_id", newReservation.id);

    if (itemsError) {
      console.error(
        `Error fetching reservation items for ${codigoReserva}:`,
        itemsError
      );
      // No fallamos aquí porque la reserva ya se restauró
    } else {
      // Calcular el total de personas que se ocupan (solo tarifas cuentan como personas)
      const personasAOcupar =
        reservaItems?.reduce((total, item) => {
          return total + (item.item_type === "tarifa" ? item.cantidad : 0);
        }, 0) || 0;

      if (personasAOcupar > 0) {
        // Actualizar el cupo disponible del turno
        const { error: updateCupoError } = await supabase.rpc(
          "ocupar_cupo_turno",
          {
            p_turno_id: abandonedReservation.turno_id,
            p_personas_a_ocupar: personasAOcupar,
          }
        );

        if (updateCupoError) {
          console.error(
            `Error occupying cupo for turno ${abandonedReservation.turno_id}:`,
            updateCupoError
          );
          // No fallamos aquí porque la reserva ya se restauró
        } else {
        }
      }
    }

    // Eliminar de abandoned_cart
    const { error: deleteError } = await supabase
      .from("abandoned_cart")
      .delete()
      .eq("id", abandonedReservation.id);

    if (deleteError) {
      console.error(
        `Error deleting from abandoned_cart for ${codigoReserva}:`,
        deleteError
      );
      // No retornamos null aquí porque la reserva ya se restauró
    }

    return newReservation;
  } catch (error) {
    console.error(
      `Error recovering abandoned reservation ${codigoReserva}:`,
      error
    );
    return null;
  }
}
