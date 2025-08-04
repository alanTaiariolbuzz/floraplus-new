import { useEffect, useState, useCallback } from "react";

export interface ReservaItem {
  item_type: string;
  cantidad: number;
}

export interface Reserva {
  id: number;
  codigo_reserva: string;
  turno: {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
  };
  cliente: {
    nombre: string;
    apellido: string;
  };
  actividad_titulo: string;
  reserva_items: ReservaItem[];
}

export const useReservasHoy = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reservas"); // O tu endpoint real
      const data = await res.json();

      const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const filtradas = data.data.filter((reserva: Reserva) => {
        const fechaReserva = reserva.turno.fecha.slice(0, 10);
        return fechaReserva === hoy;
      });

      setReservas(filtradas);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error al traer reservas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  return { reservas, loading, lastUpdate, refresh: fetchReservas };
};
