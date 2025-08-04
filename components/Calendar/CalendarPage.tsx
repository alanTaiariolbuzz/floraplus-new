// components/CalendarioTurnos.jsx
"use client";
import React, { useEffect, useState } from "react";
import { format, startOfWeek, addDays, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Image from "next/image";
import { CircularProgress, Icon } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import EmptyState from "../Productos/EmptyState";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarX2 } from "lucide-react";

interface Turno {
  turno_id: number;
  actividad_id: number;
  agencia_id: number;
  horario_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_total: number;
  cupo_disponible: number;
  bloqueado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
}

interface ColorGroup {
  claro: string;
  principal: string;
  variante: string;
}

interface TurnosPorDia {
  [fecha: string]: Turno[];
}

interface TurnosPorActividad {
  [actividadId: string]: TurnosPorDia;
}

const CalendarioTurnos = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [actividades, setActividades] = useState<{ [key: string]: Actividad }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>("");

  const search = useSearchParams();
  const startParam = search.get("start");
  const initialDate = startParam
    ? startOfWeek(parseISO(startParam), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });
  const [semanaInicio, setSemanaInicio] = useState(initialDate);
  const [mostrarSinReservas, setMostrarSinReservas] = useState(false);
  const [viewMode, setViewMode] = useState<"semana" | "dia">("semana");
  const colores: ColorGroup[] = [
    {
      // Grupo Verde/Teal
      claro: "#E0F2F1", // Fondo claro (Teal 50)
      principal: "#009688", // Color principal (Teal 500)
      variante: "#A6DBD6", // Variante más suave
    },
    {
      // Grupo Rosa/Purple
      claro: "#F3E5F5", // Fondo claro (Purple 50)
      principal: "#AB47BC", // Color principal (Purple 400)
      variante: "#DDB4E4", // Variante más suave
    },
    {
      // Grupo Azul/Light Blue
      claro: "#E1F5FE", // Fondo claro (Light Blue 50)
      principal: "#29B6F6", // Color principal (Light Blue 400)
      variante: "#A7E1FC", // Variante más suave
    },
    {
      // Grupo Amarillo/Amber
      claro: "#FFF8E1", // Fondo claro (Amber 50)
      principal: "#FFA726", // Variante (Amber 400)
      variante: "#FFE8BE", // Color principal (Amber 500)
    },
  ];
  // .bg-\[\#F3E5F5\] {
  // --tw-bg-opacity: 0.2;
  // background-color: rgb(171 71 188 / var(--tw-bg-opacity, 1));
  // background-color: rgb(171 71 188);

  const router = useRouter();

  useEffect(() => {
    const fetchTurnosYActividades = async () => {
      try {
        setLoading(true);
        const resTurnos = await fetch("/api/turnos");
        if (!resTurnos.ok) throw new Error("Error al cargar turnos");
        const turnosData = await resTurnos.json();

        const turnos = Array.isArray(turnosData?.data) ? turnosData.data : [];
        setTurnos(turnos);

        const actividadIds: string[] = Array.from(
          new Set<string>(turnos.map((t: Turno) => t.actividad_id.toString()))
        );
        const actividadesMap: { [key: string]: Actividad } = {};

        await Promise.all(
          actividadIds.map(async (id: string) => {
            try {
              const res = await fetch(`/api/actividades?id=${id}`);
              if (!res.ok) {
                // Si la actividad no existe (404) o hay otro error, la ignoramos
                console.warn(
                  `Actividad ${id} no encontrada o error al cargarla`
                );
                return;
              }
              const response = (await res.json()) as { data: Actividad };
              actividadesMap[id] = response.data;
            } catch (error) {
              console.error(`Error cargando actividad ${id}:`, error);
            }
          })
        );

        // Filtrar los turnos para mostrar solo los de actividades que existen
        const turnosFiltrados =
          selectedActivity === "all"
            ? turnosAgrupados
            : Object.fromEntries(
                Object.entries(turnosAgrupados).filter(([actividadId]) => {
                  return actividadId === selectedActivity;
                })
              );

        setActividades(actividadesMap);
      } catch (err) {
        console.error(err);
        setError("Hubo un problema al cargar el calendario.");
      } finally {
        setLoading(false);
      }
    };

    fetchTurnosYActividades();
  }, []);

  const diasSemana =
    viewMode === "dia"
      ? [semanaInicio]
      : [...Array(7)].map((_, i) => addDays(semanaInicio, i));

  const turnosAgrupados: TurnosPorActividad = turnos
    .filter((turno) => {
      const fecha = parseISO(turno.fecha);
      const estaEnSemana = diasSemana.some((d) => isSameDay(d, fecha));
      const sinReservas = turno.cupo_disponible === turno.cupo_total;
      return estaEnSemana && (mostrarSinReservas || !sinReservas);
    })
    .reduce((acc: TurnosPorActividad, turno) => {
      const actId = turno.actividad_id.toString();
      const fecha = format(parseISO(turno.fecha), "yyyy-MM-dd");
      if (!acc[actId]) acc[actId] = {};
      if (!acc[actId][fecha]) acc[actId][fecha] = [];
      acc[actId][fecha].push(turno);
      return acc;
    }, {});

  // Filtrar las actividades basado en selectedActivity
  const turnosFiltrados =
    selectedActivity === "all" || selectedActivity === ""
      ? turnosAgrupados
      : Object.fromEntries(
          Object.entries(turnosAgrupados).filter(([actividadId]) => {
            return actividadId === selectedActivity;
          })
        );

  const hayTurnosParaMostrar = Object.keys(turnosFiltrados).length > 0;

  const handlePrevious = () => {
    if (viewMode === "dia") {
      setSemanaInicio(addDays(semanaInicio, -1));
    } else {
      setSemanaInicio(addDays(semanaInicio, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === "dia") {
      setSemanaInicio(addDays(semanaInicio, 1));
    } else {
      setSemanaInicio(addDays(semanaInicio, 7));
    }
  };

  const rangoFechas =
    viewMode === "dia"
      ? format(semanaInicio, "EEEE dd MMM", { locale: es })
      : `${format(semanaInicio, "MMM dd", { locale: es })} - ${format(
          addDays(semanaInicio, 6),
          "MMM dd",
          { locale: es }
        )}`;

  const handleViewModeChange = (newMode: "semana" | "dia") => {
    setViewMode(newMode);

    if (newMode === "dia") {
      const today = new Date();
      const currentWeekStart = semanaInicio;
      const currentWeekEnd = addDays(currentWeekStart, 6);

      if (today >= currentWeekStart && today <= currentWeekEnd) {
        setSemanaInicio(today);
      }
    }
  };

  if (loading)
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className=" bg-[#FAFAFA] py-[20px] px-12">
      <Typography variant="h4" sx={{ fontWeight: "500" }}>
        Calendario
      </Typography>

      <div className="flex items-center justify-between my-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-between gap-2 w-full ">
            <Select
              value={viewMode}
              onChange={(e) =>
                handleViewModeChange(e.target.value as "semana" | "dia")
              }
              size="small"
              sx={{
                minWidth: 120,
                height: "32px",
                ".MuiSelect-select": {
                  padding: "4px 14px",
                },
              }}
            >
              <MenuItem value="semana">Semana</MenuItem>
              <MenuItem value="dia">Día</MenuItem>
            </Select>

            <button
              onClick={handlePrevious}
              className="text-xl px-1"
              aria-label={
                viewMode === "dia" ? "Día anterior" : "Semana anterior"
              }
            >
              <ArrowBackIosNewIcon sx={{ fontSize: "14px" }} />
            </button>
            <button
              onClick={handleNext}
              className="text-xl px-1"
              aria-label={
                viewMode === "dia" ? "Día siguiente" : "Semana siguiente"
              }
            >
              <ArrowForwardIosIcon sx={{ fontSize: "14px" }} />
            </button>
            <span className="font-medium uppercase">{rangoFechas}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <Select
              displayEmpty
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value as string)}
              sx={{
                minWidth: 200,
                maxWidth: 220,
                height: "32px",
                ".MuiSelect-select": {
                  padding: "4px 14px",
                },
              }}
            >
              <MenuItem value="" disabled>
                Filtrar por actividad
              </MenuItem>
              <MenuItem value="all">Todas las actividades</MenuItem>
              {Object.entries(actividades).map(([id, actividad]) => (
                <MenuItem key={id} value={id}>
                  {actividad.titulo}
                </MenuItem>
              ))}
            </Select>
          </div>

          <FormControlLabel
            control={
              <Switch
                checked={mostrarSinReservas}
                onChange={(e) => setMostrarSinReservas(e.target.checked)}
                color="primary"
              />
            }
            label="Mostrar tours sin reservas"
            labelPlacement="start"
          />
        </div>
      </div>

      <div className="overflow-auto rounded-[8px] border border-[#E0E0E0]">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="h-14 pl-4 font-medium w-48 text-left">
                Actividades
              </th>
              {diasSemana.map((dia, idx) => (
                <th
                  key={idx}
                  className="p-2 text-center capitalize text-[14px] font-medium tracking-[0.4px]"
                >
                  {format(dia, "EEE dd/MM", { locale: es })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {hayTurnosParaMostrar ? (
              Object.entries(turnosFiltrados).map(
                ([actividadId, dias], indexFila) => {
                  const actividad = actividades[actividadId];
                  const grupoColor = colores[indexFila % colores.length];

                  return (
                    <tr
                      key={actividadId}
                      className="border-t border-[#E0E0E0] "
                    >
                      <td className="pl-4 pt-3  align-top ">
                        <span className="font-medium">{actividad?.titulo}</span>
                      </td>
                      {diasSemana.map((dia, i) => {
                        const fechaStr = format(dia, "yyyy-MM-dd");
                        const turnosDelDia = dias[fechaStr] || [];

                        return (
                          <td key={i} className="p-2  align-top space-y-1">
                            {turnosDelDia
                              .sort((a: Turno, b: Turno) =>
                                a.hora_inicio.localeCompare(b.hora_inicio)
                              )
                              .map((turno: Turno) => {
                                const ocupado =
                                  turno.cupo_total - turno.cupo_disponible;
                                const porcentaje = Math.round(
                                  (ocupado / turno.cupo_total) * 100
                                );
                                const lleno = turno.cupo_disponible === 0;
                                return (
                                  <button
                                    key={turno.turno_id}
                                    className={clsx(
                                      "w-full text-xs px-2 py-2 rounded block text-left  transition-all"
                                    )}
                                    style={{
                                      backgroundColor: grupoColor.claro,
                                    }}
                                    onClick={() => {
                                      router.push(
                                        `/calendario/${turno.turno_id}?color=${encodeURIComponent(grupoColor.claro)}&colorprincipal=${encodeURIComponent(grupoColor.principal)}`
                                      );
                                    }}
                                  >
                                    <div className="text-[14px]">
                                      {turno.hora_inicio.slice(0, 5)}
                                    </div>
                                    {!lleno && (
                                      <div className="mt-2 mb-2 max-w-[175px]">
                                        <div
                                          className="h-1 w-full  overflow-hidden"
                                          style={{
                                            backgroundColor:
                                              grupoColor.variante,
                                          }}
                                        >
                                          <div
                                            className="h-full "
                                            style={{
                                              width: `${porcentaje}%`,
                                              backgroundColor:
                                                grupoColor.principal,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-1 max-w-[175px]">
                                      {lleno ? (
                                        <>
                                          <div
                                            className="px-2 py-[2px] rounded-[4px] text-white"
                                            style={{
                                              backgroundColor:
                                                grupoColor.principal,
                                            }}
                                          >
                                            Full
                                          </div>
                                          <GroupsIcon
                                            sx={{
                                              fontSize: "14px",
                                              color: grupoColor.principal,
                                            }}
                                          />
                                          {turno.cupo_total}
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px]">
                                              {turno.cupo_total -
                                                turno.cupo_disponible}
                                              /{turno.cupo_total} vendidas
                                            </span>
                                            <span className="text-[10px]">
                                              {porcentaje}%
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }
              )
            ) : (
              <tr className="">
                <td colSpan={diasSemana.length + 1} className="h-64 my-6 mx-6">
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: 1,
                      border: "solid 25px white",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <CalendarX2 />
                    <Typography variant="body2">
                      {selectedActivity && selectedActivity !== "all"
                        ? "No hay turnos disponibles para esta actividad"
                        : "No hay reservas para mostrar"}
                    </Typography>
                  </Box>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalendarioTurnos;
