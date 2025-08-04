"use client";

import { FC, useState, useEffect } from "react";
import { Typography, Button, Alert } from "@mui/material";
import { Actividad, DateRangeState } from "./types";
import { DateRangeSelector } from "./DateRangeSelector";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastContext";
import { formatDateToYYYYMMDD } from "./utils";

interface BloquearActividadProps {
  actividad: Actividad | null;
}

export const BloquearActividad: FC<BloquearActividadProps> = ({
  actividad,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: null,
    endDate: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [affectedReservations, setAffectedReservations] = useState<
    number | null
  >(null);
  const router = useRouter();
  const { showToast } = useToast();

  const checkAffectedReservations = async () => {
    if (!actividad || !dateRange.startDate || !dateRange.endDate) return;

    try {
      const response = await fetch("/api/turnos/verificar-reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actividad_id: actividad.id,
          fecha_desde: formatDateToYYYYMMDD(dateRange.startDate),
          fecha_hasta: formatDateToYYYYMMDD(dateRange.endDate),
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
    if (dateRange.startDate && dateRange.endDate && actividad) {
      checkAffectedReservations();
    }
  }, [dateRange.startDate, dateRange.endDate, actividad]);

  const handleSubmit = async () => {
    if (!actividad || !dateRange.startDate || !dateRange.endDate) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/turnos/modificacionesTemporarias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actividad_id: actividad.id,
          fecha_desde: formatDateToYYYYMMDD(dateRange.startDate),
          fecha_hasta: formatDateToYYYYMMDD(dateRange.endDate),
          tipo_modificacion: "BLOQUEAR_ACTIVIDAD",
        }),
      });

      if (!response.ok) {
        throw new Error("Error al bloquear la actividad");
      }

      // Reset form
      setDateRange({ startDate: null, endDate: null });
      router.push(
        "/gestion-dinamica?toast=" +
          encodeURIComponent("Modificación temporal creada exitosamente")
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white p-4 rounded-[8px] border border-[#E0E0E0] w-[100vw]">
      <div className="flex flex-col gap-6 bg-white w-fit">
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
              !dateRange.startDate ||
              !dateRange.endDate ||
              isSubmitting ||
              (affectedReservations !== null && affectedReservations > 0)
            }
          >
            {isSubmitting ? "Bloqueando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
};
