"use client";

import { FC, useState, useEffect } from "react";
import {
  Typography,
  TextField,
  Chip,
  Box,
  Button,
  CircularProgress,
  Alert,
  Skeleton,
} from "@mui/material";
import { Actividad, DateRangeState } from "./types";
import { diasSemana, diasSemanaAbreviados } from "./types";
import { DateRangeSelector } from "./DateRangeSelector";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastContext";
import { formatDateToYYYYMMDD } from "./utils";

interface CambiarHoraInicioProps {
  actividad: Actividad | null;
}

interface ApiResponse {
  code: number;
  message: string;
  data: any[];
}

interface GroupedSchedule {
  days: string[];
  originalDays: number[];
  schedules: { id: number; hora: string }[];
}

interface SelectedSchedule {
  id: number;
  hora: string;
}

export const CambiarHoraInicio: FC<CambiarHoraInicioProps> = ({
  actividad,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [horarioSeleccionado, setHorarioSeleccionado] =
    useState<SelectedSchedule | null>(null);
  const [horarioActual, setHorarioActual] = useState<string>("");
  const [nuevoHorario, setNuevoHorario] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: null,
    endDate: null,
  });
  const [groupedSchedules, setGroupedSchedules] = useState<GroupedSchedule[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [affectedReservations, setAffectedReservations] = useState<
    number | null
  >(null);

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



  const checkAffectedReservations = async () => {
    if (!horarioSeleccionado || !dateRange.startDate || !dateRange.endDate)
      return;

    try {


      const response = await fetch("/api/turnos/verificar-reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          horario_id: horarioSeleccionado.id,
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
    if (dateRange.startDate && dateRange.endDate && horarioSeleccionado) {
      checkAffectedReservations();
    }
  }, [dateRange.startDate, dateRange.endDate, horarioSeleccionado]);

  const handleSubmit = async () => {
    if (
      !horarioSeleccionado ||
      !nuevoHorario ||
      !dateRange.startDate ||
      !dateRange.endDate
    )
      return;

    setSubmitting(true);
    setApiError(null);
    setAffectedReservations(null);
    try {
      const payload = {
        horario_id: horarioSeleccionado.id,
        fecha_desde: formatDateToYYYYMMDD(dateRange.startDate),
        fecha_hasta: formatDateToYYYYMMDD(dateRange.endDate),
        tipo_modificacion: "CAMBIAR_HORA_INICIO",
        hora_inicio_actual: horarioActual,
        hora_inicio_nueva: nuevoHorario,
        actividad_id: actividad?.id,
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
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchHorarios = async () => {
      if (!actividad) return;

      try {
        setLoading(true);
        setError(null);

        // Forzar delay de 10 segundos para pruebas

        const response = await fetch(
          `/api/horarios?actividad_id=${actividad.id}`
        );
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const apiResponse: ApiResponse = await response.json();
        if (apiResponse.code !== 200) {
          throw new Error(apiResponse.message);
        }

        // Group schedules by exact day matches
        const scheduleMap = new Map<
          string,
          { days: number[]; schedules: { id: number; hora: string }[] }
        >();

        apiResponse.data.forEach((horario) => {
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
        setError(
          error instanceof Error
            ? error.message
            : "Error al cargar los horarios"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [actividad]);

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-[8px] border border-[#E0E0E0] w-[100vw]">
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
        ) : error ? (
          <Typography color="error">{error}</Typography>
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
                                {group.schedules.map(
                                  (schedule) =>
                                    group.days[0] !== undefined && (
                                      <Chip
                                        key={schedule.id}
                                        label={formatTime(schedule.hora)}
                                        onClick={() => {
                                          setHorarioSeleccionado({
                                            id: schedule.id,
                                            hora: schedule.hora,
                                          });
                                          setHorarioActual(schedule.hora);
                                        }}
                                        color={
                                          horarioSeleccionado?.id ===
                                          schedule.id
                                            ? "primary"
                                            : "default"
                                        }
                                        variant={
                                          horarioSeleccionado?.id ===
                                          schedule.id
                                            ? "filled"
                                            : "outlined"
                                        }
                                      />
                                    )
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

        <div className="p-4 border border-[#E0E0E0] rounded-[8px]">
          <Typography variant="h6" className="pb-2">
            Horario nuevo
          </Typography>
          <TextField
            type="time"
            sx={{ width: "35%" }}
            label="Nuevo horario"
            value={nuevoHorario}
            onChange={(e) => setNuevoHorario(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
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
        <div className="flex flex-row gap-2 justify-end ">
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
              submitting ||
              !horarioSeleccionado ||
              !nuevoHorario ||
              !dateRange.startDate ||
              !dateRange.endDate ||
              (affectedReservations !== null && affectedReservations > 0)
            }
          >
            {submitting ? (
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
