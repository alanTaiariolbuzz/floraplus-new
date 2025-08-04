// PaymentForm.tsx
"use client";

import { useState } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Paper,
} from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import { loadStripe } from "@stripe/stripe-js";

import {
  CheckoutProvider,
  Elements,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js";
import { useEmbeddedCheckout } from "../../hooks/useEmbeddedCheckout";

// Inicializar Stripe con tu publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface PersonalData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface PaymentFormProps {
  onPayment: (paymentMethodId: string) => void;
  name: string;
  total: number;
  subtotal: number;
  agencia_id: number;
  personalData: PersonalData;
  reservaId: number;
  language?: string;
}

// Componente interno que maneja el formulario de pago
const CheckoutForm = ({
  onPayment,
  name,
  total,
  language,
}: {
  onPayment: (paymentMethodId: string) => void;
  name: string;
  total: number;
  language: string;
}) => {
  const { t } = useTranslation(language as any);
  const checkout = useCheckout();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      const confirmResult = await checkout.confirm({
        redirect: "if_required",
      });

      // Este punto solo se alcanza si hay un error inmediato al confirmar el pago
      // De lo contrario, el cliente será redirigido a tu `return_url`
      if (confirmResult.type === "error") {
        setMessage(confirmResult.error.message);
      } else {
        // El pago se procesó correctamente

        onPayment("payment_confirmed");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      setMessage(t("paymentError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("paymentInformation")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body1">{name}</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            ${total.toFixed(2)} USD
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("paymentMethod")}
        </Typography>
        <PaymentElement
          id="payment-element"
          options={{
            paymentMethodOrder: ["card"],
            layout: "tabs",
          }}
        />
      </Box>

      <Button
        type="submit"
        disabled={isLoading}
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        sx={{ mb: 2 }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} color="inherit" />
            {t("processingPayment")}
          </Box>
        ) : (
          `${t("payAmount")} $${total.toFixed(2)} USD`
        )}
      </Button>

      {/* Mostrar mensajes de error o éxito */}
      {message && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </form>
  );
};

export const PaymentForm = ({
  onPayment,
  name,
  total,
  subtotal,
  agencia_id,
  personalData,
  reservaId,
  language,
}: PaymentFormProps) => {
  const { t } = useTranslation(language as any);

  // Usar el hook personalizado para manejar el checkout embebido
  const { clientSecret, loading, error, createSession, reset } =
    useEmbeddedCheckout({
      agenciaId: agencia_id,
      reservaId: reservaId,
      amount: subtotal,
      currency: "usd",
      customerEmail: personalData.email,
      customerName: `${personalData.nombre} ${personalData.apellido}`,
      language: language,
    });

  // Reintentar el pago
  const handleRetry = () => {
    reset();
    createSession();
  };

  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {t("configuringPayment")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("preparingReservation")}
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("paymentSetupError")}
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button
          onClick={handleRetry}
          variant="contained"
          color="primary"
          fullWidth
          size="large"
        >
          {t("retrySetup")}
        </Button>
      </Paper>
    );
  }

  if (!clientSecret) {
    return (
      <Paper elevation={1} sx={{ p: 4 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            {t("paymentFormError")}
          </Typography>
          <Typography variant="body2">{t("contactSupport")}</Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <CheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret: () => Promise.resolve(clientSecret),
          elementsOptions: {
            appearance: {
              variables: {
                colorPrimary: "#F47920",
                colorBackground: "#ffffff",
                colorText: "#30313d",
                colorDanger: "#df1b41",
                fontFamily: "Roboto, system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "8px",
              },
            },
          },
        }}
      >
        <CheckoutForm
          onPayment={onPayment}
          name={name}
          total={total}
          language={language || "es"}
        />
      </CheckoutProvider>

      {/* Footer con información de seguridad */}
      <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "left",
            mb: 2,
          }}
        >
          <img
            src="/frame-credits.svg"
            alt="stripe"
            style={{ height: "62px" }}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="left"
          display="block"
        >
          {t("stripeDisclaimer")}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="left"
          display="block"
          sx={{ mt: 1 }}
        >
          {t("paymentDataProtected")}
        </Typography>
      </Box>
    </Paper>
  );
};
