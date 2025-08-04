"use client";

import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import { useState, useEffect } from "react";
import { Schedule } from "../types";
import { SectionHeader } from "./SectionHeader";
import { Schedule as ScheduleIcon } from "@mui/icons-material";
import {
  Button,
  Link,
  Typography,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { format, isSameDay, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Turno {
  turno_id: number;
  actividad_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_total: number;
  cupo_disponible: number;
}

interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
}

interface PayoutInfo {
  nextPayoutDate: string;
  pendingAmount: string;
  currency: string;
}

interface ScheduleSectionProps {
  isLoading?: boolean;
}

export const ScheduleSection = ({
  isLoading = false,
}: ScheduleSectionProps) => {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [actividades, setActividades] = useState<{ [key: string]: Actividad }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(true);



  useEffect(() => {
    const fetchTurnosYActividades = async () => {
      try {
        setLoading(true);
        // simulate today is year 2026
        // const today =
        const today = new Date();

        // const today =
        //   "Fri May 16 2026 12:11:00 GMT+0200 (Central European Summer Time)";
        const resTurnos = await fetch("/api/turnos");
        if (!resTurnos.ok) throw new Error("Error al cargar turnos");
        const turnosData = await resTurnos.json();

        // Filtrar solo los turnos del día actual
        const turnos = Array.isArray(turnosData?.data)
          ? turnosData.data.filter((turno: Turno) =>
              isSameDay(parseISO(turno.fecha), today)
            )
          : [];

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
                console.error(`Error cargando actividad ${id}`);
                return;
              }
              const response = (await res.json()) as { data: Actividad };
              actividadesMap[id] = response.data;
            } catch (err) {
              console.error(`Error procesando actividad ${id}:`, err);
            }
          })
        );

        setActividades(actividadesMap);
      } catch (err) {
        console.error(err);
        setError("Hubo un problema al cargar el schedule.");
      } finally {
        setLoading(false);
      }
    };

    fetchTurnosYActividades();
  }, []);

  // Fetch payout info
  useEffect(() => {
    const fetchPayoutInfo = async () => {
      try {
        setPayoutLoading(true);
        const response = await fetch("/api/pagos/payout-info");
        if (!response.ok) {
          console.error("Error al cargar información de payout");
          return;
        }
        const result = await response.json();
        if (result.success) {
          setPayoutInfo(result.data);
        }
      } catch (err) {
        console.error("Error al obtener información de payout:", err);
      } finally {
        setPayoutLoading(false);
      }
    };

    fetchPayoutInfo();
  }, []);

  const columns: GridColDef[] = [
    {
      field: "time",
      headerName: "Horario",
      width: 150,
      headerClassName: "green-header",
    },
    {
      field: "tour",
      headerName: "Tour",
      width: 120,
      flex: 1,
    },
    {
      field: "availability",
      headerName: "Disponibilidad",
      // always disponibilidad to be sort by default
      sortable: true,
      width: 500,
      renderCell: (params) => (
        <div className="w-full h-full flex flex-col justify-center">
          <div className="flex flex-row  items-center">
            <div className="flex  gap-1 flex-col items-start">
              <div className="w-[70%]">
                <div className="h-[5px] bg-[#FFF3E0] overflow-hidden min-w-[200px]">
                  <div
                    className="h-full bg-[#EF6C00]"
                    style={{ width: `${params.row.progress}%` }}
                  />
                </div>
              </div>

              <p className="text-xs font-medium">
                {params.row.ocupado === params.row.cupo_total
                  ? "Full"
                  : `${params.row.ocupado}/${params.row.cupo_total} vendidas`}
              </p>
            </div>
            <div className="mb-4">
              <span className="text-[16px] ml-3 ">
                {Math.round((params.row.ocupado / params.row.cupo_total) * 100)}
                %
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const rows = turnos.map((turno, index) => {
    const actividad = actividades[turno.actividad_id.toString()];
    const ocupado = turno.cupo_total - turno.cupo_disponible;
    const porcentaje = Math.round((ocupado / turno.cupo_total) * 100);
    const disponibilidad =
      turno.cupo_disponible === 0
        ? "Full"
        : `${turno.cupo_disponible}/${turno.cupo_total}`;

    // Convert to 12-hour format with AM/PM
    const timeString = turno.hora_inicio;
    const [hours, minutes] = timeString.split(":").map(Number);
    const time = new Date(2000, 0, 1, hours, minutes);
    const formattedStartTime = format(time, "h:mm a");

    // Format end time if available
    let formattedEndTime = "";
    if (turno.hora_fin) {
      const endTimeString = turno.hora_fin;
      const [endHours, endMinutes] = endTimeString.split(":").map(Number);
      const endTime = new Date(2000, 0, 1, endHours, endMinutes);
      formattedEndTime = format(endTime, "h:mm a");
    }

    const formattedTime = formattedEndTime
      ? `${formattedStartTime} - ${formattedEndTime}`
      : formattedStartTime;

    return {
      id: turno.turno_id,
      time: formattedTime,
      tour: actividad?.titulo || "Cargando...",
      availability: disponibilidad,
      progress: porcentaje,
      cupo_total: turno.cupo_total,
      ocupado: turno.cupo_total - turno.cupo_disponible,
    };
  });

  if (isLoading) {
    return (
      <Box
        sx={{ p: 2, border: "1px solid #eaeaea", borderRadius: "8px", mt: 4 }}
      >
        <Skeleton variant="text" width="40%" height={40} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={300} />
        </Box>
      </Box>
    );
  }

  if (rows.length === 0 || error) {
    return (
      <>
        <div
          style={{
            marginTop: 16,
            height: "165px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            padding: 2,
            backgroundColor: "white",
          }}
        >
          <div className="bg-[#fafafa] rounded-[8px] w-[calc(100%-24px)] h-[calc(100%-24px)] flex flex-col items-center justify-center gap-2">
            <ScheduleIcon sx={{ fontSize: 25, color: "text.disabled" }} />
            <Typography variant="body2" color="text.primary">
              No tienes actividades hoy
            </Typography>

            <Button
              onClick={() => router.push("/productos/actividades/nueva")}
              variant="contained"
              size="medium"
              sx={{
                backgroundColor: "#F47920",
                "&:hover": { backgroundColor: "#d86715" },
              }}
            >
              + Crear actividad
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        disableColumnFilter
        disableColumnMenu
        paginationModel={
          rows.length > 20 ? { pageSize: 50, page: 0 } : undefined
        }
        pageSizeOptions={rows.length > 20 ? [20] : []}
        hideFooterPagination={rows.length <= 20}
        autoHeight
        initialState={{
          sorting: {
            sortModel: [{ field: "availability", sort: "desc" }],
          },
        }}
        sx={{
          width: "100%",
          mt: "16px",
          // pointerEvents: "none", // <- Esto
          backgroundColor: "white",
          "--DataGrid-containerBackground": "#fafafa",
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "white !important",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: "white !important",
          },
        }}
        slots={{
          footer: rows.length > 20 ? undefined : () => null,
        }}
      />
      <div className="flex flex-row gap-4 my-4">
        <div className="w-1/3 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
          <div className="flex flex-row gap-2 items-center h-full pl-4">
            <div className="flex flex-col ">
              <Typography variant="h6" color="text.primary">
                {payoutLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  payoutInfo?.nextPayoutDate || "-"
                )}
              </Typography>
              <Typography variant="caption" color="text.primary">
                Fecha de próximo pago
              </Typography>
            </div>
          </div>
        </div>
        <div className="w-1/3 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
          <div className="flex flex-row gap-2 items-center h-full pl-4">
            <div className="flex flex-col ">
              <Typography variant="h6" color="text.primary">
                {payoutLoading ? (
                  <CircularProgress size={20} />
                ) : payoutInfo ? (
                  `$${Number(payoutInfo.pendingAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                ) : (
                  "-"
                )}
              </Typography>
              <Typography variant="caption" color="text.primary">
                Dinero pendiente
              </Typography>
            </div>
          </div>
        </div>

        <div className="w-1/3 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
          <div className="flex flex-row gap-2 items-center h-full pl-4">
            <div className="flex flex-col ">
              <Typography variant="h6" color="text.primary">
                $0.00 USD
              </Typography>
              <Typography variant="caption" color="text.primary">
                Dinero retenido
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
