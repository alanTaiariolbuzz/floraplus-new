"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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

// Status Chip Component
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

  // Debug: log the status values

  const config = STATUS_CONFIG[normalizedKey as keyof typeof STATUS_CONFIG] || {
    label: status || "Sin estado",
    color: "#757575",
    backgroundColor: "#F5F5F5",
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
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
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: config.backgroundColor,
          borderRadius: "4px",
          border: `1px solid ${config.color}`,
          width: "160px",
          height: "40px",
          cursor: "pointer",
          overflow: "hidden",
          "&:hover": {
            opacity: 0.9,
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
          }}
        >
          {config.label}
        </Typography>
        <Box
          sx={{
            borderLeft: `1px solid ${config.color}`,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            flexShrink: 0,
          }}
        >
          <KeyboardArrowDownIcon
            sx={{
              color: config.color,
              fontSize: "20px",
            }}
          />
        </Box>
      </Box>
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
        {UNIQUE_STATUS_OPTIONS.map((option) => {
          const statusConfig =
            STATUS_CONFIG[option.key as keyof typeof STATUS_CONFIG];
          return (
            <MenuItem
              key={option.key}
              onClick={() => handleStatusSelect(option.key)}
              sx={{
                minWidth: "140px",
                color: statusConfig.color,
                "&:hover": {
                  backgroundColor: statusConfig.backgroundColor,
                },
              }}
            >
              {normalizedKey === option.key && (
                <ListItemIcon>
                  <CheckIcon sx={{ color: statusConfig.color }} />
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

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
}

interface Refund {
  id: number;
  stripe_refund_id: string;
  amount: number;
  amount_formatted: string;
  status: string;
  created_at: string;
  created_at_formatted: string;
  updated_at: string | null;
  updated_at_formatted: string | null;
  processed_by: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
  };
}

export default function ReservaDetalle() {
  const params = useParams();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState<string>("full");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [processingRefund, setProcessingRefund] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string>("");
  const [processingStatusChange, setProcessingStatusChange] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [bounceCopyIcon, setBounceCopyIcon] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!reserva?.id) return;

    // Si es cancelación, mostrar diálogo de confirmación
    if (newStatus === "cancelled") {
      setPendingStatusChange(newStatus);
      setStatusChangeDialogOpen(true);
      return;
    }

    // Para otros estados, cambiar directamente
    await updateReservationStatus(newStatus);
  };

  const updateReservationStatus = async (newStatus: string) => {
    if (!reserva?.id) return;

    setProcessingStatusChange(true);
    try {
      const response = await fetch(
        `${siteUrl}/api/reservas/${reserva.id}/status`,
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
        setReserva({
          ...reserva,
          estado: newStatus,
        });

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
    } finally {
      setProcessingStatusChange(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (pendingStatusChange) {
      await updateReservationStatus(pendingStatusChange);
      setStatusChangeDialogOpen(false);
      setPendingStatusChange("");
    }
  };

  const fetchRefunds = async () => {
    if (!reserva?.id) return;

    setRefundsLoading(true);
    try {
      const response = await fetch(
        `${siteUrl}/api/reservas/${reserva.id}/refunds`
      );
      if (response.ok) {
        const data = await response.json();
        setRefunds(data.data.refunds || []);
      }
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setRefundsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!reserva?.id) return;

    setProcessingRefund(true);
    try {
      const payload: any = {
        reason: refundReason || "Cancelación de reserva",
      };

      if (refundType === "partial" && refundAmount) {
        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0 || amount > reserva.monto_total) {
          setSnackbar({
            open: true,
            message: "Monto inválido para reembolso parcial",
            severity: "error",
          });
          return;
        }
        payload.refundAmount = Math.round(amount * 100);
      }

      const response = await fetch(
        `${siteUrl}/api/reservas/${reserva.id}/cancelar-con-reembolso`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Reembolso procesado exitosamente",
          severity: "success",
        });
        setRefundDialogOpen(false);
        setReserva({
          ...reserva,
          estado: "refunded",
        });
        await fetchRefunds();
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Error al procesar reembolso",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al procesar reembolso",
        severity: "error",
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const canRefund = () => {
    return (
      reserva &&
      reserva.estado !== "cancelled" &&
      reserva.estado !== "expired" &&
      reserva.estado !== "refunded" &&
      reserva.monto_total > 0
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${siteUrl}/api/reservas?id=${params.id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data) {
          console.error("No data received from API");
          throw new Error("No data received from API");
        }

        setReserva(data.data);

        // Fetch actividad data (incluyendo soft deleted para mostrar en reservas)
        if (data.data.actividad_id) {
          const actividadResponse = await fetch(
            `${siteUrl}/api/actividades?id=${data.data.actividad_id}&include_deleted=true`
          );
          if (actividadResponse.ok) {
            const actividadData = await actividadResponse.json();
            setActividad(actividadData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching reservation:", error);
        setError("Error al cargar los datos de la reserva");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (reserva?.id) {
      fetchRefunds();
    }
  }, [reserva?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert severity="error">
          <Typography variant="h6">{error}</Typography>
        </Alert>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert severity="warning">
          <Typography variant="h6">No se encontró la reserva</Typography>
        </Alert>
      </div>
    );
  }

  const formatearMonto = (monto: number | undefined | null) => {
    if (monto === undefined || monto === null) return "$0.00";
    return `$${monto.toFixed(2)}`;
  };

  return (
    <div className="bg-[#FAFAFA] px-12">
      <div className="flex flex-col  bg-[#FAFAFA] py-[20px]">
        <Typography
          variant="h4"
          className="pb-[10px]"
          sx={{ fontWeight: "500" }}
        >
          Detalle de la reserva
        </Typography>
      </div>
      <div>
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
                    {reserva?.turno?.fecha
                      ? new Intl.DateTimeFormat("es-ES", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                          .format(new Date(reserva.turno.fecha))
                          .replace(/^\w/, (c) => c.toUpperCase())
                      : "Sin fecha"}{" "}
                    -{" "}
                    {reserva?.turno?.hora_inicio
                      ? new Intl.DateTimeFormat("es-ES", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        })
                          .format(
                            new Date(
                              `2000-01-01T${reserva.turno.hora_inicio.split("+")[0]}`
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
                    {reserva?.reserva_items?.map((item, index) => (
                      <span key={index}>
                        {item.cantidad} {item.descripcion}
                        {index < (reserva?.reserva_items?.length || 0) - 1
                          ? " - "
                          : ""}
                      </span>
                    ))}
                  </span>
                </Typography>
                <Typography className="body-1">
                  <span className="text-[#00000099]">Subtotal: </span>
                  <span className="font-medium">
                    {formatearMonto(reserva?.pago?.amount)}
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
                    status={reserva?.estado || ""}
                    onStatusChange={handleStatusChange}
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-[#666666] pb-2">
                    Nro de la reserva
                  </p>
                  <div className="flex items-center gap-2">
                    <Typography variant="h5" className="pb-1">
                      {reserva?.codigo_reserva}
                    </Typography>
                    {reserva?.codigo_reserva && (
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
                              reserva.codigo_reserva
                            );
                            setBounceCopyIcon(true);
                            setTimeout(() => setBounceCopyIcon(false), 1500);
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
                  {reserva?.created_at
                    ? new Date(reserva.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "Sin fecha"}
                </Typography>
              </div>

              {canRefund() && (
                <div className="mt-4">
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<MonetizationOnIcon />}
                    onClick={() => setRefundDialogOpen(true)}
                    fullWidth
                  >
                    Crear Reembolso
                  </Button>
                </div>
              )}
            </div>
          </div>
          {refunds.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <HistoryIcon color="primary" />
                <Typography variant="h6">Historial de Reembolsos</Typography>
              </div>
              <List>
                {refunds.map((refund) => (
                  <ListItem key={refund.id} divider>
                    <ListItemText
                      primary={
                        <div className="flex justify-between items-center">
                          <Typography variant="h6" color="primary">
                            {refund.amount_formatted}
                          </Typography>
                        </div>
                      }
                      secondary={
                        <div>
                          <Typography variant="body2" color="textSecondary">
                            Procesado el {refund.created_at_formatted}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Autorizado por: {refund.processed_by.nombre}{" "}
                            {refund.processed_by.apellido}
                          </Typography>
                        </div>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </div>
          )}
          <div className="flex flex-row gap-4 mt-4 border-t   py-4">
            <div className="w-[60%]">
              <Typography variant="subtitle1" sx={{ fontWeight: "500", pb: 1 }}>
                Datos personales
              </Typography>
              <Typography variant="caption">Nombre:</Typography>
              <Typography variant="h6" className="pb-[2px]">
                {reserva?.cliente?.nombre} {reserva?.cliente?.apellido}
              </Typography>
              <Typography variant="caption">Email:</Typography>
              <Typography variant="h6" className="pb-[2px]">
                {reserva?.cliente?.email}
              </Typography>
              <Typography variant="caption">Teléfono:</Typography>
              <Typography variant="h6" className="pb-[2px]">
                {reserva?.cliente?.telefono}
              </Typography>
            </div>

            <div className="w-[40%]">
              <Typography variant="subtitle1" sx={{ fontWeight: "500", pb: 1 }}>
                Datos de la Reserva
              </Typography>

              <div className="flex flex-col gap-2">
                {reserva?.reserva_items?.map((item, index) => (
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
                    ${reserva?.pago?.final_fee?.toFixed(2)}
                  </Typography>
                </div>
                <div className="flex flex-row items-center justify-between font-bold pt-2  px-[10px] ">
                  <Typography variant="body2">Comisión</Typography>
                  <Typography variant="body2">
                    ${reserva?.pago?.final_tax?.toFixed(2)}
                  </Typography>
                </div>
                <div className="flex flex-row items-center justify-between font-bold pt-2  px-[10px] border-t border-[#0000000A]">
                  <Typography>Total</Typography>
                  <Typography variant="h6">
                    ${reserva?.pago?.amount?.toFixed(2)}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <Typography variant="h6">Cancelar con Reembolso</Typography>
            <IconButton onClick={() => setRefundDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <Typography variant="body2" color="textSecondary">
              Reserva: {reserva?.codigo_reserva} - ${reserva?.pago?.amount}
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Tipo de Reembolso</InputLabel>
              <Select
                value={refundType}
                label="Tipo de Reembolso"
                onChange={(e: SelectChangeEvent) =>
                  setRefundType(e.target.value)
                }
              >
                <MenuItem value="full">Reembolso Completo</MenuItem>
                <MenuItem value="partial">Reembolso Parcial</MenuItem>
              </Select>
            </FormControl>

            {refundType === "partial" && (
              <TextField
                fullWidth
                label="Monto a Reembolsar ($)"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                inputProps={{
                  min: 0,
                  max: reserva?.monto_total,
                  step: 0.01,
                }}
                helperText={`Monto máximo: $${reserva?.pago?.amount?.toFixed(2)}`}
              />
            )}

            <TextField
              fullWidth
              label="Motivo del Reembolso (Opcional)"
              multiline
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Especifique el motivo del reembolso..."
            />

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Importante:</strong> Esta acción cancelará la reserva y
                procesará el reembolso. El cliente recibirá una notificación por
                email.
              </Typography>
            </Alert>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleRefund}
            variant="contained"
            color="error"
            disabled={processingRefund}
            startIcon={
              processingRefund ? (
                <CircularProgress size={20} />
              ) : (
                <MonetizationOnIcon />
              )
            }
          >
            {processingRefund ? "Procesando..." : "Confirmar Reembolso"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statusChangeDialogOpen}
        onClose={() => setStatusChangeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <Typography variant="h6">Confirmar Cancelación</Typography>
            <IconButton onClick={() => setStatusChangeDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <Typography variant="body2" color="textSecondary">
              Reserva {reserva?.id} - {actividad?.titulo}
            </Typography>

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>¿Está seguro que desea cancelar esta reserva?</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Esta acción cambiará el estado de la reserva a "Cancelado". Esta
                es una cancelación sin reembolso. Si necesita procesar un
                reembolso, utilice la opción "Cancelar con Reembolso".
              </Typography>
            </Alert>

            <Typography variant="body2" color="textSecondary">
              Cliente: {reserva?.cliente?.nombre} {reserva?.cliente?.apellido}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Fecha del tour:{" "}
              {reserva?.turno?.fecha &&
                new Date(reserva.turno.fecha).toLocaleDateString("es-ES")}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monto total: ${reserva?.pago?.amount?.toFixed(2)}
            </Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmStatusChange}
            variant="contained"
            color="error"
            disabled={processingStatusChange}
            startIcon={
              processingStatusChange ? (
                <CircularProgress size={20} />
              ) : (
                <CloseIcon />
              )
            }
          >
            {processingStatusChange ? "Procesando..." : "Confirmar Cancelación"}
          </Button>
        </DialogActions>
      </Dialog>

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
    </div>
  );
}
