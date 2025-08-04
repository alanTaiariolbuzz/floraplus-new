import { useState, useEffect } from "react";
import { Sale } from "@/components/Dashboard/types";

export const useVentasHoy = () => {
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVentasHoy = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

        const response = await fetch(`/api/reservas?created_at=${today}`);
        if (!response.ok) {
          throw new Error("Error al cargar ventas");
        }

        const result = await response.json();

        if (result.data && Array.isArray(result.data)) {
          // Add console log to see the raw reservation data

          // Transformar los datos de reservas a formato Sale
          const ventasTransformadas: Sale[] = result.data.map(
            (reserva: any) => {
              // Use activity date (turno.fecha) instead of sale date (created_at)
              const activityDate = reserva.turno?.fecha
                ? new Date(reserva.turno.fecha).toLocaleDateString("es-AR")
                : new Date(reserva.created_at).toLocaleDateString("es-AR");

              return {
                client:
                  `${reserva.cliente?.nombre || ""} ${reserva.cliente?.apellido || ""}`.trim() ||
                  "Cliente sin nombre",
                amount:
                  typeof reserva.monto_total === "number"
                    ? reserva.monto_total
                    : 0,
                tour: reserva.actividad_titulo || "Sin actividad",
                date: activityDate,
              };
            }
          );

          setVentas(ventasTransformadas);
        } else {
          setVentas([]);
        }
      } catch (err) {
        console.error("Error al obtener ventas del día:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setVentas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVentasHoy();
  }, []);

  return { ventas, loading, error };
};
