"use client";

import { FC, useState, useEffect } from "react";
import { Typography, Button, CircularProgress, Alert } from "@mui/material";
import { DateRangeSelector } from "./DateRangeSelector";
import { DateRangeState } from "./types";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastContext";
import { formatDateToYYYYMMDD } from "./utils";

export const BloquearTodas: FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: null,
    endDate: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [affectedReservations, setAffectedReservations] = useState<
    number | null
  >(null);

  const checkAffectedReservations = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    try {
      const response = await fetch("/api/turnos/verificar-reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
    if (dateRange.startDate && dateRange.endDate) {
      checkAffectedReservations();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const handleSubmit = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    setSubmitting(true);
    setApiError(null);
    setAffectedReservations(null);
    try {
      const payload = {
        fecha_desde: formatDateToYYYYMMDD(dateRange.startDate),
        fecha_hasta: formatDateToYYYYMMDD(dateRange.endDate),
        tipo_modificacion: "BLOQUEAR_TODAS",
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

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-[8px] border border-[#E0E0E0] w-[100vw]">
      <div className="flex flex-col gap-4 rounded-[8px] p-4 w-fit">
        <div>
          <Typography variant="h6">Bloquear todas las actividades</Typography>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "400", color: "#616161" }}
          >
            Selecciona el rango de fechas en el que deseas bloquear todas las
            actividades
          </Typography>
        </div>
      </div>

      <DateRangeSelector value={dateRange} onChange={setDateRange} />

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
              submitting ||
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
