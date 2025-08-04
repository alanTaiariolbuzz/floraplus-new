"use client";
import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Menu,
  ListItemIcon,
  Snackbar,
  Alert,
} from "@mui/material";
import Schedule from "@mui/icons-material/Schedule";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useRouter } from "next/navigation";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import AddIcon from "@mui/icons-material/Add";

// Status mapping and configuration
const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: "#FFA726", // Orange
    backgroundColor: "#FFF3E0",
  },
  hold: {
    label: "Pendiente",
    color: "#FFA726", // Orange
    backgroundColor: "#FFF3E0",
  },
  confirmada: {
    label: "Confirmado",
    color: "#43A047", // Green
    backgroundColor: "#E8F5E9",
  },
  confirmed: {
    label: "Confirmado",
    color: "#43A047", // Green
    backgroundColor: "#E8F5E9",
  },
  expirada: {
    label: "Expirado",
    color: "#757575", // Grey
    backgroundColor: "#F5F5F5",
  },
  expired: {
    label: "Expirado",
    color: "#757575", // Grey
    backgroundColor: "#F5F5F5",
  },
  cancelada: {
    label: "Cancelado",
    color: "#E53935", // Red
    backgroundColor: "#FFEBEE",
  },
  cancelled: {
    label: "Cancelado",
    color: "#E53935", // Red
    backgroundColor: "#FFEBEE",
  },
  refunded: {
    label: "Cancelado",
    color: "#E53935", // Red
    backgroundColor: "#FFEBEE",
  },
  "no-show": {
    label: "No Show",
    color: "#8E24AA", // Purple
    backgroundColor: "#F3E5F5",
  },
  "check-in": {
    label: "Check In",
    color: "#1E88E5", // Blue
    backgroundColor: "#E3F2FD",
  },
};

// Status normalization mapping
const STATUS_NORMALIZATION = {
  hold: "pendiente",
  confirmed: "confirmada",
  expired: "expirada",
  cancelled: "cancelada",
  refunded: "cancelada",
  "no-show": "no-show",
  "check-in": "check-in",
  // Spanish versions map to themselves
  pendiente: "pendiente",
  confirmada: "confirmada",
  expirada: "expirada",
  cancelada: "cancelada",
};

// Unique status options for dropdown (without duplicates)
const UNIQUE_STATUS_OPTIONS = [
  { key: "pendiente", label: "Pendiente" },
  { key: "confirmada", label: "Confirmado" },
  { key: "expirada", label: "Expirado" },
  { key: "cancelada", label: "Cancelado" },
  { key: "no-show", label: "No Show" },
  { key: "check-in", label: "Check In" },
];

interface Actividad {
  id: number;
  titulo: string;
}

interface Reserva {
  id: number;
  codigo_reserva: string;
  estado: string;
  cliente: {
    nombre: string;
    apellido: string;
  };
  monto_total: number;
  actividad_titulo: string;
  fecha_compra: string;
  fecha_tour: string;
  actividad: string;
  turno?: {
    actividad_id: number;
    fecha: string;
    hora_inicio: string;
  };
  reserva_items: Array<{
    detalle?: {
      created_at: string;
    };
    item_type: string;
    item_id: number;
    cantidad: number;
  }>;

