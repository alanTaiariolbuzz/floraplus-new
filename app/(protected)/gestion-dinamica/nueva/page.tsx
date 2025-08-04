"use client";

import { FC, useState } from "react";
import HourEdit from "@/public/icons/modificacion-temp/hour-edit.svg";
import Cancel from "@/public/icons/modificacion-temp/cancel.svg";
import CupoEdit from "@/public/icons/modificacion-temp/cupo-edit.svg";
import HourBlock from "@/public/icons/modificacion-temp/hour-block.svg";
import Image from "next/image";
import { Typography, Box, CircularProgress, Skeleton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { CambiarHoraInicio } from "./components/CambiarHoraInicio";
import { BloquearActividad } from "./components/BloquearActividad";
import { CambiarCupos } from "./components/CambiarCupos";
import { Actividad, ModificacionType } from "./components/types";
import { BloquearHorario } from "./components/BloquearHorario";
import { BloquearTodas } from "./components/BloquearTodas";
import { ToastProvider } from "./components/ToastContext";

interface ModificacionCard {
  tipo: ModificacionType;
  icon: string;
  titulo: string;
  descripcion: string;
  onClick?: () => void;
}

interface ActividadCardProps extends Actividad {
  onClick?: () => void;
}

const modificaciones: ModificacionCard[] = [
  {
    icon: HourEdit,
    tipo: "CAMBIAR_HORA_INICIO",
    titulo: "Cambiar un horario de inicio",
    descripcion:
      "Modifica el horario de inicio de una actividad durante un tiempo determinado.",
  },
  {
    icon: HourBlock,
    tipo: "BLOQUEAR_HORARIO",
    titulo: "Bloquear un horario",
    descripcion:
      "Cierra el horario de una actividad durante un tiempo determinado.",
  },
  {
    icon: Cancel,
    tipo: "BLOQUEAR_ACTIVIDAD",
    titulo: "Bloquear una actividad",
    descripcion:
      "Cancela la venta de una actividad durante un tiempo determinado.",
  },
  {
    icon: CupoEdit,
    tipo: "CAMBIAR_CUPOS",
    titulo: "Cambiar cupos disponibles",
    descripcion:
      "Modifica el inventario de una actividad durante un tiempo determinado.",
  },
  {
    icon: Cancel,
    tipo: "BLOQUEAR_TODAS",
    titulo: "Bloquear todas las actividades",
    descripcion: "Cierra todas las actividades durante un tiempo determinado.",
  },
];

const ModificacionCard: FC<ModificacionCard> = ({
  titulo,
  descripcion,
  icon,
  onClick,
}) => {
  return (
    <div
      className="w-[350px] h-[160px] p-4 bg-white rounded-[8px] hover:shadow-md transition-shadow cursor-pointer border border-[#E0E0E0]"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-row gap-2">
          <Image src={icon} alt={titulo} width={38} height={38} />
        </div>
        <Typography variant="h6">{titulo}</Typography>
        <Typography variant="body2" color="#757575">
          {descripcion}
        </Typography>
      </div>
    </div>
  );
};

const ActividadCard: FC<ActividadCardProps> = ({ titulo, imagen, onClick }) => {
  return (
    <div
      className="w-[350px] min-h-[160px] p-4 bg-white rounded-[8px] hover:shadow-md transition-shadow cursor-pointer border border-[#E0E0E0]"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="w-full h-[85px] relative mb-2">
          <img
            src={imagen || ""}
            alt={titulo}
            className="w-full h-full object-cover rounded-[4px]"
          />
        </div>
        <Typography variant="h6">{titulo}</Typography>
      </div>
    </div>
  );
};

const FormularioModificacion: FC<{
  tipo: ModificacionType;
  actividad: Actividad | null;
}> = ({ tipo, actividad }) => {
  switch (tipo) {
    case "CAMBIAR_HORA_INICIO":
      return <CambiarHoraInicio actividad={actividad} />;
    case "CAMBIAR_CUPOS":
      return <CambiarCupos actividad={actividad} />;
    case "BLOQUEAR_HORARIO":
      return <BloquearHorario actividad={actividad} />;
    case "BLOQUEAR_ACTIVIDAD":
      return <BloquearActividad actividad={actividad} />;
    case "BLOQUEAR_TODAS":
      return <BloquearTodas />;
    default:
      return null;
  }
};

const ModificacionCardSkeleton = () => {
  return (
    <div className="w-[350px] h-[160px] p-4 bg-white rounded-[8px] border border-[#E0E0E0]">
      <div className="flex flex-col h-full">
        <div className="flex flex-row gap-2">
          <Skeleton variant="circular" width={38} height={38} />
        </div>
        <Skeleton variant="text" width="80%" height={32} className="mt-2" />
        <Skeleton variant="text" width="90%" height={20} className="mt-1" />
        <Skeleton variant="text" width="70%" height={20} className="mt-1" />
      </div>
    </div>
  );
};

const ActividadCardSkeleton = () => {
  return (
    <div className="w-[350px] min-h-[160px] p-4 bg-white rounded-[8px] border border-[#E0E0E0]">
      <div className="flex flex-col h-full">
        <Skeleton
          variant="rectangular"
          width="100%"
          height={85}
          className="mb-2 rounded-[4px]"
        />
        <Skeleton variant="text" width="80%" height={32} />
      </div>
    </div>
  );
};

export default function NuevaModificacionPage() {
  const [selectedModificacion, setSelectedModificacion] =
    useState<ModificacionCard | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<Actividad | null>(null);
  const [loading, setLoading] = useState(false);
  const handleModificacionSelect = async (modificacion: ModificacionCard) => {
    setSelectedModificacion(modificacion);
    setActividadSeleccionada(null);
    if (modificacion.tipo !== "BLOQUEAR_TODAS") {
      try {
        setLoading(true);
        const response = await fetch("/api/actividades");
        const data = await response.json();
        setActividades(data.data);
      } catch (error) {
        console.error("Error fetching actividades:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const showActividades =
    selectedModificacion &&
    selectedModificacion.tipo !== "BLOQUEAR_TODAS" &&
    !actividadSeleccionada;
  const showFormulario =
    selectedModificacion &&
    (selectedModificacion.tipo === "BLOQUEAR_TODAS" || actividadSeleccionada);

  return (
    <ToastProvider>
      <div className="my-6 px-12">
        <div className="flex flex-row justify-between items-center bg-[#FAFAFA] ">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Modificación temporal
          </Typography>
        </div>
        <div className="flex flex-row items-center gap-2 my-1">
          <Link
            href={"/gestion-dinamica"}
            style={{
              textDecoration: "none",
              textTransform: "capitalize",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#f47920",
                pt: "4px",
              }}
              gutterBottom
            >
              Modificaciones temporales
            </Typography>
          </Link>
          <ChevronRightIcon fontSize="small" />
          <Link
            href={"/gestion-dinamica/nueva"}
            style={{
              textDecoration: "none",
            }}
          >
            <Typography
              variant="body1"
              onClick={(e) => {
                e.preventDefault();
                setActividadSeleccionada(null);
                setSelectedModificacion(null);
              }}
              sx={{
                color:
                  !selectedModificacion && !actividadSeleccionada
                    ? "#212121"
                    : "#f47920",
              }}
            >
              {selectedModificacion
                ? selectedModificacion.titulo
                : "Tipo de modificación"}
            </Typography>
          </Link>
          {/* if selectedModificacion is === bloquear todas, no mostrar el link */}
          {selectedModificacion &&
            selectedModificacion.tipo !== "BLOQUEAR_TODAS" && (
              <>
                <ChevronRightIcon fontSize="small" />
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActividadSeleccionada(null);
                  }}
                  style={{
                    textDecoration: "none",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: actividadSeleccionada ? "#f47920" : "#212121",
                    }}
                  >
                    {actividadSeleccionada
                      ? actividadSeleccionada.titulo
                      : "Elegir actividad para modificar"}
                  </Typography>
                </Link>
              </>
            )}

          {selectedModificacion &&
            selectedModificacion.tipo === "BLOQUEAR_TODAS" && (
              <>
                <ChevronRightIcon fontSize="small" />
                <Typography variant="body1" sx={{ color: "#212121" }}>
                  Modificar
                </Typography>
              </>
            )}

          {actividadSeleccionada && (
            <>
              <ChevronRightIcon fontSize="small" />
              <Typography
                variant="body1"
                sx={{
                  color: "#212121",
                }}
              >
                Modificar
              </Typography>
            </>
          )}
        </div>
        {selectedModificacion && (
          <div className="mb-5 flex flex-row gap-4">
            <div className="flex flex-col">
              <p className="text-[#646464] font-normal text-xs">
                Tipo de modificación:
              </p>
              <div className="flex flex-row items-center gap-1">
                <Image
                  src={selectedModificacion?.icon}
                  alt={selectedModificacion?.titulo}
                  width={24}
                  height={24}
                />
                <p className="text-[#212121] font-medium text-sm">
                  {selectedModificacion?.titulo}
                </p>
              </div>
            </div>
            {actividadSeleccionada && (
              <div className="flex flex-col border-l border-[#DCDCDC] pl-3 ">
                <p className="text-[#646464] font-normal text-xs">
                  Actividad seleccionada:
                </p>{" "}
                <p className="text-[#212121] font-medium text-sm">
                  {actividadSeleccionada?.titulo}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="mb-5">
          <Typography variant="h6">
            {!selectedModificacion
              ? "¿Qué tipo de modificación temporal vas a hacer?"
              : showActividades
                ? "¿Qué actividad vas a modificar?"
                : ""}
          </Typography>
        </div>
        <div className="flex flex-row flex-wrap gap-4">
          {loading ? (
            !selectedModificacion ? (
              Array(5)
                .fill(0)
                .map((_, index) => <ModificacionCardSkeleton key={index} />)
            ) : showActividades ? (
              Array(6)
                .fill(0)
                .map((_, index) => <ActividadCardSkeleton key={index} />)
            ) : null
          ) : !selectedModificacion ? (
            modificaciones.map((mod) => (
              <ModificacionCard
                key={mod.tipo}
                icon={mod.icon}
                tipo={mod.tipo}
                titulo={mod.titulo}
                descripcion={mod.descripcion}
                onClick={() => handleModificacionSelect(mod)}
              />
            ))
          ) : showActividades ? (
            actividades?.map((actividad, index) => (
              <ActividadCard
                key={index}
                id={actividad.id}
                titulo={actividad.titulo}
                imagen={actividad.imagen}
                onClick={() => setActividadSeleccionada(actividad)}
              />
            ))
          ) : (
            <FormularioModificacion
              tipo={selectedModificacion.tipo}
              actividad={actividadSeleccionada}
            />
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
