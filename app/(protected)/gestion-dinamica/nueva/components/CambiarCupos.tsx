"use client";

import { FC, useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Skeleton,
} from "@mui/material";
import { DateRangeSelector } from "./DateRangeSelector";
import {
  Actividad,
  HorarioAPI,
  HorarioAgrupado,
  DateRangeState,
} from "./types";
import { diasSemana, diasSemanaAbreviados } from "./types";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastContext";
import { formatDateToYYYYMMDD } from "./utils";

interface CambiarCuposProps {
  actividad: Actividad | null;
}

interface GroupedSchedule {
  days: string[];
  originalDays: number[];
  schedules: { id: number; hora: string }[];
}

export const CambiarCupos: FC<CambiarCuposProps> = ({ actividad }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [horarios, setHorarios] = useState<HorarioAPI[]>([]);
  const [groupedSchedules, setGroupedSchedules] = useState<GroupedSchedule[]>(
    []
  );
  const [selectedHorario, setSelectedHorario] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: null,
    endDate: null,
  });
  const [cupoActual, setCupoActual] = useState<number>(0);
  const [nuevosCupos, setNuevosCupos] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [affectedReservations, setAffectedReservations] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (actividad) {
      fetchHorarios();
    }
  }, [actividad]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchHorarios = async () => {
    try {
      const response = await fetch(
        `${siteUrl}/api/horarios?actividad_id=${actividad?.id}`
      );
      const data = await response.json();
      setHorarios(data.data);

      // Group schedules by exact day matches
      const scheduleMap = new Map<
        string,
        { days: number[]; schedules: { id: number; hora: string }[] }
      >();

      data.data.forEach((horario: HorarioAPI) => {
        // Create a key from the sorted days array
        const daysKey = [...horario.dias].sort().join(",");

        if (!scheduleMap.has(daysKey)) {
          scheduleMap.set(daysKey, {
            days: [...horario.dias].sort(),
            schedules: [],
          });
        }
        const entry = scheduleMap.get(daysKey)!;
        entry.schedules.push({
          id: horario.id,
          hora: horario.hora_inicio,
        });
      });

      // Convert to final format and sort schedules within each group
      const grouped = Array.from(scheduleMap.entries()).map(([_, value]) => {
        return {
          days: value.days.map((day) => diasSemanaAbreviados[day]),
          originalDays: value.days,
          schedules: value.schedules.sort((a, b) =>
            a.hora.localeCompare(b.hora)
          ),
        };
      });

      // Sort groups by the first day of the week
      grouped.sort((a, b) => {
        const firstDayA = a.originalDays[0];
        const firstDayB = b.originalDays[0];
        return firstDayA - firstDayB;
      });

      setGroupedSchedules(grouped);
    } catch (error) {
      console.error("Error fetching horarios:", error);
    }
  };

  const handleHorarioSelect = async (horarioId: number) => {
    setSelectedHorario(horarioId);
    try {
      const response = await fetch(`${siteUrl}/api/horarios?id=${horarioId}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.data && data.data[0].cupo !== undefined) {
        setCupoActual(data.data[0].cupo);
        setNuevosCupos(data.data[0].cupo);
      } else {
        console.error("No se pudo obtener el cupo actual");
      }
    } catch (error) {
      console.error("Error fetching cupo:", error);
    }
  };

  const checkAffectedReservations = async () => {
    if (!selectedHorario || !dateRange.startDate || !dateRange.endDate) return;

    try {
      const response = await fetch("/api/turnos/verificar-reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          horario_id: selectedHorario,
          fecha_desde: formatDateToYYYYMMDD(dateRange.startDate),
          fecha_hasta: formatDateToYYYYMMDD(dateRange.endDate),
          actividad_id: actividad?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAffectedReservations(data.affected_reservations);
        if (data.affected_reservations > 0) {
          setApiError(
            `No se puede realizar la modificación porque hay ${data.affected_reservations} reservas asociadas en el período seleccionado`
          );
        } else {
          setApiError(null);
        }
      } else {
        setApiError(data.message || "Error al verificar reservas");
        setAffectedReservations(null);
      }
    } catch (error) {
      console.error("Error checking affected reservations:", error);
      setApiError("Error al verificar reservas");
      setAffectedReservations(null);
    }
  };

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate && selectedHorario) {
      checkAffectedReservations();
    }
  }, [dateRange.startDate, dateRange.endDate, selectedHorario]);

  const handleSubmit = async () => {
    if (
      !selectedHorario ||
      !dateRange.startDate ||
      !dateRange.endDate ||
      cupoActual === undefined
    ) {
      console.error("Faltan datos requeridos:", {
        selectedHorario,
        dateRange,
        cupoActual,
      });
      return;
    }

    setLoading(true);
    setApiError(null);
    setAffectedReservations(null);
    try {
      const payload = {
        actividad_id: actividad?.id,
        horario_id: selectedHorario,
        fecha_desde: formatDateToYYYYMMDD(dateRange.startDate),
        fecha_hasta: formatDateToYYYYMMDD(dateRange.endDate),
        tipo_modificacion: "CAMBIAR_CUPOS",
        cupo_actual: cupoActual,
        nuevos_cupos_totales: nuevosCupos,
      };

      const response = await fetch("/api/turnos/modificacionesTemporarias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setAffectedReservations(data.affected_reservations || null);
        throw new Error(
          data.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      router.push(
        "/gestion-dinamica?toast=" +
          encodeURIComponent("Modificación temporal creada exitosamente")
      );
    } catch (error) {
      console.error("Error submitting modification:", error);
      setApiError(
        error instanceof Error
          ? error.message
          : "Error al enviar la modificación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white p-4 rounded-[8px] border border-[#E0E0E0] w-[100vw]">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-[8px] border border-[#E0E0E0] w-fit">
        {loading ? (
          <div className="flex flex-col gap-4 rounded-[8px] p-4">
            <div>
              <Typography variant="h6">Horarios actuales</Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "400", color: "#616161" }}
              >
                Selecciona el horario de la actividad que quieres modificar
                temporalmente
              </Typography>
            </div>
            <div className="flex flex-row gap-2">
              {[1, 2, 3].map((group) => (
                <div key={group} className="flex flex-col gap-2 max-w-[200px]">
                  <Skeleton variant="text" width={120} />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {[1, 2, 3].map((chip) => (
                      <Skeleton
                        key={chip}
                        variant="rounded"
                        width={80}
                        height={32}
                        sx={{ borderRadius: "16px" }}
                      />
                    ))}
                  </Box>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-[8px] p-4">
            <div>
              <Typography variant="h6">Horarios actuales</Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "400", color: "#616161" }}
              >
                Selecciona el horario de la actividad que quieres modificar
                temporalmente
              </Typography>
            </div>
            <div className="flex flex-col gap-4 max-w-[800px] flex-wrap">
              {(() => {
                const groupsPerRow = 3;
                const groupedInRows = [];

                for (
                  let i = 0;
                  i < groupedSchedules.length;
                  i += groupsPerRow
                ) {
                  groupedInRows.push(
                    groupedSchedules.slice(i, i + groupsPerRow)
                  );
                }

                return (
                  <>
                    {groupedInRows.map((rowGroups, rowIndex) => (
                      <div
                        key={rowIndex}
                        className={`flex flex-row gap-4 flex-wrap max-w-[800px] ${
                          rowIndex > 0
                            ? "border-t border-[#E0E0E0] pt-4 mt-4"
                            : ""
                        }`}
                      >
                        {rowGroups.map((group, indexInRow) => {
                          const realIndex =
                            rowIndex * groupsPerRow + indexInRow;

                          return (
                            <div
                              key={realIndex}
                              className={`flex flex-col gap-2 max-w-[285px] ${
                                indexInRow < rowGroups.length - 1
                                  ? "border-r border-[#E0E0E0] pr-4"
                                  : ""
                              }`}
                            >
                              <Typography
                                variant="body2"
                                className="font-medium"
                              >
                                {group.days.join(" - ")}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                {group.schedules.map((schedule) =>
                                  group.days[0] !== undefined ? (
                                    <Chip
                                      key={schedule.id}
                                      label={formatTime(schedule.hora)}
                                      onClick={() =>
                                        handleHorarioSelect(schedule.id)
                                      }
                                      color={
                                        selectedHorario === schedule.id
                                          ? "primary"
                                          : "default"
                                      }
                                      variant={
                                        selectedHorario === schedule.id
                                          ? "filled"
                                          : "outlined"
                                      }
                                    />
                                  ) : null
                                )}
                              </Box>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <>
          <div className="p-4 border border-[#E0E0E0] rounded-[8px]">
            <Typography variant="h6" className="pb-2">
              Cupos
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "400", color: "#616161" }}
              className="pb-4"
            >
              Cupos actuales: {cupoActual}
            </Typography>
            <TextField
              label="Nuevos cupos totales"
              type="number"
              value={nuevosCupos}
              onChange={(e) => setNuevosCupos(Number(e.target.value))}
              sx={{ width: "35%" }}
              inputProps={{ min: 0 }}
            />
          </div>

          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </>
      </div>
      <div className="flex flex-row gap-2 justify-between w-full items-center">
        <div>
          {apiError && (
            <Alert
              severity="warning"
              sx={{
                bgcolor: "#FFF4E5",
                "& .MuiAlert-icon": {
                  color: "#ED6C02",
                },
              }}
            >
              {apiError}
            </Alert>
          )}
        </div>
        <div className="flex flex-row gap-2 justify-end">
          <Button
            variant="outlined"
            onClick={() => router.push("/gestion-dinamica")}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={
              loading ||
              !dateRange.startDate ||
              !dateRange.endDate ||
              nuevosCupos < 0
            }
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
