"use client";
// components/Productos/Actividades/ActividadesTabs.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Card,
  Tabs,
  Tab,
  Box,
  Typography,
  ButtonGroup,
  Button,
  Paper,
} from "@mui/material";
import InformationTab from "./CreateActivitySteps/InformationTab";
import TarifasTab from "./CreateActivitySteps/TarifasTab";
import HorariosTab from "./CreateActivitySteps/HorariosTab";
import { Schedule } from "./CreateActivitySteps/HorariosTab";
import { Tarifa } from "./CreateActivitySteps/TarifasTab";
import DetallesTab from "./CreateActivitySteps/DetallesTab";
import AdicionalesTab, {
  AdicionalesTabRef,
} from "./CreateActivitySteps/AdicionalesTab";
import TransportesTab, {
  TransportesTabRef,
} from "./CreateActivitySteps/TransportesTab";
import DescuentoTab, {
  DescuentoTabRef,
} from "./CreateActivitySteps/DescuentoTab";

import { GridPaginationModel } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";

interface ActivityFormTabsProps {
  initialData?: any;
  mode?: "create" | "edit";
}

const ActivityFormTabs = ({
  initialData,
  mode = "create",
}: ActivityFormTabsProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [cronograma, setCronograma] = useState<Schedule[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const adicionalesTabRef = useRef<AdicionalesTabRef>(null);
  const transportesTabRef = useRef<TransportesTabRef>(null);
  const descuentosTabRef = useRef<DescuentoTabRef>(null);
  const [forceRefreshAdicionales, setForceRefreshAdicionales] = useState(false);

  // Initialize state with initialData if provided
  const [activityData, setActivityData] = useState({
    titulo: initialData?.titulo || "",
    titulo_en: initialData?.titulo_en || "",
    descripcion: initialData?.descripcion || "",
    descripcion_en: initialData?.descripcion_en || "",
    estado: initialData?.estado || "borrador",
    es_privada: initialData?.es_privada || false,
    imagen: initialData?.imagen || "",
    cronograma: initialData?.cronograma || ([] as Schedule[]),
    tarifas: initialData?.tarifas || ([] as Tarifa[]),
    adicionales: initialData?.adicionales || ([] as number[]),
    transportes: initialData?.transportes || ([] as number[]),
    descuentos: initialData?.descuentos || ([] as number[]),
    detalles: initialData?.detalles || {
      minimo_reserva: 1,
      limite_reserva_minutos: null,
      umbral_limite_personas: null,
      umbral_limite_minutos: null,
      umbral_limite_tipo: null,
    },
  });

  // Initialize cronograma and tarifas from initialData
  useEffect(() => {
    if (initialData?.cronograma) {
      setCronograma(initialData.cronograma);
    }
    if (initialData?.tarifas) {
      setTarifas(initialData.tarifas);
    }
  }, [initialData]);

  const isFormValid = useCallback(() => {
    // Verificar título y descripción (al menos en un idioma)
    const hasTitle = Boolean(activityData.titulo || activityData.titulo_en);
    const hasDescription = Boolean(
      activityData.descripcion || activityData.descripcion_en
    );

    // Verificar imagen
    const hasImage = Boolean(activityData.imagen);

    // Verificar horarios
    const hasSchedule =
      activityData.cronograma && activityData.cronograma.length > 0;

    // Verificar tarifas
    const hasTariff = activityData.tarifas && activityData.tarifas.length > 0;

    return hasTitle && hasDescription && hasImage && hasSchedule && hasTariff;
  }, [activityData]);

  // Agrega este handler para actualizar detalles
  const handleDetallesChange = useCallback(
    (newValues: {
      minimo_reserva: number;
      limite_reserva_minutos: number | null;
      umbral_limite_personas: number | null;
      umbral_limite_minutos: number | null;
      umbral_limite_tipo: string | null;
    }) => {
      setActivityData((prev) => {
        const newData = {
          ...prev,
          detalles: newValues,
        };

        return newData;
      });
    },
    []
  );
  // Sincronizar cuando cambia cronograma
  useEffect(() => {
    setActivityData((prev) => ({
      ...prev,
      cronograma: cronograma,
    }));
  }, [cronograma]);

  // Sincronizar tarifas si las tienes
  useEffect(() => {
    setActivityData((prev) => ({
      ...prev,
      tarifas: tarifas,
    }));
  }, [tarifas]);

  const handleFieldChange = useCallback(
    (field: string, value: string | boolean) => {
      setActivityData((prev) => {
        const newData = { ...prev, [field]: value };

        return newData;
      });
    },
    []
  );

  // Manejo de carga de imagen
  const handleImageUpload = useCallback((file: string | File) => {
    if (typeof file === "string") {
      setActivityData((prev) => ({
        ...prev,
        imagen: file,
      }));
    } else {
      convertToBase64(file).then((base64) => {
        setActivityData((prev) => ({
          ...prev,
          imagen: base64,
        }));
      });
    }
  }, []);

  // Convertir archivo a base64
  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const handleAdicionalesChange = useCallback((selectedIds: number[]) => {
    setActivityData((prev) => ({
      ...prev,
      adicionales: selectedIds,
    }));
  }, []);

  const handleTransportesChange = useCallback((selectedIds: number[]) => {
    setActivityData((prev) => {
      const newState = {
        ...prev,
        transportes: selectedIds,
      };

      return newState;
    });
  }, []);

  const handleDescuentosChange = useCallback((selectedIds: number[]) => {
    setActivityData((prev) => {
      const newState = {
        ...prev,
        descuentos: selectedIds,
      };

      return newState;
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSubmit = async () => {
    try {
      // Validación de título y descripción (al menos en un idioma)
      if (!activityData.titulo && !activityData.titulo_en) {
        alert("Debe ingresar al menos un título (en español o inglés)");
        return;
      }

      if (!activityData.descripcion && !activityData.descripcion_en) {
        alert("Debe ingresar al menos una descripción (en español o inglés)");
        return;
      }

      // Validación de imagen
      if (!activityData.imagen) {
        alert("Debe seleccionar una imagen para la actividad");
        return;
      }

      let imagenFinal = activityData.imagen;

      // Verifica si imagenFinal es base64
      if (imagenFinal && imagenFinal.startsWith("data:image")) {
        imagenFinal = imagenFinal.split(",")[1]; // Extrae solo la parte base64
      }

      // Get selected adicionales from the ref
      const selectedAdicionales =
        adicionalesTabRef.current?.getSelectedAdicionales() || [];

      // Limpiar detalles: eliminar campos null o undefined
      let detallesLimpios = undefined;
      if (activityData.detalles && typeof activityData.detalles === "object") {
        detallesLimpios = Object.fromEntries(
          Object.entries(activityData.detalles).filter(
            ([, v]) => v !== null && v !== undefined
          )
        );
        // Si no queda ningún campo, no enviar detalles
        if (Object.keys(detallesLimpios).length === 0) {
          detallesLimpios = undefined;
        }
      }

      // Construir payload solo con los campos editables en modo edición
      let payload: any;
      if (mode === "edit") {
        payload = {
          titulo: activityData.titulo,
          titulo_en: activityData.titulo_en,
          descripcion: activityData.descripcion,
          descripcion_en: activityData.descripcion_en,
          es_privada: activityData.es_privada,
          imagen: imagenFinal,
          ...(detallesLimpios ? { detalles: detallesLimpios } : {}),
          adicionales: selectedAdicionales,
        };
      } else {
        // Modo creación: enviar todo
        payload = {
          titulo: activityData.titulo,
          titulo_en: activityData.titulo_en,
          descripcion: activityData.descripcion,
          descripcion_en: activityData.descripcion_en,
          estado: activityData.estado,
          es_privada: activityData.es_privada,
          imagen: imagenFinal,
          cronograma: activityData.cronograma,
          tarifas: activityData.tarifas,
          adicionales: selectedAdicionales,
          transportes: activityData.transportes,
          descuentos: activityData.descuentos,
          ...(detallesLimpios ? { detalles: detallesLimpios } : {}),
        };
      }

      const url =
        mode === "edit"
          ? `/api/actividades?id=${initialData.id}`
          : "/api/actividades";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al guardar la actividad");
      }

      const data = await response.json();
      console.log("data en actividades")
      console.log(data)
      const message =
        mode === "edit"
          ? "Actividad actualizada exitosamente"
          : "Actividad creada exitosamente";
      router.push(
        `/productos/actividades?toast=${encodeURIComponent(message)}`
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar la actividad");
    }
  };

  const TabPanel = ({
    children,
    value,
    index,
  }: {
    children: React.ReactNode;
    value: number;
    index: number;
  }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );

  const [selectedAdicionales, setSelectedAdicionales] = useState<number[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 8,
  });

  const handleCancel = () => {
    router.push("/productos/actividades");
  };

  // Función para forzar refresco de adicionales
  const handleRefreshAdicionales = useCallback(() => {
    setForceRefreshAdicionales(true);
    // Resetear después de un breve delay
    setTimeout(() => setForceRefreshAdicionales(false), 100);
  }, []);

  // Calcular índices de tabs dinámicamente según el modo
  const getTabIndex = (baseIndex: number) => {

    return baseIndex;
  };

  return (
    <Card sx={{ maxWidth: 1200, margin: "auto", mt: 4 }}>
      <Paper square elevation={0} sx={{ pl: 2, pr: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Tabs de creación de actividad"
        >
          <Tab label="Información" />
          <Tab label="Horario" />
          <Tab label="Tarifas" />
          <Tab label="Mas Detalles" />
          <Tab label="adicionales" />
        </Tabs>
      </Paper>

      {/* Información */}
      <TabPanel value={activeTab} index={getTabIndex(0)}>
        <InformationTab
          titulo={activityData.titulo}
          titulo_en={activityData.titulo_en}
          descripcion={activityData.descripcion}
          descripcion_en={activityData.descripcion_en}
          es_privada={activityData.es_privada}
          imagen={activityData.imagen}
          onFieldChange={handleFieldChange}
          onImageUpload={handleImageUpload}
        />
      </TabPanel>

      {/* Tabs solo para creación */}

        <>
          <TabPanel value={activeTab} index={getTabIndex(1)}>
            <HorariosTab
              cronograma={cronograma}
              onCronogramaChange={setCronograma}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={getTabIndex(2)}>
            <TarifasTab tarifas={tarifas} onTarifasChange={setTarifas} />
          </TabPanel>
        </>

      {/* Más Detalles */}
      <TabPanel value={activeTab} index={getTabIndex(3)}>
        <DetallesTab
          initialValues={activityData.detalles}
          onChange={handleDetallesChange}
        />
      </TabPanel>

      {/* Adicionales */}
      <TabPanel value={activeTab} index={getTabIndex(4)}>
        <AdicionalesTab
          ref={adicionalesTabRef}
          selectedAdicionales={selectedAdicionales}
          onChange={setSelectedAdicionales}
          paginationModel={paginationModel}
          onPaginationChange={setPaginationModel}
          forceRefresh={forceRefreshAdicionales}
        />
      </TabPanel>

      <Box sx={{ p: 3, display: "flex", justifyContent: "space-between" }}>
        <ButtonGroup>
          <Button
            sx={{ mr: 1, borderRadius: "4px" }}
            variant="contained"
            disabled={activeTab === 0}
            onClick={() => setActiveTab((prev) => prev - 1)}
          >
            Anterior
          </Button>
          <Button
            sx={{ borderRadius: "4px" }}
            variant="contained"
            disabled={
              (mode === "edit" && activeTab === 2) ||
              (mode !== "edit" && activeTab === 4)
            }
            onClick={() => setActiveTab((prev) => prev + 1)}
          >
            Siguiente
          </Button>
        </ButtonGroup>

        <ButtonGroup>
          <p
            className="px-4 mr-4 py-2 cursor-pointer font-medium text-base text-[#9E9E9E] \
            leading-[1.75] tracking-[0.02857em] uppercase "
            onClick={handleCancel}
          >
            CANCELAR
          </p>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid()}
            sx={{
              backgroundColor: isFormValid() ? "primary.main" : "grey.400",
              "&:hover": {
                backgroundColor: isFormValid() ? "primary.dark" : "grey.400",
              },
            }}
          >
            Guardar Actividad
          </Button>
        </ButtonGroup>
      </Box>
    </Card>
  );
};

export default ActivityFormTabs;
