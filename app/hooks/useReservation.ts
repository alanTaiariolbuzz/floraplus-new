import { useState } from "react";
import { useApi } from "./useApi";
import type {
  Actividad,
  Turno,
  Tarifa,
  Adicional,
  Transporte,
  ReservaData,
} from "../types/reservation";

export function useReservation(actividadId: string) {
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [selectedTarifas, setSelectedTarifas] = useState<{
    [key: number]: number;
  }>({});
  const [selectedAdicionales, setSelectedAdicionales] = useState<{
    [key: number]: number;
  }>({});
  const [selectedTransportes, setSelectedTransportes] = useState<{
    [key: number]: number;
  }>({});

  const actividadApi = useApi<Actividad>();
  const turnosApi = useApi<Turno[]>();
  const tarifasApi = useApi<Tarifa[]>();
  const adicionalesApi = useApi<Adicional[]>();
  const transportesApi = useApi<Transporte[]>();

  // Cargar datos iniciales
  const loadInitialData = async () => {
    await actividadApi.fetchData(`/api/actividades?id=${actividadId}`);
    await turnosApi.fetchData(`/api/turnos?actividad_id=${actividadId}`);
    await tarifasApi.fetchData(`/api/tarifas?actividad_id=${actividadId}`);
    await adicionalesApi.fetchData(
      `/api/adicionales?actividad_id=${actividadId}`
    );
    await transportesApi.fetchData(
      `/api/transportes?actividad_id=${actividadId}`
    );
  };

  // Crear reserva
  const createReserva = async (): Promise<boolean> => {
    if (!selectedTurno) return false;

    const reservaData: ReservaData = {
      turno_id: selectedTurno.turno_id,
      items: [
        ...Object.entries(selectedTarifas).map(([id, cantidad]) => ({
          item_type: "tarifa" as const,
          item_id: Number(id),
          cantidad,
        })),
        ...Object.entries(selectedAdicionales).map(([id, cantidad]) => ({
          item_type: "adicional" as const,
          item_id: Number(id),
          cantidad,
        })),
        ...Object.entries(selectedTransportes).map(([id, cantidad]) => ({
          item_type: "transporte" as const,
          item_id: Number(id),
          cantidad,
        })),
      ],
    };

    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservaData),
      });

      if (!response.ok) {
        throw new Error("Error al crear la reserva");
      }

      return true;
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  };

  return {
    // Estado
    selectedTurno,
    selectedTarifas,
    selectedAdicionales,
    selectedTransportes,

    // APIs
    actividad: actividadApi.data,
    turnos: turnosApi.data,
    tarifas: tarifasApi.data,
    adicionales: adicionalesApi.data,
    transportes: transportesApi.data,

    // Loading states
    isLoading: actividadApi.loading || turnosApi.loading || tarifasApi.loading,

    // Errors
    error: actividadApi.error || turnosApi.error || tarifasApi.error,

    // Actions
    loadInitialData,
    setSelectedTurno,
    setSelectedTarifas,
    setSelectedAdicionales,
    setSelectedTransportes,
    createReserva,
  };
}
