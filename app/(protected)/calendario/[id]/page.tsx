"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { use } from "react";
import GroupsIcon from "@mui/icons-material/Groups";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Image from "next/image";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface Turno {
  id: string;
  actividad_id: string;
  fecha: string;
  hora_inicio: string;
  cupo_total: number;
  cupo_disponible: number;
}

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
}

interface Reserva {
  id: number;
  codigo_reserva: string;
  estado: string;
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  monto_total: number;
  created_at: string;
  fecha_compra: string;
  fecha_tour: string;
  pago: {
    fee_flora_plus: number;
    amount: number;
    currency: string;
    payment_method: string;
    net_amount: number;
    final_fee: number;
    final_tax: number;
  };
  actividad: string;
  actividad_id: number;
  turno?: {
    actividad_id: number;
    fecha: string;
    hora_inicio?: string;
  };
  reserva_items: Array<{
    cantidad: number;
    descripcion: string;
    total: number;
    item_type: string;
    detalle?: {
      created_at: string;
    };
  }>;
}

// Status mapping and configuration
const STATUS_CONFIG = {
  hold: {
    label: "Pendiente",
    color: "#FFA726", // Orange
    backgroundColor: "#FFF3E0",
  },
  confirmed: {
    label: "Confirmado",
    color: "#43A047", // Green
    backgroundColor: "#E8F5E9",
  },
  expired: {
    label: "Expirado",
    color: "#757575", // Grey
    backgroundColor: "#F5F5F5",
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

// Status Chip Component
const StatusChip = ({
  status,
  onStatusChange,
  size = "default",
}: {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  size?: "default" | "small";
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const normalizedStatus = status.toLowerCase();
  const config = STATUS_CONFIG[
    normalizedStatus as keyof typeof STATUS_CONFIG
  ] || {
    label: status,
    color: "#757575",
    backgroundColor: "#F5F5F5",
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onStatusChange) {
      setAnchorEl(event.currentTarget);
    }
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
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: config.backgroundColor,
          borderRadius: "4px",
          border: `1px solid ${config.color}`,
          width: size === "small" ? "120px" : "160px",
          height: size === "small" ? "30px" : "40px",
          cursor: onStatusChange ? "pointer" : "default",
          overflow: "hidden",
          "&:hover": {
            opacity: onStatusChange ? 0.9 : 1,
          },
        }}
        onClick={handleClick}
      >
        <Typography
          sx={{
            color: config.color,
            fontWeight: 500,
            px: 2,
            flex: 1,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: size === "small" ? "0.95rem" : undefined,
          }}
        >
          {config.label}
        </Typography>
        {onStatusChange && (
          <Box
            sx={{
              borderLeft: `1px solid ${config.color}`,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: size === "small" ? "24px" : "32px",
              flexShrink: 0,
            }}
          >
            <KeyboardArrowDownIcon
              sx={{
                color: config.color,
                fontSize: size === "small" ? "16px" : "20px",
              }}
            />
          </Box>
        )}
      </Box>
      {onStatusChange && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: "4px",
            },
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([statusKey, statusConfig]) => (
            <MenuItem
              key={statusKey}
              onClick={() => handleStatusSelect(statusKey)}
              sx={{
                minWidth: "140px",
                color: statusConfig.color,
                "&:hover": {
                  backgroundColor: statusConfig.backgroundColor,
                },
              }}
            >
              {normalizedStatus === statusKey && (
                <ListItemIcon>
                  <CheckIcon sx={{ color: statusConfig.color }} />
                </ListItemIcon>
              )}
              {statusConfig.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};

export default function CalendarDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ color?: string; colorprincipal?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const [bounceCopyIcon, setBounceCopyIcon] = useState(false);
  // Agregar estado para el copiado de cada reserva en la tabla:
  const [copiedReservaId, setCopiedReservaId] = useState<string | null>(null);

  const handleCheckIn = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReserva(null);
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedReserva) {
      setSelectedReserva({
        ...selectedReserva,
        estado: newStatus,
      });
    }
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch turno data
        const turnoResponse = await fetch(
          `${siteUrl}/api/turnos?id=${resolvedParams.id}`
        );
        if (!turnoResponse.ok) {
          throw new Error("Failed to fetch turno data");
        }
        const turnoData = await turnoResponse.json();
        setTurno(turnoData.data[0]);

        // Fetch activity data (incluyendo soft deleted para mostrar en reservas)
        if (turnoData.data[0]?.actividad_id) {
          const actividadResponse = await fetch(
            `${siteUrl}/api/actividades?id=${turnoData.data[0].actividad_id}&include_deleted=true`
          );
          if (!actividadResponse.ok) {
            throw new Error("Failed to fetch activity data");
          }
          const actividadData = await actividadResponse.json();
          setActividad(actividadData.data);
        }

        // Fetch reservations for this turno
        const reservasResponse = await fetch(
          `${siteUrl}/api/reservas?turno_id=${resolvedParams.id}`
        );
        if (!reservasResponse.ok) {
          throw new Error("Failed to fetch reservations data");
        }
        const reservasData = await reservasResponse.json();
        setReservas(reservasData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const getBreadcrumbData = () => {
    if (!turno || !actividad)
      return { dateRange: "", rest: "", href: "/calendario" };

    const tourDate = new Date(turno.fecha);
    const weekStart = startOfWeek(tourDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const dateRange = `${format(weekStart, "MMM dd", { locale: es })} - ${format(weekEnd, "MMM dd", { locale: es })}`;
    const tourDateTime = `${format(tourDate, "dd MMMM", { locale: es })} - ${turno.hora_inicio.slice(0, 5)}`;
    const rest = `${actividad.titulo} - ${tourDateTime}`;
    const isoWeekStart = weekStart.toISOString().slice(0, 10);
    const href = `/calendario?start=${isoWeekStart}`;

    return { dateRange, rest, href };
  };

  const { dateRange, rest, href } = getBreadcrumbData();

  const formatearMonto = (monto: number | undefined | null) => {
    if (monto === undefined || monto === null) return "$0.00";
    return `$${monto.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!turno) {
    return (
      <Box p={3}>
        <Alert severity="warning">Turno not found</Alert>
      </Box>
    );
  }

  const ocupado = turno.cupo_total - turno.cupo_disponible;
  const porcentaje = Math.round((ocupado / turno.cupo_total) * 100);

  return (
    <div className="bg-[#FAFAFA] px-12">
      <div className="flex flex-col  bg-[#FAFAFA] py-[20px]">
        <Typography
          variant="h4"
          className="pb-[10px]"
          sx={{ fontWeight: "500" }}
        >
          Calendario
        </Typography>
        <div className="flex flex-row items-center gap-2">
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ pt: "4px" }}
            gutterBottom
          >
            <Link
              href={href}
              style={{
                textDecoration: "none",
                textTransform: "capitalize",
                color: "#f47920",
              }}
            >
              {dateRange}
            </Link>
          </Typography>
          <ChevronRightIcon fontSize="small" />
          <Typography variant="body1">{rest}</Typography>
        </div>
      </div>
      <div className="flex flex-col bg-white rounded-[8px] py-[26px] px-[32px]">
        <div className="flex flex-row gap-4">
          <div
            className="w-[65%] py-[10px] px-[20px] rounded-[8px]"
            style={{ backgroundColor: resolvedSearchParams.color || "#fafafa" }}
          >
            <div
              className="pl-3"
              style={{
                borderLeft: `4px solid ${resolvedSearchParams.colorprincipal || "#fafafa"}`,
              }}
            >
              <Typography variant="body1" className="pb-1">
                {actividad?.titulo || "Loading..."}
              </Typography>
              <Typography className="body-1">
                <span className="text-[#00000099]">
                  {" "}
                  Fecha y hora del tour:{" "}
                </span>
                <span className="font-medium">
                  {new Intl.DateTimeFormat("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                    .format(new Date(turno.fecha))
                    .replace(/^\w/, (c) => c.toUpperCase())}{" "}
                  -{" "}
                  {new Intl.DateTimeFormat("es-ES", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  })
                    .format(
                      new Date(`2000-01-01T${turno.hora_inicio.split("+")[0]}`)
                    )
                    .replace(/a\.?m\.?/i, "AM")
                    .replace(/p\.?m\.?/i, "PM")}
                </span>
              </Typography>
            </div>
          </div>
          <div className="w-[35%]">
            {/* Progress bar and tickets info */}
            <div
              className="w-full bg-[#fafafa]  h-1 mb-2"
              style={{
                backgroundColor: resolvedSearchParams.color || "#fafafa",
              }}
            >
              <div
                className="bg-[#fafafa] h-1 "
                style={{
                  width: `${porcentaje}%`,
                  backgroundColor:
                    resolvedSearchParams.colorprincipal || "#fafafa",
                }}
              ></div>
            </div>

            <Typography variant="subtitle2">
              {turno.cupo_disponible > 0 ? (
                <>
                  Quedan {turno.cupo_disponible} tickets - {porcentaje}% Full
                </>
              ) : (
                <span className="">
                  No quedan tickets para este tour - Tour completo
                </span>
              )}
            </Typography>
          </div>
        </div>
        {/* Empty stete if there are no reserva inside the */}

        {/* Reservations grid */}
        <div className="w-full mt-6 border border-[#E0E0E0] rounded-[8px] overflow-hidden">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-[#FAFAFA] h-[55px]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                  Nombre del comprador
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {reservas.length < 1 && (
                <tr className="">
                  <td colSpan={4} className="border-t border-[#E0E0E0]">
                    <div className=" rounded-[8px] w-full">
                      <div className="bg-[#fafafa] h-[180px] w-[95.5%] flex flex-col items-center justify-center m-4 rounded-[10px] ">
                        <Image
                          src="/icons/mail-error.svg"
                          alt="Mail Error"
                          width={21}
                          height={21}
                        />

                        <Typography
                          variant="body1"
                          gutterBottom
                          sx={{ py: "12px" }}
                        >
                          No hay reservas para este tour
                        </Typography>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {reservas?.map((reserva) => (
                <tr
                  key={reserva?.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleCheckIn(reserva)}
                >
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    {reserva?.reserva_items
                      ?.filter((item) => item.item_type === "tarifa")
                      .reduce((total, item) => total + item.cantidad, 0)}{" "}
                    x
                    {reserva?.reserva_items
                      ?.filter((item) => item.item_type === "tarifa")
                      .reduce((total, item) => total + item.cantidad, 0) > 1
                      ? " Personas"
                      : " Persona"}
                  </td>
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    {reserva?.cliente?.nombre} {reserva?.cliente?.apellido}
                  </td>
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    <StatusChip status={reserva?.estado || ""} size="small" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "80vh",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Detalle de la reserva
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedReserva && (
            <div className="flex flex-col bg-white rounded-[8px] py-[26px] px-[32px]">
              <div className="flex flex-row gap-4">
                <div
                  className="w-[60%] py-[10px] px-[20px] rounded-[8px] h-fit"
                  style={{ backgroundColor: "#FFF3E0" }}
                >
                  <div
                    className="pl-3"
                    style={{
                      borderLeft: "4px solid #F47920",
                    }}
                  >
                    <Typography variant="body1" className="pb-1">
                      {actividad?.titulo || "Loading..."}
                    </Typography>
                    <Typography className="body-1">
                      <span className="text-[#00000099]">
                        Fecha y hora del tour:{" "}
                      </span>
                      <span className="font-medium">
                        {selectedReserva?.turno?.fecha
                          ? new Intl.DateTimeFormat("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                              .format(new Date(selectedReserva.turno.fecha))
                              .replace(/^\w/, (c) => c.toUpperCase())
                          : "Sin fecha"}{" "}
                        -{" "}
                        {selectedReserva?.turno?.hora_inicio
                          ? new Intl.DateTimeFormat("es-ES", {
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            })
                              .format(
                                new Date(
                                  `2000-01-01T${selectedReserva.turno.hora_inicio.split("+")[0]}`
                                )
                              )
                              .replace(/a\.?m\.?/i, "AM")
                              .replace(/p\.?m\.?/i, "PM")
                          : "Sin horario"}
                      </span>
                    </Typography>
                    <Typography className="body-1">
                      <span className="text-[#00000099]">Tickets: </span>
                      <span className="font-medium">
                        {selectedReserva?.reserva_items?.map((item, index) => (
                          <span key={index}>
                            {item.cantidad} {item.descripcion}
                            {index <
                            (selectedReserva?.reserva_items?.length || 0) - 1
                              ? " - "
                              : ""}
                          </span>
                        ))}
                      </span>
                    </Typography>
                    <Typography className="body-1">
                      <span className="text-[#00000099]">Subtotal: </span>
                      <span className="font-medium">
                        {formatearMonto(selectedReserva?.pago?.amount)}
                      </span>
                    </Typography>
                  </div>
                </div>
                <div className="w-[40%]">
                  <div className="flex flex-row gap-9">
                    <div className="flex flex-col ">
                      <p className="text-xs text-[#666666] pb-2">
                        Estado de la reserva
                      </p>
                      <StatusChip
                        status={selectedReserva?.estado || ""}
                        onStatusChange={undefined}
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs text-[#666666] pb-2">
                        Nro de la reserva
                      </p>
                      <div className="flex items-center gap-2">
                        <Typography variant="h5" className="pb-1">
                          {selectedReserva?.codigo_reserva}
                        </Typography>
                        {selectedReserva?.codigo_reserva && (
                          <span
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              position: "relative",
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (navigator && navigator.clipboard) {
                                await navigator.clipboard.writeText(
                                  selectedReserva.codigo_reserva
                                );
                                setBounceCopyIcon(true);
                                setTimeout(
                                  () => setBounceCopyIcon(false),
                                  1500
                                );
                              }
                            }}
                          >
                            <ContentCopyIcon
                              sx={{ color: "#F47920", fontSize: 22 }}
                              className={bounceCopyIcon ? "bounce-copy" : ""}
                            />
                            {bounceCopyIcon && (
                              <span
                                style={{
                                  color: "#F47920",
                                  fontSize: "0.85rem",
                                  marginLeft: 6,
                                  fontWeight: 500,
                                }}
                              >
                                ¡Copiado!
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    <p className="text-xs text-[#666666]">Reservado el día:</p>
                    <Typography variant="subtitle1">
                      {selectedReserva?.created_at
                        ? new Date(
                            selectedReserva.created_at
                          ).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "Sin fecha"}
                    </Typography>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4 mt-4 border-t  py-4">
                <div className="w-[60%]">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "500", pb: 1 }}
                  >
                    Datos personales
                  </Typography>
                  <Typography variant="caption">Nombre:</Typography>
                  <Typography variant="h6" className="pb-[2px]">
                    {selectedReserva?.cliente?.nombre}{" "}
                    {selectedReserva?.cliente?.apellido}
                  </Typography>
                  <Typography variant="caption">Email:</Typography>
                  <Typography variant="h6" className="pb-[2px]">
                    {selectedReserva?.cliente?.email}
                  </Typography>
                  <Typography variant="caption">Teléfono:</Typography>
                  <Typography variant="h6" className="pb-[2px]">
                    {selectedReserva?.cliente?.telefono}
                  </Typography>
                </div>

                <div className="w-[40%]">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "500", pb: 1 }}
                  >
                    Datos de la Reserva
                  </Typography>

                  <div className="flex flex-col gap-2">
                    {selectedReserva?.reserva_items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-row items-center px-[10px] gap-[10px] h-[57.4px] bg-[#F5F5F5] rounded-[4px]"
                      >
                        {item.item_type === "tarifa" ? (
                          <GroupsIcon className="text-[#00000099]" />
                        ) : (
                          <AddCircleOutlineIcon className="text-[#00000099]" />
                        )}
                        <div className="flex-1">
                          <Typography>
                            {item.cantidad} {item.descripcion}
                          </Typography>
                        </div>
                        <Typography variant="body2">
                          ${item.total.toFixed(2)}
                        </Typography>
                      </div>
                    ))}
                    <div className="flex flex-row items-center justify-between font-bold pt-2  px-[10px] ">
                      <Typography variant="body2">Impuestos</Typography>
                      <Typography variant="body2">
                        ${selectedReserva?.pago?.final_fee?.toFixed(2)}
                      </Typography>
                    </div>
                    <div className="flex flex-row items-center justify-between font-bold pt-2  px-[10px] ">
                      <Typography variant="body2">Comisión</Typography>
                      <Typography variant="body2">
                        ${selectedReserva?.pago?.final_tax?.toFixed(2)}
                      </Typography>
                    </div>
                    <div className="flex flex-row items-center justify-between font-bold pt-2  px-[10px] border-t border-[#0000000A]">
                      <Typography>Total</Typography>
                      <Typography variant="h6">
                        ${selectedReserva?.pago?.amount?.toFixed(2)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #E0E0E0" }}>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
          <Button
            onClick={() => {
              handleCloseDialog();
              router.push(`/reservas/${selectedReserva?.id}`);
            }}
            variant="contained"
            sx={{ backgroundColor: "#F47920 !important" }}
          >
            Editar reserva
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
