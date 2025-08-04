import { NextResponse } from "next/server";
import { getTurnos } from "../services/turnoService";

interface Turno {
  cupo_disponible: number;
  cupo_total: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { horario_id, fecha_desde, fecha_hasta, actividad_id } = body;

    // Obtener turnos que se verían afectados
    const turnos = await getTurnos({
      horario_id,
      fecha_desde,
      fecha_hasta,
      actividad_id,
      incluir_borrados: false,
    });

    if (!Array.isArray(turnos)) {
      console.error("Expected array of turnos but got:", turnos);
      return NextResponse.json(
        {
          code: 500,
          message: "Error en el formato de respuesta",
        },
        { status: 500 }
      );
    }

    // Contar solo los turnos que tienen reservas (cupo_disponible < cupo_total)
    const turnosConReservas = turnos.filter((turno: Turno) => {
      const tieneReservas = turno.cupo_disponible < turno.cupo_total;

      return tieneReservas;
    });

    return NextResponse.json({
      code: 200,
      message: "Verificación exitosa",
      affected_reservations: turnosConReservas.length,
      total_turnos: turnos.length,
      turnos_con_reservas: turnosConReservas,
    });
  } catch (error) {
    console.error("Error verificando reservas:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error al verificar reservas",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
