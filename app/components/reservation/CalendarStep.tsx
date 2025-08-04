"use client";

import { useState } from "react";
import type { Turno } from "../../types/reservation";
import { Chip, Typography } from "@mui/material";
import "../../styles/calendar.css";
import TariffSelector from "./TariffSelector";
import type { Tarifa } from "../../types/reservation";
import { useTranslation } from "../../hooks/useTranslation";
import { Language } from "../../translations/reservation";
import {
  getAgencyTimeZone,
  getCurrentTimeInAgencyTimezone,
  isTurnoAvailable,
  formatDisplayDate,
  formatDisplayTime,
} from "../../utils/timezone";

interface CalendarStepProps {
  turnos: Turno[];
  onSelectTurno: (turno: Turno | null) => void;
  selectedTurno: Turno | null;
  tarifas: Tarifa[];
  onTarifasSelect: (tarifas: Record<string, number>) => void;
  selectedTarifas: Record<string, number>;
  pais: string | null;
  minimo_reserva: number;
  language: Language;
  turnoReservasTotales?: number;
  detalles?: {
    limite_reserva_minutos?: number | null;
    umbral_limite_personas?: number | null;
    umbral_limite_minutos?: number | null;
    umbral_limite_tipo?: string | null;
  };
}

// como obtener data de la agencia?

