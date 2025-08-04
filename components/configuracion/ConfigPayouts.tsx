import { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useUser } from "@/context/UserContext";

interface PayoutSchedule {
  interval: "manual" | "daily" | "weekly" | "monthly";
  delay_days: number;
  weekly_anchor?: string;
  monthly_anchor?: number;
}

interface BankAccount {
  last4: string;
  bank_name: string;
  currency: string;
  country: string;
  routing_number?: string;
}

interface PayoutSettings {
  payout_schedule: PayoutSchedule;
  bank_account: BankAccount | null;
  payouts_enabled: boolean;
  charges_enabled: boolean;
}

interface PayoutInfo {
  balance: {
    available: number;
    pending: number;
    total: number;
    currency: string;
  };
  balances_by_currency: {
    [key: string]: {
      available: number;
      pending: number;
      total: number;
    };
  };
  next_payout: {
    date: string | null;
    estimated_amount: number;
    interval: string;
  };
  last_payout: {
    id: string;
    amount: number;
    status: string;
    created: number;
    arrival_date: number;
  } | null;
}

export const ConfigPayouts = () => {
  const { customUser } = useUser();
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Formulario de configuración
  const [formData, setFormData] = useState({
    interval: "manual" as "manual" | "daily" | "weekly" | "monthly",
    delay_days: 0,
    weekly_anchor: "monday",
    monthly_anchor: 1,
  });

  // Formulario de payout manual
  const [payoutData, setPayoutData] = useState({
    amount: "",
    currency: "usd",
  });
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (customUser?.agencia_id) {
      fetchPayoutSettings();
      fetchPayoutInfo();
    }
  }, [customUser?.agencia_id]);

  const fetchPayoutSettings = async () => {
    if (!customUser?.agencia_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/agencias/${customUser.agencia_id}/payout-settings`
      );
      const data = await response.json();

      if (response.ok) {
        setSettings(data);
        setFormData({
          interval: data.payout_schedule.interval,
          delay_days: data.payout_schedule.delay_days,
          weekly_anchor: data.payout_schedule.weekly_anchor || "monday",
          monthly_anchor: data.payout_schedule.monthly_anchor || 1,
        });
      } else {
        setError(data.error || "Error al cargar la configuración");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutInfo = async () => {
    if (!customUser?.agencia_id) return;

    try {
      const response = await fetch(
        `/api/agencias/${customUser.agencia_id}/payout-info`
      );
      const data = await response.json();

      if (response.ok) {
        setPayoutInfo(data);
      } else {
        console.error("Error al cargar información de payout:", data.error);
      }
    } catch (err) {
      console.error("Error de conexión al cargar información de payout:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100); // Convertir de centavos a dólares
  };

  const handleSaveSettings = async () => {
    if (!customUser?.agencia_id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: any = {
        interval: formData.interval,
        delay_days: formData.delay_days,
      };

      if (formData.interval === "weekly") {
        payload.weekly_anchor = formData.weekly_anchor;
      }

      if (formData.interval === "monthly") {
        payload.monthly_anchor = formData.monthly_anchor;
      }

      const response = await fetch(
        `/api/agencias/${customUser.agencia_id}/payout-settings`,
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
        setSuccess("Configuración actualizada exitosamente");
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                payout_schedule: data.payout_schedule,
              }
            : null
        );
        // Refrescar información de payout después de actualizar configuración
        fetchPayoutInfo();
        setConfirmDialogOpen(false);
      } else {
        setError(data.error || "Error al actualizar la configuración");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleManualPayout = async () => {
    if (!customUser?.agencia_id || !payoutData.amount) return;

    try {
      setPayoutLoading(true);
      setError(null);
      setSuccess(null);

      const amount = Math.round(parseFloat(payoutData.amount) * 100); // Convertir a centavos

      const response = await fetch(
        `/api/agencias/${customUser.agencia_id}/hacer-payout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: payoutData.currency,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Payout realizado exitosamente");
        setPayoutData({ amount: "", currency: "usd" });
        // Refrescar información de payout después de realizar el payout
        fetchPayoutInfo();
      } else {
        setError(data.error || "Error al realizar el payout");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Pagos
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </div>
    );
  }

  if (!customUser?.agencia_id) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Pagos
        </Typography>
        <Alert severity="error">
          No se pudo obtener la información de la agencia
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
      <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
        Pagos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Información de próximo pago y dinero a cobrar */}
      {payoutInfo && (
        <div className="flex flex-row gap-4 mb-4">
          <div className="w-1/2 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
            <div className="flex flex-row gap-2 items-center h-full pl-4">
              <img src="/icons/group-orange.svg" width={38} alt="PaperTick" />
              <div className="flex flex-col ">
                <Typography variant="h6" color="text.primary">
                  {payoutInfo.next_payout.date
                    ? formatDate(payoutInfo.next_payout.date)
                    : "Manual"}
                </Typography>
                <Typography variant="caption" color="text.primary">
                  {payoutInfo.next_payout.interval === "manual"
                    ? "Payout manual"
                    : "Fecha próximo pago"}
                </Typography>
              </div>
            </div>
          </div>
          <div className="w-1/2 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
            <div className="flex flex-row gap-2 items-center h-full pl-4">
              <img
                src="/icons/paper-tick-blue.svg"
                width={38}
                alt="PaperTick"
              />
              <div className="flex flex-col ">
                <Typography variant="h6" color="text.primary">
                  {formatCurrency(payoutInfo.balance.total)}
                </Typography>
                <Typography variant="caption" color="text.primary">
                  Dinero a cobrar
                </Typography>
              </div>
            </div>
          </div>
        </div>
      )}

      {settings && (
        <>
          {/* Información actual */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Configuración Actual
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Intervalo: <strong>{settings.payout_schedule.interval}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Días de retraso:
                <strong>{settings.payout_schedule.delay_days}</strong>
              </Typography>
              {settings.payout_schedule.weekly_anchor && (
                <Typography variant="body2" color="text.secondary">
                  Día de la semana:
                  <strong>{settings.payout_schedule.weekly_anchor}</strong>
                </Typography>
              )}
              {settings.payout_schedule.monthly_anchor && (
                <Typography variant="body2" color="text.secondary">
                  Día del mes:
                  <strong>{settings.payout_schedule.monthly_anchor}</strong>
                </Typography>
              )}
            </Box>

            {settings.bank_account && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Cuenta bancaria:
                  <strong>****{settings.bank_account.last4}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Banco: <strong>{settings.bank_account.bank_name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Moneda:
                  <strong>
                    {settings.bank_account.currency.toUpperCase()}
                  </strong>
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Payouts habilitados:
                <strong>{settings.payouts_enabled ? "Sí" : "No"}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cargos habilitados:
                <strong>{settings.charges_enabled ? "Sí" : "No"}</strong>
              </Typography>
            </Box>
          </Paper>

          {/* Formulario de configuración */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Actualizar Configuración
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Intervalo</InputLabel>
                <Select
                  value={formData.interval}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      interval: e.target.value as
                        | "manual"
                        | "daily"
                        | "weekly"
                        | "monthly",
                    }))
                  }
                  label="Intervalo"
                >
                  <MenuItem value="daily">Diario</MenuItem>
                  <MenuItem value="weekly">Semanal</MenuItem>
                  <MenuItem value="monthly">Mensual</MenuItem>
                </Select>
              </FormControl>

              {/* <TextField
                fullWidth
                label="Días de retraso"
                type="number"
                value={formData.delay_days}
                inputProps={{ min: 5, max: 30 }}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    delay_days: parseInt(e.target.value) || 0,
                  }))
                }
                helperText="Stripe puede tener límites mínimos según tu cuenta (5 días mínimo)"
              /> */}
            </Box>

            {formData.interval === "weekly" && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Día de la semana</InputLabel>
                <Select
                  value={formData.weekly_anchor}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weekly_anchor: e.target.value,
                    }))
                  }
                  label="Día de la semana"
                >
                  <MenuItem value="monday">Lunes</MenuItem>
                  <MenuItem value="tuesday">Martes</MenuItem>
                  <MenuItem value="wednesday">Miércoles</MenuItem>
                  <MenuItem value="thursday">Jueves</MenuItem>
                  <MenuItem value="friday">Viernes</MenuItem>
                  <MenuItem value="saturday">Sábado</MenuItem>
                  <MenuItem value="sunday">Domingo</MenuItem>
                </Select>
              </FormControl>
            )}

            {formData.interval === "monthly" && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Día del mes</InputLabel>
                <Select
                  value={formData.monthly_anchor.toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthly_anchor: parseInt(e.target.value),
                    }))
                  }
                  label="Día del mes"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <MenuItem key={day} value={day.toString()}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button
              variant="contained"
              onClick={handleSaveClick}
              disabled={saving}
              sx={{ bgcolor: "#F47920", "&:hover": { bgcolor: "#d96516" } }}
            >
              {saving ? (
                <CircularProgress size={20} />
              ) : (
                "Guardar Configuración"
              )}
            </Button>
          </Paper>

          {/* Payout manual */}
          {formData.interval === "manual" && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Payout Manual
              </Typography>

              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Monto"
                  type="number"
                  value={payoutData.amount}
                  onChange={(e) =>
                    setPayoutData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0.00"
                />

                <FormControl fullWidth>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={payoutData.currency}
                    onChange={(e) =>
                      setPayoutData((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    label="Moneda"
                  >
                    <MenuItem value="usd">USD</MenuItem>
                    <MenuItem value="eur">EUR</MenuItem>
                    <MenuItem value="crc">CRC</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant="contained"
                onClick={handleManualPayout}
                disabled={payoutLoading || !payoutData.amount}
                sx={{ bgcolor: "#F47920", "&:hover": { bgcolor: "#d96516" } }}
              >
                {payoutLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  "Realizar Payout"
                )}
              </Button>
            </Paper>
          )}
        </>
      )}

      {/* Dialog de confirmación para guardar cambios */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Confirmar Cambios</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas guardar los cambios en la configuración
            de pagos?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción actualizará la configuración de pagos de tu agencia.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={saving}
            sx={{ bgcolor: "#F47920", "&:hover": { bgcolor: "#d96516" } }}
          >
            {saving ? <CircularProgress size={20} /> : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
