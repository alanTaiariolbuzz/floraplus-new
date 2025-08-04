"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormHelperText,
  Link,
} from "@mui/material";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import useStripeConnect from "@/app/hooks/useStripeConnect";
import { useUser } from "@/context/UserContext";
// /stripe-accounts?agencyId=3
export default function StripeAccountsOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, customUser } = useUser();
  const agencyId = searchParams.get("agencyId");
  const [country, setCountry] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const [exited, setExited] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [loadingAgency, setLoadingAgency] = useState(true);

  // Aquí usás el hook con el connectedAccountId para crear la instancia
  const connectInstance = useStripeConnect(connectedAccountId, {
    appearance: {
      variables: {
        colorPrimary: "#F47920", // usado como base general
        buttonPrimaryColorBackground: "#F47920",
        buttonPrimaryColorText: "#FFFFFF",
        buttonPrimaryColorBorder: "#F47920",
        buttonPrimaryColorBackgroundHover: "#E65100",
        buttonPrimaryColorBorderHover: "#E65100",
      },
    },
    fonts: [
      {
        cssSrc: "https://fonts.googleapis.com/css2?family=Roboto&display=swap",
      },
    ],
  });

  // Función para obtener los datos de la agencia y establecer el país automáticamente
  const fetchAgencyData = async () => {
    if (!agencyId) {
      setError("ID de agencia no encontrado");
      setLoadingAgency(false);
      return;
    }

    try {
      const res = await fetch(`/api/agencias?id=${agencyId}`);
      const data = await res.json();

      if (data.code === 200 && data.data && data.data.length > 0) {
        const agency = data.data[0];
        setCountry(agency.pais); // Establecer automáticamente el país de la agencia
      } else {
        setError("No se pudo obtener la información de la agencia");
      }
    } catch (err) {
      console.error("Error al obtener datos de la agencia:", err);
      setError("Error al obtener la información de la agencia");
    } finally {
      setLoadingAgency(false);
    }
  };

  // Función para verificar el estado de la cuenta y redirigir
  const checkAccountStatusAndRedirect = async (accountId: string) => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/account-session?account=${accountId}`);
      const status = await res.json();

      if (
        status.details_submitted &&
        status.charges_enabled &&
        status.payouts_enabled
      ) {
        // Onboarding exitoso - redirigir al dashboard correspondiente
        // Use customUser.rol_id instead of user.user_metadata.role
        const userRole =
          customUser?.rol_id === 1 ? "SUPER_ADMIN" : user?.user_metadata?.role;

        if (userRole === "SUPER_ADMIN") {
          router.replace("/admin/panel");
        } else {
          router.replace("/dashboard");
        }
      } else {
        // Faltan datos - mostrar mensaje y permitir reintentar
        setError(
          "El onboarding no se completó completamente. Por favor, completa todos los datos requeridos."
        );
        setExited(false);
        setConnectedAccountId(""); // Reset para permitir reintentar
      }
    } catch (err) {
      console.error("Error al verificar estado de cuenta:", err);
      setError(
        "Error al verificar el estado de la cuenta. Por favor, intenta nuevamente."
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchAgencyData();
  }, [agencyId]);

  useEffect(() => {
    if (exited && connectedAccountId) {
      checkAccountStatusAndRedirect(connectedAccountId);
    }
  }, [exited, connectedAccountId]);

  const handleCreate = async () => {
    if (!country) {
      setError("Debes seleccionar un país.");
      return;
    }

    setCreating(true);
    setError(false);

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          agencyId: agencyId,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await res.json();

      if (data.account) {
        setConnectedAccountId(data.account);
      } else if (data.error) {
        setError(
          typeof data.error === "string" ? data.error : "Error desconocido"
        );
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 500,
          bgcolor: "background.paper",
          boxShadow: 3,
          borderRadius: 4,
          p: 4,
        }}
      >
        {loadingAgency ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Cargando información...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estamos obteniendo la información de tu agencia.
            </Typography>
          </Box>
        ) : checkingStatus ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Verificando configuración...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estamos verificando que tu cuenta esté completamente configurada.
            </Typography>
          </Box>
        ) : !connectedAccountId ? (
          <>
            <Typography variant="h6" gutterBottom>
              Configurá tu cuenta para recibir pagos
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                País de la cuenta bancaria:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "grey.300",
                  borderRadius: 1,
                  bgcolor: "grey.50",
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {country === "CR"
                    ? "Costa Rica"
                    : country === "US"
                      ? "Estados Unidos"
                      : country}
                </Typography>
              </Box>
              <FormHelperText
                sx={{ fontSize: 12, color: "text.secondary", mt: 1 }}
              >
                El país de tu cuenta bancaria debe coincidir con la dirección
                fiscal de tu agencia.
              </FormHelperText>
            </Box>

            <Button
              onClick={handleCreate}
              disabled={creating || !country || loadingAgency}
              fullWidth
              variant="contained"
              sx={{
                bgcolor: "#F47920",
                ":hover": { bgcolor: "#d96516" },
              }}
            >
              {creating ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Al hacer click en crear cuenta, aceptas el{" "}
              <Link
                href="https://getfloraplus.com/acuerdo-de-comerciante"
                target="_blank"
              >
                Acuerdo de Comerciante de Flora Plus
              </Link>
              .
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Completá el proceso con Stripe
            </Typography>

            <Box sx={{ mb: 3 }}>
              {connectInstance && (
                <ConnectComponentsProvider connectInstance={connectInstance}>
                  <ConnectAccountOnboarding onExit={() => setExited(true)} />
                </ConnectComponentsProvider>
              )}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#4CAF50"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Tus datos están protegidos por Stripe.
            </Typography>
          </>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}

        {exited && !checkingStatus && !error && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
            El onboarding fue cancelado.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