export default function CalendarStep({
  turnos,
  onSelectTurno,
  selectedTurno,
  tarifas,
  onTarifasSelect,
  selectedTarifas,
  pais,
  minimo_reserva,
  language,
  turnoReservasTotales = 0,
  detalles,
}: CalendarStepProps) {
  const { t } = useTranslation(language);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    selectedTurno ? selectedTurno.fecha.split("T")[0] : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedTurno ? new Date(selectedTurno.fecha) : new Date()
  );

  // Validar que turnos sea un array
  if (!Array.isArray(turnos)) {
    console.error("turnos no es un array:", turnos);
    return <div>{t("error")}</div>;
  }

  // Agrupar turnos por fecha
  const turnosPorFecha = turnos.reduce(
    (acc, turno) => {
      // Solo incluir turnos que no estén bloqueados
      if (!turno.bloqueado) {
        const fecha = turno.fecha.split("T")[0];
        if (!acc[fecha]) {
          acc[fecha] = [];
        }
        acc[fecha].push(turno);
      }
      return acc;
    },
    {} as { [key: string]: Turno[] }
  );

  // Obtener fechas disponibles
  const fechasDisponibles = Object.keys(turnosPorFecha);

  //que hora es en el dispositivo?
  const horaActual = new Date();


  //que hora es en la agencia?
  const horaAgencia = pais
    ? getCurrentTimeInAgencyTimezone(getAgencyTimeZone(pais))
    : new Date();



  // Función para verificar si un turno está disponible
  const checkTurnoAvailable = (turno: Turno) => {

    // Si el turno está bloqueado, no está disponible
    if (turno.bloqueado) {
      return false;
    }

    // Si no tiene cupo disponible, no está disponible
    if (turno.cupo_disponible <= 0) {

      return false;
    }

    // Si no hay país configurado, usar lógica local
    if (!pais) {

      return true;
    }

    // Determinar qué hora usar para la comparación
    let horaComparacion: string;
    if (turno.hora_fin && turno.hora_fin.trim() !== "") {
      // Si tiene hora de fin, usar esa hora
      horaComparacion = turno.hora_fin;
    } else {
      // Si no tiene hora de fin, usar la hora de inicio
      horaComparacion = turno.hora_inicio;
    }



    // Verificar si la fecha y hora están en el pasado según la zona horaria de la agencia
    try {
      const timezone = getAgencyTimeZone(pais);
      const isPast = !isTurnoAvailable(turno.fecha, horaComparacion, timezone);



      if (isPast) {
        return false;
      }
    } catch (error) {
      // Si hay error, permitir el turno
      return true;
    }

    // Aplicar lógica de umbrales de reserva
    try {
      const limiteMinutos = aplicarUmbralesReserva(
        turno.fecha,
        horaComparacion,
        pais
      );



      if (limiteMinutos !== null) {
        // Calcular la diferencia en minutos entre el turno y ahora
        const timezone = getAgencyTimeZone(pais);
        const agencyNow = getCurrentTimeInAgencyTimezone(timezone);
        const turnoDateTime = new Date(turno.fecha + "T" + horaComparacion);
        const diffMs = turnoDateTime.getTime() - agencyNow.getTime();
        const diferenciaMinutos = Math.floor(diffMs / (1000 * 60));



        // Si la diferencia es menor al límite, no está disponible
        if (diferenciaMinutos < limiteMinutos) {

          return false;
        }
      }
    } catch (error) {
      console.error("Error applying reservation thresholds:", error);

      return true;
    }


    return true;
  };

  // Función para aplicar la lógica de umbrales de reserva
  const aplicarUmbralesReserva = (
    fecha: string,
    hora: string,
    pais: string
  ): number | null => {
    // Si no hay detalles configurados, no aplicar restricciones
    if (!detalles) {
      return null;
    }

    // Verificar si se supera el umbral de personas
    const umbralPersonas = detalles.umbral_limite_personas;
    const umbralMinutos = detalles.umbral_limite_minutos;
    const umbralTipo = detalles.umbral_limite_tipo;
    const limiteReservaMinutos = detalles.limite_reserva_minutos;

    // Si hay umbral configurado y se supera el número de personas
    if (
      umbralPersonas &&
      umbralMinutos &&
      umbralTipo &&
      turnoReservasTotales > umbralPersonas
    ) {
      // Aplicar el umbral dinámico
      if (umbralTipo === "antes") {
        return umbralMinutos;
      } else if (umbralTipo === "después") {
        // Para "después", permitir reservas hasta X minutos después del inicio
        const timezone = getAgencyTimeZone(pais);
        const agencyNow = getCurrentTimeInAgencyTimezone(timezone);
        const turnoDateTime = new Date(fecha + "T" + hora);
        const diffMs = turnoDateTime.getTime() - agencyNow.getTime();
        const diferenciaMinutos = Math.floor(diffMs / (1000 * 60));
        return diferenciaMinutos > -umbralMinutos ? null : -umbralMinutos;
      }
    }

    // Si no se supera el umbral o no está configurado, usar el límite estándar
    return limiteReservaMinutos || null;
  };

  // Función para verificar si un turno tiene cupo disponible (sin considerar hora)
  const hasCupoDisponible = (turno: Turno) => {
    return !turno.bloqueado && turno.cupo_disponible > 0;
  };

  // Función para verificar si una fecha tiene turnos disponibles
  const hasAvailableTurnos = (fecha: string) => {
    const turnosDelDia = turnosPorFecha[fecha] || [];

    const result = turnosDelDia.some(checkTurnoAvailable);

    return result;
  };

  // Función para verificar si una fecha tiene al menos un turno con cupo
  const hasTurnosConCupo = (fecha: string) => {
    const turnosDelDia = turnosPorFecha[fecha] || [];

    const result = turnosDelDia.some(hasCupoDisponible);

    return result;
  };

  // Función para obtener los días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Obtener la fecha actual en la zona horaria de la agencia si está configurada
    const today = pais
      ? getCurrentTimeInAgencyTimezone(getAgencyTimeZone(pais))
      : new Date();
    today.setHours(0, 0, 0, 0);



    // Agregar días vacíos al inicio
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Agregar los días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      // Formatear la fecha como YYYY-MM-DD sin considerar la zona horaria
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const isPastDate = currentDate < today;
      const hasTurnos = fechasDisponibles.includes(dateString);
      const hasCupo = hasTurnos && hasTurnosConCupo(dateString);
      const isAvailable = !isPastDate && hasCupo;

 

      days.push({
        date: currentDate,
        dateString,
        isAvailable,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateSelect = (dateString: string) => {
    if (
      fechasDisponibles.includes(dateString) &&
      hasTurnosConCupo(dateString)
    ) {
      // Crear la fecha usando los componentes individuales para evitar problemas de zona horaria
      const [year, month, day] = dateString.split("-").map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate >= today) {
        setSelectedDate(dateString);
        // Solo resetear el turno si la fecha seleccionada es diferente
        if (selectedTurno && selectedTurno.fecha.split("T")[0] !== dateString) {
          onSelectTurno(null);
        }
      }
    }
  };

  const handleTurnoSelect = (turno: Turno) => {
    if (!checkTurnoAvailable(turno)) {
      return;
    }

    if (selectedTurno?.turno_id === turno.turno_id) {
      onSelectTurno(null);
    } else {
      onSelectTurno(turno);
    }
  };
  // I need 12hs format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const formattedHours = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const checkCanProceed = () => {
    // Calculate total tickets selected
    const totalTickets = Object.values(selectedTarifas).reduce(
      (sum, cantidad) => sum + cantidad,
      0
    );

    // Calcular el total de reservas que habría en el turno después de esta reserva
    const reservasTotalesConEstaReserva = turnoReservasTotales + totalTickets;

    return reservasTotalesConEstaReserva >= minimo_reserva;
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full sm:w-auto">
        <h2 className="calendar-header iframe-titles">{t("selectDate")}</h2>
        <div className="calendar-container">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="calendar-nav-button">
              &lt;
            </button>
            <h3 className="calendar-month">
              {`${currentMonth.toLocaleString(
                language === "en" ? "en-US" : "es-ES",
                {
                  month: "long",
                }
              )} ${currentMonth.getFullYear()}`}
            </h3>
            <button onClick={handleNextMonth} className="calendar-nav-button">
              &gt;
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {(language === "en"
                ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
              ).map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-days">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`calendar-day ${!day ? "empty" : ""} ${
                    day?.isAvailable ? "available" : "unavailable"
                  } ${day?.dateString === selectedDate ? "selected" : ""}`}
                  onClick={() => day && handleDateSelect(day.dateString)}
                >
                  {day?.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedDate && turnosPorFecha[selectedDate] && (
        <>
          <div className="flex flex-col md:flex-row md:gap-4 gap-6">
            <div className="flex flex-col gap-4 md:mx-4 min-w-[177px]">
              <h3 className="time-slots-title iframe-titles">
                {turnosPorFecha[selectedDate].some(
                  (turno) => turno.hora_fin && turno.hora_inicio
                )
                  ? t("chooseTimeRange")
                  : t("selectTime")}
                !
              </h3>
              <div className="time-slots-container">
                <div className="time-slots-grid">
                  {[...turnosPorFecha[selectedDate]]
                    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                    .map((turno) => {
                      // Verificar si es un rango horario o una hora específica
                      const isTimeRange = turno.hora_fin && turno.hora_inicio;
                      const isAvailable = checkTurnoAvailable(turno);
                      const isSelected =
                        selectedTurno?.turno_id === turno.turno_id;

                      return (
                        <div
                          key={turno.turno_id}
                          className="flex flex-col items-start cursor-pointer "
                        >
                          <Chip
                            label={
                              isTimeRange
                                ? `${formatTime(turno.hora_inicio)} - ${formatTime(turno.hora_fin)}`
                                : formatTime(turno.hora_inicio)
                            }
                            onClick={() =>
                              isAvailable && handleTurnoSelect(turno)
                            }
                            variant="outlined"
                            color={
                              isSelected
                                ? "primary"
                                : isAvailable
                                  ? "default"
                                  : "default"
                            }
                            disabled={!isAvailable}
                            sx={{
                              width: isTimeRange ? "140px" : "80px",
                              height: "32px",
                              color: isSelected
                                ? "white"
                                : isAvailable
                                  ? "black"
                                  : "#999999",
                              borderColor: isSelected
                                ? "#E65100"
                                : isAvailable
                                  ? "#EEEEEE"
                                  : "#CCCCCC",
                              backgroundColor: isSelected
                                ? "primary.main"
                                : isAvailable
                                  ? "transparent"
                                  : "#F5F5F5",
                              transition: "background-color 0.2s ease",
                              cursor: isAvailable ? "pointer" : "not-allowed",

                              "&:hover": {
                                backgroundColor: isSelected
                                  ? "#F47920 !important"
                                  : isAvailable
                                    ? "transparent"
                                    : "#F5F5F5",
                              },

                              "& .MuiChip-label": {
                                padding: "0 8px",
                                fontSize: "13px",
                              },
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <>
                <div className="flex flex-col gap-4 min-w-[200px] xl:min-w-[318px]">
                  <h2 className="tariff-header iframe-titles">
                    {t("howManyPeople")}
                  </h2>
                  <div className="tariff-section">
                    <TariffSelector
                      tarifas={tarifas}
                      onTarifasSelect={onTarifasSelect}
                      cupoDisponible={selectedTurno?.cupo_disponible ?? 0}
                      selectedTarifas={selectedTarifas}
                      minimo_reserva={minimo_reserva}
                      language={language}
                    />
                  </div>
                </div>
              </>
            </div>
          </div>
        </>
      )}
    </>
  );
}
