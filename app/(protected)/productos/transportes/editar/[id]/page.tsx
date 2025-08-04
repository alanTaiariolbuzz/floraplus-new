// app/productos/transportes/editar/[id]/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";

import HorarioTab from "@/components/Productos/TransporteTabs/HorarioTab";
import InventarioTab from "@/components/Productos/TransporteTabs/InventarioTab";
import MensajeTab from "@/components/Productos/TransporteTabs/MensajeTab";
import InfoTab from "@/components/Productos/TransporteTabs/InfoTab";

interface Horario {
  hora_salida: string;
  hora_llegada: string;
}

interface TransporteState {
  titulo: string;
  direccion: string;
  precio: number;
  cupo_maximo: number;
  limite_horario: boolean;
  limite_horas: number;
  horarios: Horario[];
  mensaje: string;
  actividad_ids: number[];
  activo?: boolean;
}

const EditarTransportePage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [activeTab, setActiveTab] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [transporteData, setTransporteData] = useState<TransporteState>({
    titulo: "",
    direccion: "",
    precio: 0,
    cupo_maximo: 0,
    limite_horario: false,
    limite_horas: 0,
    horarios: [],
    mensaje: "",
    actividad_ids: [],
    activo: false,
  });

  // En tu página de edición ([id]/page.tsx)
  useEffect(() => {
    const cargarDatosTransporte = async () => {
      try {
        const response = await fetch(`/api/transportes?id=${id}`);
        if (!response.ok) throw new Error("Transporte no encontrado");

        const { data } = await response.json();
        const transporte = data?.[0]; // Obtener el primer elemento del array

        if (!transporte) throw new Error("Transporte no existe");

        setTransporteData({
          titulo: transporte.titulo || "",
          direccion: transporte.direccion || "",
          precio: Number(transporte.precio) || 0,
          actividad_ids: transporte.actividad_ids || [],
          cupo_maximo: Number(transporte.cupo_maximo) || 0,
          limite_horario: Boolean(transporte.limite_horario),
          limite_horas: Number(transporte.limite_horas) || 0,
          horarios:
            transporte.horarios?.map((h: any) => ({
              hora_salida: h.hora_salida?.slice(0, 5),
              hora_llegada: h.hora_llegada?.slice(0, 5),
            })) || [],
          mensaje: transporte.mensaje || "",
          activo: Boolean(transporte.activo),
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Error de carga");
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarDatosTransporte();
  }, [id]);

  const validarCampos = () => {
    const errores: string[] = [];
    // Mismas validaciones que en creación
    if (!transporteData.titulo.trim()) errores.push("Título");
    if (!transporteData.direccion.trim()) errores.push("Dirección");
    if (transporteData.precio <= 0) errores.push("Precio válido");
    if (transporteData.cupo_maximo <= 0) errores.push("Cupo máximo válido");
    if (
      transporteData.limite_horario &&
      (transporteData.limite_horas < 1 || transporteData.limite_horas > 24)
    ) {
      errores.push("Límite de horas entre 1 y 24");
    }

    if (errores.length > 0) {
      setError(`Complete: ${errores.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    if (!validarCampos()) {
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/transportes?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transporteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar transporte");
      }

      router.push("/productos/transportes");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Editar Transporte: {transporteData.titulo}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TabContext value={String(activeTab)}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Información" value={0} />
          <Tab label="Horario" value={1} />
          <Tab label="Inventario" value={2} />
          <Tab label="Mensaje" value={3} />
        </Tabs>

        <TabPanel value="0" sx={{ p: 0 }} keepMounted>
          <InfoTab
            transporteData={transporteData}
            setTransporteData={setTransporteData}
          />
        </TabPanel>

        <TabPanel value="1">
          <HorarioTab
            horarios={transporteData.horarios}
            onHorariosChange={(newHorarios) =>
              setTransporteData((prev) => ({ ...prev, horarios: newHorarios }))
            }
            modoEdicion={true}
          />
        </TabPanel>

        <TabPanel value="2">
          <InventarioTab
            transporteData={transporteData}
            setTransporteData={(update) =>
              setTransporteData((prev) => ({
                ...prev,
                ...(typeof update === "function" ? update(prev) : update), // Mantiene las otras propiedades
              }))
            }
          />
        </TabPanel>

        <TabPanel value="3">
          <MensajeTab
            transporteData={transporteData}
            setTransporteData={(update) =>
              setTransporteData((prev) => ({
                ...prev,
                ...(typeof update === "function" ? update(prev) : update),
              }))
            }
          />
        </TabPanel>
      </TabContext>

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          disabled={submitting}
          onClick={handleSubmit}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          variant="contained"
          color="primary"
        >
          {submitting ? "Actualizando..." : "Actualizar Transporte"}
        </Button>
        <Button variant="outlined" onClick={() => router.back()}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default EditarTransportePage;
