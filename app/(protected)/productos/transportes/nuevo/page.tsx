"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import InfoTab from "../../../../../components/Productos/TransporteTabs/InfoTab";
import HorarioTab from "../../../../../components/Productos/TransporteTabs/HorarioTab";
import InventarioTab from "@/components/Productos/TransporteTabs/InventarioTab";
import MensajeTab from "@/components/Productos/TransporteTabs/MensajeTab";

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
}

const CrearTransportePage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
  });

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };

  const validarCampos = () => {
    const errores: string[] = [];

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
    setLoading(true);

    if (!validarCampos()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/transportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transporteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear transporte");
      }

      router.push("/productos/transportes");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Crear Nuevo Transporte
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TabContext value={String(activeTab)}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
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
          />
        </TabPanel>

        <TabPanel value="2">
          <InventarioTab
            transporteData={transporteData}
            setTransporteData={setTransporteData}
          />
        </TabPanel>

        <TabPanel value="3">
          <MensajeTab
            transporteData={transporteData}
            setTransporteData={(prev) => ({
              ...prev,
              mensaje: transporteData.mensaje,
            })}
          />
        </TabPanel>
      </TabContext>

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          disabled={
            !transporteData.titulo || !transporteData.direccion || loading
          }
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Creando..." : "Crear Transporte"}
        </Button>
        <Button variant="outlined" onClick={() => router.back()}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default CrearTransportePage;
