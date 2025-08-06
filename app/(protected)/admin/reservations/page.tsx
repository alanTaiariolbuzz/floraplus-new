"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  TextField,
  Typography,
  Box,
  IconButton,
  Button,
  Tooltip,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import Image from "next/image";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

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

interface Reserva {
  id: number;
  turno_id: number;
  codigo_reserva: string;
  agencia_id: number;
  cliente_id: number | null;
  monto_total: number;
  pago_referencia: string | null;
  created_at: string | null;
  updated_at: string | null;
  estado: string;
  expires_at: string;
  payment_intent_id: string | null;
  actividad_id: number;
  actividad_titulo?: string;
  fee_flora_plus: number | null;
  turno: {
    id: number;
    horario_id: number;
    actividad_id: number;
    agencia_id: number;
    cupo_disponible: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    bloquear: boolean;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    cupo_total: number;
  };
  pago: {
    id: number;
    amount: number;
    currency: string;
    fee_flora_plus: number;
    net_amount: number;
    payment_method: string;
  };
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    activo: string;
  } | null;
  agencia?: {
    id: number;
    nombre: string;
  };
  reserva_items: Array<{
    id: number;
    total: number;
    detalle: {
      id: number;
      activa: boolean;
      nombre: string;
      precio: number;
      created_at: string | null;
      deleted_at: string | null;
      updated_at: string | null;
      actividad_id: number;
      es_principal: boolean;
    };
    item_id: number;
    cantidad: number;
    item_type: string;
    descripcion: string;
    precio_unitario: number;
  }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const formatearFecha = (fechaIso: string | undefined | null) => {
  if (!fechaIso) return "Sin fecha";
  try {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return "Fecha inválida";
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  } catch (error) {
    return "Fecha inválida";
  }
};

const formatearHora = (horaIso: string | undefined | null) => {
  if (!horaIso) return "Sin horario";
  try {
    return horaIso.split("+")[0].slice(0, 5);
  } catch (error) {
    return "Hora inválida";
  }
};

const formatearMonto = (monto: number | undefined | null) => {
  if (monto === undefined || monto === null) return "$0.00";
  return `$${monto.toFixed(2)}`;
};

