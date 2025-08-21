"use client";

import { FC, useEffect, useState } from "react";
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import HourEdit from "@/public/icons/modificacion-temp/hour-edit.svg";
import Cancel from "@/public/icons/modificacion-temp/cancel.svg";
import CupoEdit from "@/public/icons/modificacion-temp/cupo-edit.svg";
import HourBlock from "@/public/icons/modificacion-temp/hour-block.svg";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { useToast } from "../nueva/components/ToastContext";

interface ModificacionTemporal {
  id: number;
  tipo_modificacion: string;
  actividad_id: number | null;
  fecha_desde: string;
  fecha_hasta: string;
  hora_inicio_actual: string | null;
  hora_inicio_nueva: string | null;
  horario_bloquear: number | null;
  nuevos_cupos_totales: number | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  activo: boolean;
  cupo_actual: number | null;
  horario_id: number | null;
  agencia_id: number | null;
  turno_id: number | null;
  actividad?: {
    nombre: string;
  };
}

const getSubtitulo = (tipo: string): string => {
  switch (tipo) {
    case "BLOQUEAR_HORARIO":
      return "Horario bloqueado";
    case "CAMBIAR_HORA_INICIO":
      return "Cambio de un horario de inicio";
    case "CAMBIAR_CUPOS":
      return "Cambio de cupos disponibles";
    case "BLOQUEAR_ACTIVIDAD":
      return "Bloquear actividad";
    case "BLOQUEAR_TODAS":
      return "Bloquear todas las actividades";
    default:
      return "";
  }
};

const formatDate = (dateString: string): string => {
  try {
    // Limpiar la fecha si viene con formato ISO
    let cleanDate = dateString;
    if (dateString.includes("T")) {
      cleanDate = dateString.split("T")[0];
    }

    // Crear la fecha usando componentes individuales para evitar problemas de zona horaria
    const [year, month, day] = cleanDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Formatear sin especificar timezone para mostrar exactamente como fue seleccionada
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error en formatDate:", error, { dateString });
    return dateString;
  }
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString("es-AR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const ModificacionDetalles: FC<{ modificacion: ModificacionTemporal }> = ({
  modificacion,
}) => {
  switch (modificacion.tipo_modificacion) {
    case "BLOQUEAR_HORARIO":
      return (
        <Typography variant="h6" className="">
          <span className="line-through">
            {formatTime(modificacion.horario_bloquear?.toString() || "")}
          </span>
        </Typography>
      );
    case "CAMBIAR_HORA_INICIO":
      return (
        <Typography variant="h6" className="">
          <span className="line-through">
            {formatTime(modificacion.hora_inicio_actual || "")}
          </span>
          <ArrowBackIcon
            sx={{ fontSize: 16, rotate: "180deg", margin: "0 7px" }}
          />
          {formatTime(modificacion.hora_inicio_nueva || "")}
        </Typography>
      );
    case "CAMBIAR_CUPOS":
      return (
        <Typography variant="h6" className="">
          <span className="line-through">{modificacion.cupo_actual}</span>
          <ArrowBackIcon
            sx={{ fontSize: 16, rotate: "180deg", margin: "0 7px" }}
          />
          {modificacion.nuevos_cupos_totales}
        </Typography>
      );
    default:
      return null;
  }
};

