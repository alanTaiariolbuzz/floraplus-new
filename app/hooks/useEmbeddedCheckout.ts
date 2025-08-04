import { useState, useEffect, useCallback } from "react";

interface EmbeddedCheckoutParams {
  agenciaId: number;
  reservaId: number;
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  language?: string;
}

interface CheckoutSession {
  sessionId: string;
  clientSecret: string;
}

interface UseEmbeddedCheckoutReturn {
  clientSecret: string | null;
  loading: boolean;
  error: string | null;
  createSession: () => Promise<void>;
  reset: () => void;
}

export const useEmbeddedCheckout = (
  params: EmbeddedCheckoutParams
): UseEmbeddedCheckoutReturn => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const createSession = useCallback(async () => {
    if (loading || hasAttempted) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pagos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.message || "Error al crear la sesión de pago");
      }

      if (data.data?.clientSecret) {

        setClientSecret(data.data.clientSecret);
        setHasAttempted(true);
      } else {
        throw new Error("No se recibió el client_secret");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("Error creating checkout session:", err);
      setError(errorMessage);
      setHasAttempted(true);
    } finally {
      setLoading(false);
    }
  }, [params, loading, hasAttempted]);

  const reset = useCallback(() => {
    setClientSecret(null);
    setError(null);
    setLoading(false);
    setHasAttempted(false);
  }, []);

  // Crear sesión automáticamente cuando los parámetros cambien
  useEffect(() => {
    if (
      params.agenciaId &&
      params.reservaId &&
      params.amount > 0 &&
      !hasAttempted
    ) {
      createSession();
    }
  }, [
    params.agenciaId,
    params.reservaId,
    params.amount,
    hasAttempted,
    createSession,
  ]);

  return {
    clientSecret,
    loading,
    error,
    createSession,
    reset,
  };
};
