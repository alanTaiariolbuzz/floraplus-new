"use client";

import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import useDashboardMetrics from "../../../hooks/useDashboardMetrics";
import MetricCard from "./components/MetricCard";
import { RefreshHeader } from "@/components/Dashboard/RefreshHeader";
import { useUser } from "@/context/UserContext";

export default function AdminPanel() {
  const { user, customUser } = useUser();
  const { metrics, loading, error } = useDashboardMetrics();
  const [topAgencies, setTopAgencies] = useState<any[]>([]);
  const [agenciesWithoutSales, setAgenciesWithoutSales] = useState<any[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  const currentDate = new Date();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(currentDate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Función para obtener las agencias que más venden
  const fetchTopAgencies = async () => {
    try {
      setAgenciesLoading(true);

      // Obtener todas las reservas confirmadas
      const response = await fetch("/api/reservas");
      const data = await response.json();

      if (data.code === 200 && data.data) {
        const reservas = Array.isArray(data.data) ? data.data : [data.data];

        // Obtener datos de todas las agencias para tener el país
        const agenciasResponse = await fetch("/api/agencias");
        const agenciasData = await agenciasResponse.json();
        const agencias = agenciasData.code === 200 ? agenciasData.data : [];

        // Crear mapa de agencias por ID para acceso rápido
        const agenciasMap = new Map();
        agencias.forEach((agencia: any) => {
          agenciasMap.set(agencia.id, agencia);
        });

        // Agrupar por agencia
        const agencyStats = new Map();

        reservas.forEach((reserva: any) => {
          if (
            reserva.estado != "go4fok" &&
            reserva.turno?.agencia_id &&
            reserva.pago?.amount
          ) {
            const agenciaId = reserva.turno.agencia_id;
            const agenciaData = agenciasMap.get(agenciaId);
            const agenciaNombre = agenciaData?.nombre || `Agencia ${agenciaId}`;
            const agenciaPais = agenciaData?.pais || "N/A";

            if (agencyStats.has(agenciaId)) {
              const existing = agencyStats.get(agenciaId);
              existing.total_vendido += reserva.pago.amount || 0;
              existing.cantidad_reservas += 1;
              if (reserva.created_at > existing.ultima_reserva) {
                existing.ultima_reserva = reserva.created_at;
              }
            } else {
              agencyStats.set(agenciaId, {
                agencia_id: agenciaId,
                nombre: agenciaNombre,
                pais: agenciaPais,
                total_vendido: reserva.pago.amount || 0,
                cantidad_reservas: 1,
                ultima_reserva: reserva.created_at,
              });
            }
          }
        });

        // Calcular total de ventas para el porcentaje
        const totalVentas = Array.from(agencyStats.values()).reduce(
          (sum: number, agency: any) => sum + agency.total_vendido,
          0
        );

        // Ordenar por total vendido y tomar top 20, agregando porcentaje
        const topAgencies = Array.from(agencyStats.values())
          .sort((a: any, b: any) => b.total_vendido - a.total_vendido)
          .slice(0, 20)
          .map((agency: any) => ({
            ...agency,
            porcentaje:
              totalVentas > 0 ? (agency.total_vendido / totalVentas) * 100 : 0,
          }));

        setTopAgencies(topAgencies);
      }
    } catch (error) {
      console.error("Error al obtener agencias:", error);
    } finally {
      setAgenciesLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTopAgencies();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center pb-5">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            {formattedDate}
          </Typography>
          <RefreshHeader
            lastUpdate={new Date()}
            onRefresh={() => {}}
            loading={loading}
          />
        </div>
        <div className="flex flex-row gap-4 mb-4">
          <MetricCard
            icon="/icons/paper-tick-blue.svg"
            iconAlt="PaperTick"
            value={formatCurrency(metrics?.ingresosHoy || 0)}
            label="US$ Ingresos  hoy"
            loading={loading}
            error={!!error}
          />
          <MetricCard
            icon="/icons/group-orange.svg"
            iconAlt="Group"
            value={formatCurrency(metrics?.totalTransaccionado || 0)}
            label="US$ Total transaccionado hoy"
            loading={loading}
            error={!!error}
          />
          <MetricCard
            icon="/icons/group-orange.svg"
            iconAlt="Group"
            value={metrics?.cantidadVentasHoy || 0}
            label="Cantidad de ventas hoy"
            loading={loading}
            error={!!error}
          />
          <MetricCard
            icon="/icons/group-orange.svg"
            iconAlt="Group"
            value={formatCurrency(metrics?.promedioReservaHoy || 0)}
            label="USD promedio de reserva hoy"
            loading={loading}
            error={!!error}
          />
        </div>
      </div>
      <div className="rounded-[8px] bg-white overflow-hidden border border-[#E0E0E0] h-[500px]">
        <div className="py-10 px-5 h-full">
          <Typography variant="h6" sx={{ fontWeight: "500", mb: 2 }}>
            Top 20 agencias (Según US$ vendidos)
          </Typography>
          {agenciesLoading ? (
            <div className="rounded-[8px] overflow-hidden border border-[#E0E0E0]">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-[#FAFAFA] h-[55px]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Agencia
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      País
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Total Vendido
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      % Ventas totales
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Última Reserva
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm">
                      <div className="flex justify-center items-center h-[160px]">
                        <CircularProgress />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : topAgencies.length < 5 ? (
            <div className="rounded-[8px] overflow-hidden border border-[#E0E0E0]">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-[#FAFAFA] h-[55px]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Agencia
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      País
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium tracking-normal">
                      Total Vendido
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium tracking-normal">
                      % Ventas totales
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium tracking-normal">
                      Última Reserva
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm">
                      <div className="flex flex-col justify-center items-center h-[160px] rounded-[8px] bg-[#fafafa] ">
                        <img
                          src="/icons/mail-error.svg"
                          alt="PaperTick"
                          className="w-[24px] h-[24px] mb-2"
                        />
                        No tienes agencias para mostrar
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[8px] overflow-hidden border border-[#E0E0E0]">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-[#FAFAFA] h-[55px]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Agencia
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      País
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Total Vendido
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      % Ventas totales
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                      Última Reserva
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {topAgencies.map((agency, index) => (
                    <tr key={agency.agencia_id} className="">
                      <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                        <span className="">{agency.nombre}</span>
                      </td>
                      <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                        {agency.pais}
                      </td>
                      <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-left">
                        <span className="">
                          {formatCurrency(agency.total_vendido)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-left">
                        <p className=" ">{agency.porcentaje.toFixed(1)}%</p>
                      </td>
                      <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-left">
                        {formatDate(agency.ultima_reserva)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