export default function AdminReservations() {
  const [data, setData] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState<Reserva[]>([]);

  // Estados para filtros avanzados
  const [showFilters, setShowFilters] = useState(false);
  const [fechaCompraDesde, setFechaCompraDesde] = useState<Date | null>(null);
  const [fechaCompraHasta, setFechaCompraHasta] = useState<Date | null>(null);
  const [fechaActividadDesde, setFechaActividadDesde] = useState<Date | null>(
    null
  );
  const [fechaActividadHasta, setFechaActividadHasta] = useState<Date | null>(
    null
  );
  const [selectedActividad, setSelectedActividad] = useState<string>("");
  const [selectedEstado, setSelectedEstado] = useState<string>("");
  const [actividades, setActividades] = useState<
    Array<{ id: number; titulo: string }>
  >([]);

  // Load reservations data
  useEffect(() => {
    fetch(`${siteUrl}/api/reservas`)
      .then((response) => response.json())
      .then((result) => {
        if (result.data && Array.isArray(result.data)) {
          // Transform the data to ensure all fields are properly handled
          const transformedData = result.data
            .map((reserva: Reserva) => ({
              ...reserva,
              // Ensure cliente is properly handled
              cliente: reserva.cliente || null,
              // Ensure turno is properly handled
              turno: reserva.turno || null,
              // Ensure monto_total is a number
              monto_total:
                typeof reserva.monto_total === "number"
                  ? reserva.monto_total
                  : 0,
              // Ensure estado is a string
              estado: reserva.estado || "Sin estado",
              // Ensure dates are properly handled
              created_at: reserva.created_at || null,
              updated_at: reserva.updated_at || null,
              expires_at: reserva.expires_at || null,
              // Ensure id is properly set for DataGrid
              id: reserva.id || Math.random(),
              // Add flat fields for DataGrid
              cliente_nombre: reserva.cliente
                ? `${reserva.cliente.nombre || ""} ${reserva.cliente.apellido || ""}`.trim()
                : "Sin cliente",
              agencia_nombre: reserva.agencia?.nombre || "Sin agencia",
              turno_fecha: reserva.turno
                ? `${formatearFecha(reserva.turno.fecha)} - ${formatearHora(reserva.turno.hora_inicio)}hs`
                : "Sin turno",
            }))
            // Sort by created_at in descending order (newest first)
            .sort((a: Reserva, b: Reserva) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            });

          setData(transformedData);
          setFilteredData(transformedData);
        } else {
          console.error("Los datos recibidos no son un array:", result);
          setData([]);
          setFilteredData([]);
        }
      })
      .catch((error) => {
        console.error("Error al cargar las reservas:", error);
        setData([]);
        setFilteredData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter data based on search and advanced filters
  useEffect(() => {
    let filtered = data.filter((reserva) => {
      // Filtro para ocultar reservas con estado "hold" - AQUÍ ES DONDE FILTRAMOS LAS HOLD
      if (reserva.estado === "hold") {
        return false; // Ocultar reservas con estado "hold"
      }

      // Filtro de búsqueda mejorada - solo por cliente o número de reserva
      const searchLower = search.toLowerCase();
      const nombreCliente = reserva?.cliente?.nombre?.toLowerCase() || "";
      const apellidoCliente = reserva?.cliente?.apellido?.toLowerCase() || "";
      const codigoReserva = reserva?.codigo_reserva?.toLowerCase() || "";

      // Normalizar códigos de reserva removiendo guiones para búsqueda
      const codigoReservaNormalizado = codigoReserva.replace(/-/g, "");
      const searchNormalizado = searchLower.replace(/-/g, "");

      const searchMatch =
        // Búsqueda por código de reserva (con y sin guiones)
        codigoReserva.includes(searchLower) ||
        codigoReservaNormalizado.includes(searchNormalizado) ||
        // Búsqueda por nombre individual
        nombreCliente.includes(searchLower) ||
        // Búsqueda por apellido individual
        apellidoCliente.includes(searchLower) ||
        // Búsqueda por nombre completo (nombre + apellido)
        `${nombreCliente} ${apellidoCliente}`.includes(searchLower) ||
        // Búsqueda por apellido + nombre
        `${apellidoCliente} ${nombreCliente}`.includes(searchLower);

      // Filtro de fecha de compra
      const fechaCompraMatch =
        !fechaCompraDesde && !fechaCompraHasta
          ? true
          : (() => {
              const reservaDate = new Date(reserva.created_at || "");
              const desde = fechaCompraDesde
                ? new Date(fechaCompraDesde)
                : null;
              const hasta = fechaCompraHasta
                ? new Date(fechaCompraHasta)
                : null;

              if (desde && hasta) {
                return reservaDate >= desde && reservaDate <= hasta;
              } else if (desde) {
                return reservaDate >= desde;
              } else if (hasta) {
                return reservaDate <= hasta;
              }
              return true;
            })();

      // Filtro de fecha de actividad
      const fechaActividadMatch =
        !fechaActividadDesde && !fechaActividadHasta
          ? true
          : (() => {
              if (!reserva.turno?.fecha) return true;
              const actividadDate = new Date(reserva.turno.fecha);
              const desde = fechaActividadDesde
                ? new Date(fechaActividadDesde)
                : null;
              const hasta = fechaActividadHasta
                ? new Date(fechaActividadHasta)
                : null;

              if (desde && hasta) {
                return actividadDate >= desde && actividadDate <= hasta;
              } else if (desde) {
                return actividadDate >= desde;
              } else if (hasta) {
                return actividadDate <= hasta;
              }
              return true;
            })();

      // Filtro de actividad
      const actividadMatch =
        !selectedActividad ||
        selectedActividad === "all" ||
        reserva.actividad_id?.toString() === selectedActividad;

      // Filtro de estado
      const estadoMatch =
        !selectedEstado ||
        selectedEstado === "all" ||
        reserva.estado === selectedEstado ||
        STATUS_NORMALIZATION[
          reserva.estado.toLowerCase() as keyof typeof STATUS_NORMALIZATION
        ] === selectedEstado;

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
    selectedEstado,
  ]);

  // Calcular total de personas
  const totalPersonas = filteredData.reduce((total, reserva) => {
    return (
      total +
      (reserva.reserva_items?.reduce((sum, item) => sum + item.cantidad, 0) ||
        0)
    );
  }, 0);

  // Cargar actividades únicas
  useEffect(() => {
    const actividadesUnicas = Array.from(
      new Set(data.map((reserva) => reserva.actividad_id))
    ).map((actividadId) => {
      const reserva = data.find((r) => r.actividad_id === actividadId);
      return {
        id: actividadId,
        titulo: reserva?.actividad_titulo || `Actividad ${actividadId}`,
      };
    });
    setActividades(actividadesUnicas);
  }, [data]);

  const columns = [
    {
      field: "codigo_reserva",
      headerName: "Código de Reserva",
      width: 90,
    },
    {
      field: "agencia_nombre",
      headerName: "Tour Operador",
      width: 200,
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 130,
      renderCell: (params: any) => {
        const estado = params.row.estado;
        const normalizedStatus = estado.toLowerCase();
        const normalizedKey =
          STATUS_NORMALIZATION[
            normalizedStatus as keyof typeof STATUS_NORMALIZATION
          ] || normalizedStatus;
        const config = STATUS_CONFIG[
          normalizedKey as keyof typeof STATUS_CONFIG
        ] || {
          label: estado,
          color: "#757575",
          backgroundColor: "#F5F5F5",
        };

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <div
              style={{
                backgroundColor: config.backgroundColor,
                color: config.color,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "normal",
                lineHeight: "18px",
                letterSpacing: "0.16px",
                width: "fit-content",
                minWidth: "80px",
                textAlign: "center",
                textTransform: "capitalize",
              }}
            >
              {config.label}
            </div>
          </div>
        );
      },
    },
    {
      field: "pago",
      headerName: "Monto Total",
      width: 130,
      valueFormatter: (params: any) => {
        return formatearMonto(params?.amount);
      },
    },
    {
      field: "turno_fecha",
      headerName: "Fecha del Tour",
      width: 180,
    },
    {
      field: "created_at",
      headerName: "Fecha de Creación",
      width: 180,
      valueFormatter: (params: any) => {
        return formatearFecha(params);
      },
    },
    {
      field: "fee_flora_plus",
      headerName: "Fee Flora Plus",
      width: 180,
      renderCell: (params: any) => {
        const fee = params.row?.pago?.fee_flora_plus;
        return formatearMonto(fee);
      },
    },
  ];

  return (
    <>
      <div className="bg-white overflow-hidden">
        <div className="">
          <div className="flex flex-row justify-between items-center bg-[#FAFAFA] py-6">
            <Typography variant="h4" sx={{ fontWeight: "500" }}>
              Reservas
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderColor: "#E0E0E0",
                color: "#666",
                "&:hover": {
                  borderColor: "#F47920",
                  color: "#F47920",
                },
              }}
            >
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
          </div>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <div className="">
              {showFilters && (
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
                        <DatePicker
                          label="Desde"
                          value={fechaActividadDesde}
                          onChange={(newValue) =>
                            setFechaActividadDesde(newValue)
                          }
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
                        <DatePicker
                          label="Hasta"
                          value={fechaActividadHasta}
                          onChange={(newValue) =>
                            setFechaActividadHasta(newValue)
                          }
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
                        ))}
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
                        onChange={(e) =>
                          setSelectedEstado(e.target.value as string)
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
            </div>
          </LocalizationProvider>

          <div className="border border-[#E0E0E0] rounded-[4px]">
            <Box
              sx={{
                maxHeight: filteredData.length === 0 ? 230 : "auto",
                width: "100%",
                height: filteredData.length === 0 ? 230 : "auto",
              }}
            >
              <DataGrid
                sx={{
                  border: "none!important",
                  "--DataGrid-containerBackground": "#FAFAFA",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#FAFAFA",
                  },
                  "& .MuiDataGrid-row": {
                    cursor: "default",
                    pointerEvents: "auto",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "inherit !important",
                  },
                  "& .MuiDataGrid-row.Mui-selected": {
                    backgroundColor: "inherit !important",
                  },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within":
                    {
                      outline: "none !important",
                    },
                }}
                rows={filteredData}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.id}
                paginationModel={
                  filteredData.length > 100
                    ? { pageSize: 100, page: 0 }
                    : undefined
                }
                disableColumnFilter
                disableColumnMenu
                pageSizeOptions={filteredData.length > 100 ? [100] : []}
                hideFooterPagination={filteredData.length <= 100}
                isRowSelectable={() => false}
                disableRowSelectionOnClick
                onRowClick={undefined}
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
                      <div className="bg-[#fafafa] rounded-[8px] w-[calc(100%-16px)] h-[calc(100%-16px)] flex flex-col items-center justify-center gap-2">
                        <Image
                          src="/icons/mail-error.svg"
                          alt="Mail Error"
                          width={21}
                          height={21}
                        />
                        <Typography variant="body2" className="pt-5">
                          No tienes reservas para mostrar
                        </Typography>
                      </div>
                    </div>
                  ),
                  footer: filteredData.length > 100 ? undefined : () => null,
                }}
              />
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}
