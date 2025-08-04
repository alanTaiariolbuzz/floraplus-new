"use client";
// components/Dashboard/DashboardPage.tsx
import { CircularProgress, Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { SalesTabs } from "./Sections/SalesTabs";
import { ScheduleSection } from "./Sections/ScheduleSection";
import ReservationsDataGrid from "@/app/(protected)/reservas/components/ReservationsDataGrid";
import DashboardSkeleton from "./DashboardSkeleton";
import { RefreshHeader } from "./RefreshHeader";
import { useReservasHoy } from "@/app/hooks/useReservasHoy";
import { useVentasHoy } from "@/app/hooks/useVentasHoy";
import { Sale, Cancellation } from "./types";

import { TablaReservas } from "./Tables/ReservationsTable";

const DashboardPage = () => {
  const currentDate = new Date();
  // const currentDate = new Date("2025-05-28");

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(currentDate);

  const { lastUpdate, refresh, loading: reservasLoading } = useReservasHoy();
  const { ventas, loading: ventasLoading } = useVentasHoy();
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [refundsTotal, setRefundsTotal] = useState(0);

  useEffect(() => {
    const fetchCancellations = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/reservas?cancelled_at=${today}`);
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          const mapped: Cancellation[] = result.data.map((reserva: any) => {
            const activityDate = reserva.cancelled_at
              ? new Date(reserva.cancelled_at).toLocaleDateString("es-AR")
              : reserva.turno?.fecha
                ? new Date(reserva.turno.fecha).toLocaleDateString("es-AR")
                : reserva.created_at
                  ? new Date(reserva.created_at).toLocaleDateString("es-AR")
                  : "-";
            return {
              client:
                `${reserva.cliente?.nombre || ""} ${reserva.cliente?.apellido || ""}`.trim() ||
                "Cliente sin nombre",
              amount:
                typeof reserva.monto_total === "number"
                  ? reserva.monto_total
                  : 0,
              tour: reserva.actividad_titulo || "Sin actividad",
              date: activityDate,
              reason: reserva.motivo_cancelacion || reserva.reason || "-",
            };
          });
          setCancellations(mapped);
        } else {
          setCancellations([]);
        }
      } catch (err) {
        console.error("Error al obtener cancelaciones del día:", err);
        setCancellations([]);
      }
    };
    fetchCancellations();
  }, []);

  useEffect(() => {
    const fetchRefundsTotal = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/refunds?created_at=${today}`);
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          const totalCents = result.data.reduce(
            (sum: number, refund: any) => sum + (refund.amount || 0),
            0
          );
          setRefundsTotal(totalCents / 100);
        } else {
          setRefundsTotal(0);
        }
      } catch (err) {
        console.error("Error al obtener refunds del día:", err);
        setRefundsTotal(0);
      }
    };
    fetchRefundsTotal();
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <>
        <div className="flex justify-center items-center h-screen">
          <CircularProgress />
        </div>
      </>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: "100vh" }}>
      <div className="flex justify-between items-center">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          {formattedDate}
        </Typography>
        <RefreshHeader
          lastUpdate={lastUpdate}
          onRefresh={refresh}
          loading={reservasLoading}
        />
      </div>
      <div className="flex flex-col lg:flex-row gap-4 mt-4">
        {/* Sección principal (60% ancho) */}
        <div className="w-full lg:w-[60%]">
          <TablaReservas />
        </div>

        {/* Sección secundaria (40% ancho) */}
        <div className="w-full lg:w-[40%]  border border-[#eaeaea] rounded-[8px]">
          <Grid container>
            <Grid item xs={12}>
              <SalesTabs
                sales={ventas}
                cancellations={cancellations}
                refundsTotal={refundsTotal}
                isLoading={ventasLoading}
              />
            </Grid>
          </Grid>
        </div>
      </div>
      <Grid item xs={12}>
        <ScheduleSection isLoading={isLoading} />
      </Grid>
    </Container>
  );
};

export default DashboardPage; // Exportación por defecto