const ModificacionSkeleton: FC = () => {
  return (
    <div className="w-full flex flex-col bg-white border border-[#E0E0E0] p-4 rounded-[8px]">
      <div className="flex flex-col w-full">
        <div className="w-full border-b border-[#E0E0E0] pb-4 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" width={200} height={24} />
          </div>
          <Skeleton variant="circular" width={24} height={24} />
        </div>
        <div className="flex justify-between items-start h-[80px]">
          <div className="flex flex-row justify-between w-full items-center h-full">
            <div>
              <Skeleton variant="text" width={150} height={20} />
              <div className="flex items-center gap-2 mt-4">
                <Skeleton variant="circular" width={18} height={18} />
                <Skeleton variant="text" width={120} height={20} />
              </div>
              <Skeleton variant="text" width={180} height={24} />
            </div>

            <div className="flex flex-row gap-4">
              <div>
                <Skeleton variant="text" width={40} height={20} />
                <Skeleton variant="text" width={80} height={24} />
              </div>
              <div>
                <Skeleton variant="text" width={40} height={20} />
                <Skeleton variant="text" width={80} height={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModificacionesList: FC = () => {
  const [modificaciones, setModificaciones] = useState<ModificacionTemporal[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityTitles, setActivityTitles] = useState<Record<number, string>>(
    {}
  );
  const [hasActivities, setHasActivities] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modificacionToDelete, setModificacionToDelete] = useState<
    number | null
  >(null);
  const router = useRouter();
  const { showToast } = useToast();

  const fetchActivityTitle = async (actividad_id: number) => {
    try {
      const response = await fetch(`/api/actividades?id=${actividad_id}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data.titulo;
    } catch (error) {
      console.error(
        `Error fetching activity title for ID ${actividad_id}:`,
        error
      );
      return null;
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/actividades");
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHasActivities(data.data && data.data.length > 0);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchModificaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/turnos/modificacionesTemporarias");
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setModificaciones(data.data);

      // Fetch activity titles for all modifications
      const titles: Record<number, string> = {};
      for (const mod of data.data) {
        if (mod.actividad_id) {
          const title = await fetchActivityTitle(mod.actividad_id);
          if (title) {
            titles[mod.actividad_id] = title;
          }
        }
      }
      setActivityTitles(titles);
    } catch (error) {
      console.error("Error fetching modificaciones:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar las modificaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchModificaciones();
  }, []);

  const handleDeleteClick = (id: number) => {
    setModificacionToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!modificacionToDelete) return;

    try {
      const response = await fetch(
        `/api/turnos/modificacionesTemporarias?id=${modificacionToDelete}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Remove the item from the local state immediately
      setModificaciones((prevModificaciones) =>
        prevModificaciones.filter((mod) => mod.id !== modificacionToDelete)
      );

      // Show success toast with reversion information
      const mensaje = data.reversion
        ? `Eliminaste exitosamente la modificación temporal. ${data.reversion.turnosModificados} turnos revertidos.`
        : "Eliminaste exitosamente la modificación temporal";

      showToast(mensaje);
    } catch (error) {
      console.error("Error deleting modificacion:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al eliminar la modificación"
      );
    } finally {
      setDeleteModalOpen(false);
      setModificacionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setModificacionToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((index) => (
          <ModificacionSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const handleCreate = () => {
    router.push("/gestion-dinamica/nueva");
  };

  if (modificaciones.length === 0) {
    return (
      <div>
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Modificiones temporales
        </Typography>
        <div className="border border-[#E0E0E0] rounded-[8px] mt-6">
          <div className="bg-[#fafafa] h-[70vh] w-[100%] flex flex-col items-center justify-center border-[16px] rounded-[8px] border-white">
            <Image
              src="/icons/mail-error.svg"
              alt="Mail Error"
              width={21}
              height={21}
            />

            {hasActivities && (
              <Typography variant="body1" gutterBottom sx={{ py: "12px" }}>
                No tienes modificaciones temporales
              </Typography>
            )}

            {!hasActivities && (
              <Typography variant="body1" gutterBottom sx={{ py: "12px" }}>
                No tienes ninguna actividad para modificar.
              </Typography>
            )}

            {hasActivities && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                Crear modificación temporal
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center bg-[#FAFAFA] ">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Modificaciones temporales
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
        >
          Crear modificación temporal
        </Button>
      </div>
      {modificaciones.map((modificacion) => (

    
        <div
          key={modificacion.id}
          className="w-full flex flex-col bg-white border border-[#E0E0E0] p-4 rounded-[8px]"
        >
          <div className="flex flex-col w-full">
            <div className="w-full border-b border-[#E0E0E0] pb-4 flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "500" }}
                  className=""
                >
                  {modificacion.tipo_modificacion === "BLOQUEAR_TODAS"
                    ? "Todas las actividades"
                    : modificacion.actividad_id
                      ? activityTitles[modificacion.actividad_id] ||
                        "Cargando..."
                      : "Sin actividad"}
                </Typography>
              </div>
              <Button
                color="error"
                sx={{
                  minWidth: "auto",
                  padding: "0px",
                  margin: "0px",
                }}
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteClick(modificacion.id)}
              ></Button>
            </div>
            <div className="flex justify-between items-start h-[80px]">
              <div className="flex flex-row justify-between w-full items-center h-full">
                {modificacion.tipo_modificacion !== "BLOQUEAR_TODAS" &&
                  modificacion.actividad && (
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "500" }}
                      className="mb-2"
                    >
                      {modificacion.actividad.nombre}
                    </Typography>
                  )}
                <div>
                  <div className="flex items-center gap-2 mt-4">
                    {modificacion.tipo_modificacion ===
                      "CAMBIAR_HORA_INICIO" && (
                      <Image
                        src={HourEdit}
                        alt="Cambiar hora"
                        className="w-[18px] h-[18px]"
                      />
                    )}
                    {modificacion.tipo_modificacion === "BLOQUEAR_HORARIO" && (
                      <Image
                        src={HourBlock}
                        alt="Bloquear horario"
                        className="w-[18px] h-[18px]"
                      />
                    )}
                    {modificacion.tipo_modificacion ===
                      "BLOQUEAR_ACTIVIDAD" && (
                      <Image
                        src={Cancel}
                        alt="Bloquear actividad"
                        className="w-[18px] h-[18px]"
                      />
                    )}
                    {modificacion.tipo_modificacion === "CAMBIAR_CUPOS" && (
                      <Image
                        src={CupoEdit}
                        alt="Cambiar cupos"
                        className="w-[18px] h-[18px]"
                      />
                    )}
                    {modificacion.tipo_modificacion === "BLOQUEAR_TODAS" && (
                      <Image
                        src={Cancel}
                        alt="Bloquear todo"
                        className="w-[18px] h-[18px]"
                      />
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "500" }}
                      className="text-[#646464]"
                    >
                      {modificacion.tipo_modificacion === "BLOQUEAR_TODAS"
                        ? "Bloquear todas las actividades"
                        : getSubtitulo(modificacion.tipo_modificacion)}
                    </Typography>
                  </div>
                  <ModificacionDetalles modificacion={modificacion} />
                </div>

                <div className="flex flex-row gap-4">
                  <div>
                    <Typography variant="subtitle2" color="#666666">
                      Desde
                    </Typography>{" "}
                    <Typography variant="h6">
                      {formatDate(modificacion.fecha_desde)}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="#666666">
                      Hasta
                    </Typography>{" "}
                    <Typography variant="h6">
                      {formatDate(modificacion.fecha_hasta)}{" "}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de confirmación */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ padding: "70px" }}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-6">
              <ReportProblemIcon sx={{ fontSize: 48, color: "#FF9800" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "500", textAlign: "center" }}
              >
                ¿Eliminar modificación temporal?
              </Typography>
            </div>

            <div className="flex flex-row gap-3 items-center justify-center uppercase">
              <Button
                variant="text"
                onClick={handleDeleteCancel}
                sx={{
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "16px",
                }}
              >
                Mejor no
              </Button>
              <Button
                variant="contained"
                onClick={handleDeleteConfirm}
                sx={{
                  backgroundColor: "#f47920",
                  "&:hover": {
                    backgroundColor: "#f47920",
                  },
                  textTransform: "uppercase",
                  fontSize: "16px",
                }}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
