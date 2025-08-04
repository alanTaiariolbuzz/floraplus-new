"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ActividadesTabs from "@/components/Productos/Actividades/ActividadesTabs";
import { Box, CircularProgress } from "@mui/material";

interface Activity {
  id: string;
  titulo: string;
  titulo_en: string;
  descripcion: string;
  descripcion_en: string;
  estado: string;
  es_privada: boolean;
  imagen: string;
  cronograma: any[];
  tarifas: any[];
  adicionales: number[];
  transportes: number[];
  descuentos: number[];
  detalles: {
    minimo_reserva: number;
    limite_reserva_minutos: number | null;
    umbral_limite_personas: number | null;
    umbral_limite_minutos: number | null;
    umbral_limite_tipo: string | null;
  };
}

export default function EditActivityPage() {
  const params = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/actividades?id=${params.id}`);
        if (!response.ok) {
          throw new Error("Error al cargar la actividad");
        }
        const data = await response.json();
        setActivity(data?.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchActivity();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <p>Error: {error}</p>
      </Box>
    );
  }

  return (
    <div>
      <ActividadesTabs initialData={activity} mode="edit" />
    </div>
  );
}
