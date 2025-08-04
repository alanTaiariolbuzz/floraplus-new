"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Alert,
  CircularProgress,
  Button,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";

export default function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | "unknown"
  >("unknown");
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setError("No se encontró el ID de sesión");
      setLoading(false);
      return;
    }

    // Verificar el estado del pago
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/pagos/checkout/session?session_id=${sessionId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            (data as any).message || "Error al verificar el estado del pago"
          );
        }

        const session = data.data;
        setSessionData(session);

        // Determinar el estado del pago

        if (
          session.payment_status === "paid" &&
          (session.status === "complete" || session.status === "succeeded")
        ) {
          setPaymentStatus("success");
        } else if (
          session.payment_status === "unpaid" &&
          session.status === "canceled"
        ) {
          setPaymentStatus("failed");
        } else if (session.status === "processing") {
          setPaymentStatus("pending");
        } else {
          setPaymentStatus("unknown");
        }
      } catch (err: any) {
        const errorMessage = err?.message || "Error desconocido";
        setError(errorMessage);
        setPaymentStatus("failed");
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleRetry = () => {
    // Redirigir de vuelta al formulario de pago
    router.push("/reservation");
  };

  const handleContinue = () => {
    // Redirigir a la página de confirmación o dashboard
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Verificando el estado del pago...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={handleRetry} variant="contained" fullWidth>
          Reintentar pago
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      {paymentStatus === "success" && (
        <>
          <Alert icon={<CheckCircleIcon />} severity="success" sx={{ mb: 3 }}>
            ¡Pago procesado exitosamente!
          </Alert>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Detalles del pago:
          </Typography>
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>ID de sesión:</strong> {sessionData?.id}
            </Typography>
            <Typography variant="body2">
              <strong>Estado:</strong> {sessionData?.payment_status}
            </Typography>
            <Typography variant="body2">
              <strong>Monto:</strong> ${(sessionData?.amount_total || 0) / 100}
            </Typography>
          </Box>
          <Button onClick={handleContinue} variant="contained" fullWidth>
            Continuar
          </Button>
        </>
      )}

      {paymentStatus === "failed" && (
        <>
          <Alert icon={<ErrorIcon />} severity="error" sx={{ mb: 3 }}>
            El pago no pudo ser procesado
          </Alert>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Hubo un problema con el procesamiento de tu pago. Por favor, intenta
            nuevamente.
          </Typography>
          <Button onClick={handleRetry} variant="contained" fullWidth>
            Reintentar pago
          </Button>
        </>
      )}

      {paymentStatus === "pending" && (
        <>
          <Alert icon={<WarningIcon />} severity="warning" sx={{ mb: 3 }}>
            Pago en procesamiento
          </Alert>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Tu pago está siendo procesado. Te notificaremos cuando se complete.
          </Typography>
          <Button onClick={handleContinue} variant="contained" fullWidth>
            Continuar
          </Button>
        </>
      )}

      {paymentStatus === "unknown" && (
        <>
          <Alert icon={<WarningIcon />} severity="warning" sx={{ mb: 3 }}>
            Estado del pago desconocido
          </Alert>
          <Typography variant="body1" sx={{ mb: 3 }}>
            No pudimos determinar el estado de tu pago. Por favor, contacta
            soporte.
          </Typography>
          <Button onClick={handleRetry} variant="contained" fullWidth>
            Reintentar pago
          </Button>
        </>
      )}
    </Box>
  );
}
