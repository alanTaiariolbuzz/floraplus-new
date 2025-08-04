# Arquitectura del Bus de Eventos

Este documento resume la implementación del bus de eventos basado en Postgres.

1. **Recepción de webhooks**
   - Se expone `/api/webhooks/stripe`.
   - Cada endpoint valida la firma del proveedor y almacena el evento en la tabla `eventos`.

2. **Publicación de eventos internos**
   - La función `publicarEvento` se utiliza dentro de las operaciones de negocio para insertar eventos en la misma transacción.

3. **Procesamiento**
   - Los trabajadores en `app/trabajadores` consultan periódicamente los eventos cuyo `procesado_en` está vacío y ejecutan la lógica necesaria de forma desacoplada.

La tabla `eventos` registra de forma mínima el origen, tipo y payload del evento. Incluye un contador de `intentos`, la marca `procesado_en` y la columna `estado` para indicar si el evento está `pendiente`, en proceso, `procesado` o en `error`.

---

## Plan de Integración y Estructura Propuesta

Para escalar el bus de eventos se recomienda una estructura modular que agrupe los tipos y manejadores por contexto.

### Catálogo de eventos

El archivo `src/events/types/eventos.ts` actúa como referencia única de nombres de eventos. Se definen constantes agrupadas por origen, por ejemplo:

```ts
export namespace StripeEvents {
  export const CheckoutSessionCompleted = "checkout.session.completed" as const;
  export const PaymentIntentSucceeded = "payment_intent.succeeded" as const;
}
export namespace ReservaEvents {
  export const ReservaCreada = "reserva.creada" as const;
  export const ReservaCancelada = "reserva.cancelada" as const;
}
export type EventType =
  | typeof StripeEvents[keyof typeof StripeEvents]
  | typeof ReservaEvents[keyof typeof ReservaEvents];
```

### Carpeta de eventos

```
src/events/
  stripe/
    handlers/
      checkoutSessionCompleted.ts
      paymentIntentSucceeded.ts
  reserva/
    handlers/
      reservaCreada.ts
      reservaCancelada.ts
  index.ts
```

Cada evento cuenta con un manejador dedicado. Los suscriptores adicionales se alojan en `subscribers/`.

### Procesamiento

El archivo `app/api/trabajadores/procesar_lote/route.ts` obtiene los eventos pendientes y despacha dinámicamente al manejador registrado en el mapa `eventHandlers` exportado desde `src/events/index.ts`. Se priorizan los eventos de Stripe antes del resto.

### Pasos sugeridos

1. Crear `src/events/types/eventos.ts` con todos los nombres de eventos.
2. Extraer la lógica actual a manejadores individuales en `src/events/.../handlers`.
3. Actualizar `procesar_lote` para utilizar el mapa de manejadores y soportar múltiples suscriptores.
4. Llamar a `publicarEvento` desde los servicios de negocio para registrar los eventos internos.

### Pruebas recomendadas

- Tests unitarios de `publicarEvento`.
- Tests aislados para cada manejador.
- Simulación de varios eventos en la tabla y ejecución del cron para comprobar el cambio de estado y la prioridad de procesamiento.

Esta estructura centraliza la definición de eventos, facilita añadir nuevos orígenes y mantiene el sistema desacoplado y extensible.