  clienteNombre: string;
  clienteApellido: string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Status Chip Component for DataGrid
const StatusChip = ({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange?: (newStatus: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const normalizedStatus = status?.toLowerCase() || "";

  // Normalize status to Spanish version
  const normalizedKey =
    STATUS_NORMALIZATION[
      normalizedStatus as keyof typeof STATUS_NORMALIZATION
    ] || normalizedStatus;

  const config = STATUS_CONFIG[normalizedKey as keyof typeof STATUS_CONFIG] || {
    label: status || "Sin estado",
    color: "#757575",
    backgroundColor: "#F5F5F5",
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent row click when clicking on status chip
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    handleClose();
  };

  return (
    <>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: config.backgroundColor,
          borderRadius: "4px",
          border: `1px solid ${config.color}`,
          width: "120px",
          height: "32px",
          cursor: "pointer",
          overflow: "hidden",
        }}
        onClick={handleClick}
      >
        <Typography
          style={{
            color: config.color,
            fontWeight: 500,
            padding: "0 8px",
            flex: 1,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "13px",
          }}
        >
          {config.label}
        </Typography>
        <div
          style={{
            borderLeft: `1px solid ${config.color}`,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            flexShrink: 0,
          }}
        >
          <KeyboardArrowDownIcon
            style={{
              color: config.color,
              fontSize: "16px",
            }}
          />
        </div>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            marginTop: "4px",
            borderRadius: "4px",
          },
        }}
      >
        {UNIQUE_STATUS_OPTIONS.map((option) => {
          const statusConfig =
            STATUS_CONFIG[option.key as keyof typeof STATUS_CONFIG];
          return (
            <MenuItem
              key={option.key}
              onClick={(event) => {
                event.stopPropagation(); // Prevent row click when selecting status
                handleStatusSelect(option.key);
              }}
              style={{
                minWidth: "120px",
                color: statusConfig.color,
                fontSize: "13px",
              }}
            >
              {normalizedKey === option.key && (
                <ListItemIcon>
                  <CheckIcon
                    style={{ color: statusConfig.color, fontSize: "16px" }}
                  />
                </ListItemIcon>
              )}
              {option.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

const formatearFecha = (fechaIso: string) => {
  if (!fechaIso || fechaIso === "Sin fecha") return "Sin fecha";

  const fecha = new Date(fechaIso);
  if (isNaN(fecha.getTime())) return "Fecha inválida";

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const año = fecha.getFullYear();
  return `${dia}/${mes}/${año}`;
};

const formatearHora = (horaIso: string) => {
  if (!horaIso) return "Sin horario";

  // Extraer la hora del formato ISO
  const hora = horaIso.split("+")[0].slice(0, 5); // "12:30"

  // Convertir a formato 12 horas con AM/PM
  const [horas, minutos] = hora.split(":");
  const horaNum = parseInt(horas);

  // Determinar AM/PM
  const ampm = horaNum >= 12 ? "PM" : "AM";

  // Convertir a formato 12 horas
  let hora12;
  if (horaNum === 0) {
    hora12 = 12; // 00:00 → 12:00 AM
  } else if (horaNum === 12) {
    hora12 = 12; // 12:00 → 12:00 PM
  } else if (horaNum > 12) {
    hora12 = horaNum - 12; // 13:00 → 1:00 PM, 18:10 → 6:10 PM
  } else {
    hora12 = horaNum; // 1:00 → 1:00 AM, 6:00 → 6:00 AM
  }

  return `${hora12}:${minutos} ${ampm}`;
};

export default function ReservaDataGrid({
  showFilters = true,
  currentDate = null,
  dashboardMode = false,
  isLoading = false,
}: {
  showFilters?: boolean;
  currentDate?: Date | null;
  dashboardMode?: boolean;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fechaCompraDesde, setFechaCompraDesde] = useState<Date | null>(null);
  const [fechaCompraHasta, setFechaCompraHasta] = useState<Date | null>(null);
  const [fechaActividadDesde, setFechaActividadDesde] = useState<Date | null>(
    null
  );
  const [fechaActividadHasta, setFechaActividadHasta] = useState<Date | null>(
    null
  );
  const [selectedActividad, setSelectedActividad] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [filteredData, setFilteredData] = useState<Reserva[]>([]);
  const [totalPersonas, setTotalPersonas] = useState(0);
  const [showFiltersState, setShowFiltersState] = useState(showFilters);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const compararFechas = (fecha1: Date | null, fecha2: string) => {
    if (!fecha1) return true;
    const fecha2Date = new Date(fecha2);

    return (
      fecha1.getDate() === fecha2Date.getDate() &&
      fecha1.getMonth() === fecha2Date.getMonth() &&
      fecha1.getFullYear() === fecha2Date.getFullYear()
    );
  };

  const compararRangoFechas = (
    fechaDesde: Date | null,
    fechaHasta: Date | null,
    fechaComparar: string
  ) => {
    if (!fechaDesde && !fechaHasta) return true;

    const fechaCompararDate = new Date(fechaComparar);

    if (fechaDesde && fechaHasta) {
      return fechaCompararDate >= fechaDesde && fechaCompararDate <= fechaHasta;
    } else if (fechaDesde) {
      return fechaCompararDate >= fechaDesde;
    } else if (fechaHasta) {
      return fechaCompararDate <= fechaHasta;
    }

    return true;
  };

  // Cargar las actividades
  useEffect(() => {
    fetch(`${siteUrl}/api/actividades`)
      .then((response) => response.json())
      .then((actividades) => {
        setActividades(actividades.data || []); // Asumimos que esto es un array de actividades
      })
      .catch((error) => {
        console.error("Error al cargar las actividades:", error);
        setActividades([]);
      });
  }, []);

  // Cargar las reservas
  useEffect(() => {
    fetch(`${siteUrl}/api/reservas`)
      .then((response) => response.json())
      .then((reservas) => {
        const rows =
          reservas.data?.map((reserva: any) => {
            return {
              id: reserva.id || 0,
              codigo_reserva: reserva.codigo_reserva || "Sin código",
              estado: reserva.estado || "Sin estado",
              clienteNombre: reserva.cliente?.nombre || "",
              clienteApellido: reserva.cliente?.apellido || "",
              cliente:
                `${reserva.cliente?.nombre || ""} ${reserva.cliente?.apellido || ""}`.trim() ||
                "Sin nombre",
              monto_total: (reserva.monto_total || 0) + " USD",
              fecha_compra: reserva.created_at || "Sin fecha",
              hora_inicio: reserva.turno?.hora_inicio || "Sin horario",
              actividad: reserva.actividad_titulo || "Sin actividad",

              fecha_tour: reserva.turno?.fecha || "Sin fecha",
              reserva_items: reserva.reserva_items || [],
              pago: reserva?.pago?.amount, // <-- INCLUIDO
            };
          }) || [];

        // Invertir el orden del array
        setData(rows.reverse());
      })
      .catch((error) => {
        console.error("Error al cargar las reservas:", error);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actividades]);

  // Filtrar las reservas con los filtros aplicados
  useEffect(() => {
    const filtered = data.filter((reserva) => {
      const nombreCliente = reserva.clienteNombre?.toLowerCase() || "";
      const apellidoCliente = reserva.clienteApellido?.toLowerCase() || "";
      const codigoReserva = reserva.codigo_reserva?.toLowerCase() || "";
      const searchLower = search.toLowerCase();

      // Filtrar por actividad seleccionada
      const actividadMatch =
        selectedActividad === "" ||
        selectedActividad === "all" ||
        (selectedActividad &&
          reserva.actividad?.toLowerCase() ===
            actividades
              .find((a) => a.id.toString() === selectedActividad)
              ?.titulo?.toLowerCase());

      // Filtrar por estado seleccionado
      const estadoMatch =
        selectedEstado === "" ||
        selectedEstado === "all" ||
        (selectedEstado &&
          (reserva.estado === selectedEstado ||
            STATUS_NORMALIZATION[
              reserva.estado?.toLowerCase() as keyof typeof STATUS_NORMALIZATION
            ] === selectedEstado));

      const fechaCompraMatch = compararRangoFechas(
        fechaCompraDesde,
        fechaCompraHasta,
        reserva.fecha_compra
      );

      const fechaActividadMatch = currentDate
        ? compararFechas(currentDate, reserva.fecha_tour)
        : compararRangoFechas(
            fechaActividadDesde,
            fechaActividadHasta,
            reserva.fecha_tour
          );

      // Lógica de búsqueda mejorada
      const searchMatch =
        // Búsqueda por código de reserva
        codigoReserva.includes(searchLower) ||
        // Búsqueda por nombre individual
        nombreCliente.includes(searchLower) ||
        // Búsqueda por apellido individual
        apellidoCliente.includes(searchLower) ||
        // Búsqueda por nombre completo (nombre + apellido)
        `${nombreCliente} ${apellidoCliente}`.includes(searchLower) ||
        // Búsqueda por apellido + nombre
        `${apellidoCliente} ${nombreCliente}`.includes(searchLower);

      return (
        searchMatch &&
        fechaCompraMatch &&
        fechaActividadMatch &&
        actividadMatch &&
        estadoMatch
      );
    });

    setFilteredData(filtered);
  }, [
    data,
    search,
    fechaCompraDesde,
    fechaCompraHasta,
    fechaActividadDesde,
    fechaActividadHasta,
    selectedActividad,
    currentDate,
    actividades,
    selectedEstado,
  ]);

  useEffect(() => {
    // Calcular el total de personas
    const total = filteredData.reduce((acc, reserva) => {
      // Sumar todas las cantidades de los items de reserva
      const personasEnReserva = reserva.reserva_items.reduce(
        (sum, item) => sum + (item.item_type === "tarifa" ? item.cantidad : 0),
        0
      );
      return acc + personasEnReserva;
    }, 0);
    setTotalPersonas(total);
  }, [filteredData]);

  const handleRowClick = (params: any) => {
    router.push(`/reservas/${params.row.id}`);
  };

  const updateReservationStatus = async (
    reservaId: number,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `${siteUrl}/api/reservas/${reservaId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // Update local state
        setData((prevData) =>
          prevData.map((reserva) =>
            reserva.id === reservaId
              ? { ...reserva, estado: newStatus }
              : reserva
          )
        );

        setSnackbar({
          open: true,
          message: `Estado de la reserva actualizado a: ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`,
          severity: "success",
        });
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message:
            errorData.message || "Error al actualizar el estado de la reserva",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al actualizar el estado de la reserva",
        severity: "error",
      });
    }
  };

  const handleStatusChange = async (reservaId: number, newStatus: string) => {
    await updateReservationStatus(reservaId, newStatus);
  };

  const formatearMonto = (monto: number | undefined | null) => {
    if (monto === undefined || monto === null) return "$0.00";
    return `$${monto.toFixed(2)}`;
  };

  const getColumns = (dashboardMode: boolean = false) => {
    const baseColumns = [
      { field: "cliente", headerName: "Cliente", flex: 1 },
      { field: "codigo_reserva", headerName: "Nro. Reserva", flex: 1 },
      { field: "actividad", headerName: "Actividad", flex: 1 },
      ...(dashboardMode
        ? [{ field: "hora_inicio", headerName: "Horario", flex: 1 }]
        : []),
    ];

    if (!dashboardMode) {
      return [
        ...baseColumns,
        {
          field: "estado",
          headerName: "Estado",
          flex: 1,
          renderCell: (params: any) => {
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <StatusChip
                  status={params.row.estado}
                  onStatusChange={(newStatus) =>
                    handleStatusChange(params.row.id, newStatus)
                  }
                />
              </div>
            );
          },
        },
        {
          field: "pago",
          headerName: "Precio Total",
          flex: 1,
          renderCell: (params: any) => {
            return <div>{formatearMonto(params.row.pago)}</div>;
          },
        },
        {
          field: "fecha_compra",
          headerName: "Fecha de Compra",
          flex: 1,
          renderCell: (params: any) => {
            return <div>{formatearFecha(params.row.fecha_compra)}</div>;
          },
        },
        {
          field: "fecha_tour",
          headerName: "Fecha y hora del Tour",
          flex: 1,
          renderCell: (params: any) => {
            const fecha = formatearFecha(params.row.fecha_tour);
            const hora = formatearHora(params.row.hora_inicio);
            return (
              <div>
                {fecha} - {hora}
              </div>
            );
          },
        },
      ];
    }

    return baseColumns;
  };

  const limpiarTodosLosFiltros = () => {
    setSearch("");
    setFechaCompraDesde(null);
    setFechaCompraHasta(null);
    setFechaActividadDesde(null);
    setFechaActividadHasta(null);
    setSelectedActividad("");
    setSelectedEstado("");
  };

  // Check if any filters are applied
  const hasActiveFilters = () => {
    return (
      search !== "" ||
      fechaCompraDesde !== null ||
      fechaCompraHasta !== null ||
      fechaActividadDesde !== null ||
      fechaActividadHasta !== null ||
      selectedActividad !== "" ||
      selectedEstado !== ""
    );
  };

  // Add a check to prevent rendering before data is ready
  if (loading && data.length === 0) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <div className="flex justify-center items-center h-[70vh]">
          <CircularProgress />
        </div>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <div className="pb-4">
        {/* Header with title and toggle button */}
        <div className="flex flex-row justify-between items-center bg-[#FAFAFA] py-6">
          <Typography variant="h4" sx={{ fontWeight: "500" }}></Typography>
          <div style={{ display: "flex", gap: "12px" }}>
            {showFiltersState && hasActiveFilters() && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={limpiarTodosLosFiltros}
                sx={{
                  borderColor: "#E0E0E0",
                  color: "#666",
                  fontSize: "13px",
                  "&:hover": {
                    borderColor: "#E53935",
                    color: "#E53935",
                  },
                }}
              >
                Limpiar filtros
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFiltersState(!showFiltersState)}
              sx={{
                borderColor: "#E0E0E0",
                color: "#666",
                "&:hover": {
                  borderColor: "#F47920",
                  color: "#F47920",
                },
              }}
            >
              {showFiltersState ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
          </div>
        </div>

        {showFiltersState && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
              padding: "20px",
              backgroundColor: "#FAFAFA",
              borderRadius: "12px",
              border: "1px solid #E0E0E0",
            }}
          >
            {/* Primera fila - Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div style={{ position: "relative" }}>
                <TextField
                  label="Buscar por cliente o número de reserva"
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{
                    minWidth: "300px",
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      borderRadius: "8px",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "14px",
                      color: "#666",
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "14px",
                    },
                  }}
                />
                {search && (
                  <IconButton
                    size="small"
                    onClick={() => setSearch("")}
                    sx={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "20px",
                      height: "20px",
                      color: "#999",
                      "&:hover": {
                        color: "#E53935",
                      },
                    }}
                  >
                    <ClearIcon sx={{ fontSize: "14px" }} />
                  </IconButton>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "13px" }}
                >
                  Total de reservas: {filteredData.length}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "13px" }}
                >
                  • Total personas: {totalPersonas}
                </Typography>
              </div>
            </div>

            {/* Segunda fila - Filtros de fechas y actividad */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              {/* Rango de Fechas de Compra */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minWidth: "200px",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "12px", fontWeight: "500" }}
                >
                  Fechas de Compra
                </Typography>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative" }}>
                    <DatePicker
                      label="Desde"
                      value={fechaCompraDesde}
                      onChange={(newValue) => setFechaCompraDesde(newValue)}
                      format="dd/MM/yyyy"
                      maxDate={fechaCompraHasta || undefined}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: {
                            minWidth: "120px",
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "white",
                              borderRadius: "6px",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: "12px",
                            },
                            "& .MuiInputBase-input": {
                              fontSize: "12px",
                            },
                            "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                              color: "#F47920",
                            },
                          },
                        },
                      }}
                    />
                    {fechaCompraDesde && (
                      <IconButton
                        size="small"
                        onClick={() => setFechaCompraDesde(null)}
                        sx={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          width: "20px",
                          height: "20px",
                          backgroundColor: "white",
                          border: "1px solid #E0E0E0",
                          borderRadius: "50%",
                          color: "#999",
                          zIndex: 1,
                          "&:hover": {
                            color: "#E53935",
                            backgroundColor: "white",
                            borderColor: "#E53935",
                          },
                        }}
                      >
                        <ClearIcon sx={{ fontSize: "12px" }} />
                      </IconButton>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <DatePicker
                      label="Hasta"
                      value={fechaCompraHasta}
                      onChange={(newValue) => setFechaCompraHasta(newValue)}
                      format="dd/MM/yyyy"
                      minDate={fechaCompraDesde || undefined}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: {
                            minWidth: "120px",
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "white",
                              borderRadius: "6px",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: "12px",
                            },
                            "& .MuiInputBase-input": {
                              fontSize: "12px",
                            },
                            "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                              color: "#F47920",
                            },
                          },
                        },
                      }}
                    />
                    {fechaCompraHasta && (
                      <IconButton
                        size="small"
                        onClick={() => setFechaCompraHasta(null)}
                        sx={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          width: "20px",
                          height: "20px",
                          backgroundColor: "white",
                          border: "1px solid #E0E0E0",
                          borderRadius: "50%",
                          color: "#999",
                          zIndex: 1,
                          "&:hover": {
                            color: "#E53935",
                            backgroundColor: "white",
                            borderColor: "#E53935",
                          },
                        }}
                      >
                        <ClearIcon sx={{ fontSize: "12px" }} />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>

              {/* Fecha de la Actividad - Rango */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minWidth: "200px",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "12px", fontWeight: "500" }}
                >
                  Fechas de Actividad
                </Typography>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative" }}>
                    <DatePicker
                      label="Desde"
                      value={fechaActividadDesde}
                      onChange={(newValue) => setFechaActividadDesde(newValue)}
                      format="dd/MM/yyyy"
                      maxDate={fechaActividadHasta || undefined}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: {
                            minWidth: "120px",
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "white",
                              borderRadius: "6px",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: "12px",
                            },
                            "& .MuiInputBase-input": {
                              fontSize: "12px",
                            },
                            "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                              color: "#F47920",
                            },
                          },
                        },
                      }}
                    />
                    {fechaActividadDesde && (
                      <IconButton
                        size="small"
                        onClick={() => setFechaActividadDesde(null)}
                        sx={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          width: "20px",
                          height: "20px",
                          backgroundColor: "white",
                          border: "1px solid #E0E0E0",
                          borderRadius: "50%",
                          color: "#999",
                          zIndex: 1,
                          "&:hover": {
                            color: "#E53935",
                            backgroundColor: "white",
                            borderColor: "#E53935",
                          },
                        }}
                      >
                        <ClearIcon sx={{ fontSize: "12px" }} />
                      </IconButton>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <DatePicker
                      label="Hasta"
                      value={fechaActividadHasta}
                      onChange={(newValue) => setFechaActividadHasta(newValue)}
                      format="dd/MM/yyyy"
                      minDate={fechaActividadDesde || undefined}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: {
                            minWidth: "120px",
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "white",
                              borderRadius: "6px",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: "12px",
                            },
                            "& .MuiInputBase-input": {
                              fontSize: "12px",
                            },
                            "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                              color: "#F47920",
                            },
                          },
                        },
                      }}
                    />
                    {fechaActividadHasta && (
                      <IconButton
                        size="small"
                        onClick={() => setFechaActividadHasta(null)}
                        sx={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          width: "20px",
                          height: "20px",
                          backgroundColor: "white",
                          border: "1px solid #E0E0E0",
                          borderRadius: "50%",
                          color: "#999",
                          zIndex: 1,
                          "&:hover": {
                            color: "#E53935",
                            backgroundColor: "white",
                            borderColor: "#E53935",
                          },
                        }}
                      >
                        <ClearIcon sx={{ fontSize: "12px" }} />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>

              {/* Seleccionar Actividad */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minWidth: "200px",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "12px", fontWeight: "500" }}
                >
                  Actividad
                </Typography>
                <Select
                  displayEmpty
                  value={selectedActividad}
                  onChange={(e) =>
                    setSelectedActividad(e.target.value as string)
                  }
                  size="small"
                  sx={{
                    minWidth: "200px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    "& .MuiSelect-select": {
                      padding: "8px 12px",
                      fontSize: "12px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E0E0E0",
                    },
                  }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: "12px" }}>
                    Filtrar por actividad
                  </MenuItem>
                  <MenuItem value="all" sx={{ fontSize: "12px" }}>
                    Todas las actividades
                  </MenuItem>
                  {actividades?.map((actividad) => (
                    <MenuItem
                      key={actividad.id}
                      value={actividad.id.toString()}
                      sx={{ fontSize: "12px" }}
                    >
                      {actividad.titulo}
                    </MenuItem>
                  )) || []}
                </Select>
              </div>

              {/* Seleccionar Estado */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minWidth: "200px",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "12px", fontWeight: "500" }}
                >
                  Estado
                </Typography>
                <Select
                  displayEmpty
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value as string)}
                  size="small"
                  sx={{
                    minWidth: "200px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    "& .MuiSelect-select": {
                      padding: "8px 12px",
                      fontSize: "12px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E0E0E0",
                    },
                  }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: "12px" }}>
                    Filtrar por estado
                  </MenuItem>
                  <MenuItem value="all" sx={{ fontSize: "12px" }}>
                    Todos los estados
                  </MenuItem>
                  {UNIQUE_STATUS_OPTIONS.map((option) => (
                    <MenuItem
                      key={option.key}
                      value={option.key}
                      sx={{ fontSize: "12px" }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}
        <Box
          sx={{
            maxHeight: filteredData.length === 0 ? 230 : "auto",
            width: "100%",
            height: filteredData.length === 0 ? 230 : "auto",
          }}
        >
          <DataGrid
            sx={{
              "--DataGrid-containerBackground": "#FAFAFA",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#FAFAFA",
              },
              backgroundColor: "white",

              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#F5F5F5 !important",
              },
              "& .MuiDataGrid-row.Mui-selected": {
                backgroundColor: "white !important",
              },
              "& .MuiDataGrid-row": {
                cursor: "pointer",
              },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
                boxShadow: "none",
              },
            }}
            disableColumnFilter
            disableColumnMenu
            rows={filteredData || []}
            columns={getColumns(dashboardMode)}
            loading={isLoading || loading}
            onRowClick={handleRowClick}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 20, page: 0 },
              },
            }}
            pageSizeOptions={[20]}
            slots={{
              noRowsOverlay: () => (
                <div
                  style={{
                    height: "100%",
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
                  <div className="bg-[#FAFAFA] rounded-[8px] w-[calc(100%-16px)] h-[calc(100%-16px)] flex flex-col items-center justify-center gap-2">
                    <Schedule sx={{ fontSize: 25, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">
                      {dashboardMode
                        ? "No tienes reservas para hoy"
                        : "No tienes reservas"}
                    </Typography>
                  </div>
                </div>
              ),
              footer: filteredData.length > 20 ? undefined : () => null,
            }}
          />
        </Box>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}
