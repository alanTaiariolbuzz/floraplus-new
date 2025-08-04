# Stripe Embedded Checkout Implementation

## Overview

Esta implementación utiliza **Checkout Sessions con `ui_mode: 'custom'`** y la librería oficial `@stripe/react-stripe-js` para proporcionar una experiencia de pago embebida sin redirecciones.

## Arquitectura

### Flujo de Pago

1. **Backend**: Crea Checkout Session con `ui_mode: 'custom'`
2. **Frontend**: Recibe `client_secret` y renderiza `Elements` con `PaymentElement`
3. **Usuario**: Completa el pago en la página sin redirecciones
4. **Webhook**: `checkout.session.completed` confirma el pago en el backend
5. **Payout**: Proceso automático distribuye fondos a la agencia

### Componentes Clave

- `createEmbeddedCheckoutSession()` - Crea sesión en backend
- `useEmbeddedCheckout()` - Hook para manejar sesión en frontend
- `PaymentForm` - Componente con `Elements` y `PaymentElement`
- Webhook handler - Procesa `checkout.session.completed`

## Implementación

### 1. Backend - Crear Checkout Session

```typescript
// utils/stripe/checkout.ts
export async function createEmbeddedCheckoutSession(params: {
  agenciaId: number;
  reservaId: number;
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  stripeAccountId?: string;
  fee?: number;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "custom", // ✅ Clave para embedded components
    return_url: `${siteUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: params.currency || "usd",
          product_data: {
            name: "Reserva",
            description: `Reserva #${params.reservaId}`,
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    metadata: {
      agenciaId: params.agenciaId.toString(),
      reservaId: params.reservaId.toString(),
      customerName: params.customerName || "",
      customerEmail: params.customerEmail || "",
      fee: params.fee?.toString() || "0",
      stripeAccountId: params.stripeAccountId || "",
    },
  });

  return {
    sessionId: session.id,
    clientSecret: session.client_secret,
  };
}
```

### 2. Frontend - Hook para Manejar Sesión

```typescript
// app/hooks/useEmbeddedCheckout.ts
export const useEmbeddedCheckout = (params: EmbeddedCheckoutParams) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pagos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear la sesión de pago");
      }

      if (data.data?.clientSecret) {
        setClientSecret(data.data.clientSecret);
      } else {
        throw new Error("No se recibió el client_secret");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [params]);

  return { clientSecret, loading, error, createSession, reset };
};
```

### 3. Frontend - Componente de Pago

```typescript
// app/components/reservation/PaymentForm.tsx
import { Elements, PaymentElement, useCheckout } from "@stripe/react-stripe-js";

const CheckoutForm = ({ onPayment, name, total }) => {
  const checkout = useCheckout();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const confirmResult = await checkout.confirm();

      if (confirmResult.type === 'error') {
        setMessage(confirmResult.error.message);
      } else {
        console.log('Payment confirmed successfully');
        onPayment('payment_confirmed');
      }
    } catch (error) {
      setMessage('Error al procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button disabled={isLoading} type="submit">
        {isLoading ? "Procesando..." : `Pagar $${total.toFixed(2)} USD`}
      </button>
      {message && <div>{message}</div>}
    </form>
  );
};

export const PaymentForm = ({ onPayment, name, total, ...props }) => {
  const { clientSecret, loading, error, createSession, reset } = useEmbeddedCheckout({
    agenciaId: props.agencia_id,
    reservaId: props.reservaId,
    amount: total,
    currency: "usd",
    customerEmail: props.personalData.email,
    customerName: `${props.personalData.nombre} ${props.personalData.apellido}`,
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!clientSecret) return <div>No se pudo inicializar el pago</div>;

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      <CheckoutForm
        onPayment={onPayment}
        name={name}
        total={total}
      />
    </Elements>
  );
};
```

### 4. Backend - Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: NextRequest) {
  // ... verificación de firma ...

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid" && session.status === "complete") {
      if (session.ui_mode === "custom") {
        // Procesar sesión de embedded components
        const payoutResult = await processAutomaticPayout(session.id);

        // Aquí puedes agregar lógica adicional:
        // - Actualizar estado de reserva
        // - Enviar email de confirmación
        // - Notificar a la agencia
      }
    }
  }

  return NextResponse.json({ received: true });
}
```

## Ventajas de esta Implementación

### ✅ Checkout Sessions

- **Gestión completa del ciclo de vida**: Maneja impuestos, descuentos, envíos
- **Seguridad robusta**: Validación server-side de todos los datos
- **Compatibilidad**: Funciona con todos los métodos de pago de Stripe

### ✅ Embedded Components

- **Experiencia sin redirecciones**: Usuario permanece en tu sitio
- **UI personalizable**: Control total sobre el diseño
- **Branding consistente**: Mantiene tu identidad visual

### ✅ Flujo Optimizado

- **Pago inmediato**: Confirmación instantánea
- **Webhook confiable**: Procesamiento automático en backend
- **Payout automático**: Distribución de fondos sin intervención manual

## Configuración Requerida

### Variables de Entorno

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Dependencias

```json
{
  "@stripe/stripe-js": "^2.0.0",
  "@stripe/react-stripe-js": "^2.0.0"
}
```

### Webhook Events

Configurar en Stripe Dashboard:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`
- `checkout.session.async_payment_succeeded`

## Manejo de Errores

### Frontend

- Validación de `client_secret`
- Manejo de errores de confirmación
- Estados de carga y error
- Reintentos automáticos

### Backend

- Verificación de firma de webhook
- Logging detallado
- Manejo de sesiones expiradas
- Procesamiento de payouts fallidos

## Testing

### Modo Desarrollo

```typescript
// Usar tarjetas de prueba de Stripe
const testCards = {
  success: "4242424242424242",
  decline: "4000000000000002",
  requiresAuth: "4000002500003155",
};
```

### Webhook Testing

```bash
# Usar Stripe CLI para testing local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Consideraciones de Producción

1. **Rate Limiting**: Implementar límites en creación de sesiones
2. **Logging**: Logging detallado para debugging
3. **Monitoring**: Monitorear webhooks y payouts
4. **Fallbacks**: Plan de contingencia para fallos de Stripe
5. **Compliance**: Cumplir con regulaciones locales de pagos

## Troubleshooting

### Problemas Comunes

1. **"No client_secret"**: Verificar `ui_mode: "custom"`
2. **Webhook no recibido**: Verificar endpoint y firma
3. **Payout fallido**: Verificar metadata y cuenta conectada
4. **Sesión expirada**: Implementar renovación automática

### Debugging

```typescript
// Habilitar logging detallado
console.log("Session created:", session);
console.log("Webhook received:", event);
console.log("Payout result:", payoutResult);
```

Esta implementación proporciona una experiencia de pago robusta, segura y personalizable que mantiene a los usuarios en tu sitio mientras aprovecha toda la funcionalidad de Checkout Sessions de Stripe.
