"use client";

import { useState, useEffect } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";

interface AppearanceOptions {
  appearance?: {
    variables?: Record<string, string>;
  };
  fonts?: Array<{ cssSrc: string }>;
}

export default function useStripeConnect(
  accountId: string,
  options?: AppearanceOptions
) {
  const [connectInstance, setConnectInstance] = useState<any>(null);

  useEffect(() => {
    if (!accountId) return;

    const fetchClientSecret = async () => {
      const response = await fetch("/api/account-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: accountId }),
      });

      const data = await response.json();
      if (!data.clientSecret) {
        console.error("No se obtuvo clientSecret de Stripe:", data.error);
        throw new Error(
          "No se obtuvo clientSecret de Stripe: " +
            (data.error || "Unknown error")
        );
      }
      return data.clientSecret as string;
    };

    const initialize = async () => {
      try {
        const instance = await loadConnectAndInitialize({
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          fetchClientSecret,
          ...options, // ← Ahora pasás appearance, fonts, etc.
        });
        setConnectInstance(instance);
      } catch (err) {
        console.error("Error al inicializar Stripe Connect:", err);
      }
    };

    initialize();
  }, [accountId]);

  return connectInstance;
}
