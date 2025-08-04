export namespace StripeEvents {
  export const CheckoutSessionCompleted = 'checkout.session.completed' as const;
  export const PaymentIntentSucceeded = 'payment_intent.succeeded' as const;
  // Account events
  export const AccountUpdated = 'account.updated' as const;
  export const AccountApplicationAuthorized =
    'account.application.authorized' as const;
  export const AccountApplicationDeauthorized =
    'account.application.deauthorized' as const;
  export const AccountExternalAccountCreated =
    'account.external_account.created' as const;
  export const AccountExternalAccountDeleted =
    'account.external_account.deleted' as const;
  export const AccountExternalAccountUpdated =
    'account.external_account.updated' as const;

  // Checkout events
  export const CheckoutSessionAsyncPaymentFailed =
    'checkout.session.async_payment_failed' as const;
  export const CheckoutSessionAsyncPaymentSucceeded =
    'checkout.session.async_payment_succeeded' as const;
  export const CheckoutSessionExpired = 'checkout.session.expired' as const;

  // Payment Intent events
  export const PaymentIntentAmountCapturableUpdated =
    'payment_intent.amount_capturable_updated' as const;
  export const PaymentIntentCanceled = 'payment_intent.canceled' as const;
  export const PaymentIntentCreated = 'payment_intent.created' as const;
  export const PaymentIntentPartiallyFunded =
    'payment_intent.partially_funded' as const;
  export const PaymentIntentPaymentFailed =
    'payment_intent.payment_failed' as const;
  export const PaymentIntentProcessing = 'payment_intent.processing' as const;
  export const PaymentIntentRequiresAction =
    'payment_intent.requires_action' as const;

  // Payment Method events
  export const PaymentMethodAttached = 'payment_method.attached' as const;
  export const PaymentMethodAutomaticallyUpdated =
    'payment_method.automatically_updated' as const;
  export const PaymentMethodDetached = 'payment_method.detached' as const;
  export const PaymentMethodUpdated = 'payment_method.updated' as const;

  // Person events
  export const PersonCreated = 'person.created' as const;
  export const PersonDeleted = 'person.deleted' as const;
  export const PersonUpdated = 'person.updated' as const;

  // Refund events
  export const RefundCreated = 'refund.created' as const;
  export const RefundFailed = 'refund.failed' as const;
  export const RefundUpdated = 'refund.updated' as const;
}

export namespace ReservaEvents {
  export const ReservaCreada = 'reserva.creada' as const;
  export const ReservaCancelada = 'reserva.cancelada' as const;
  export const ReservaConfirmada = 'reserva.confirmada' as const;
}

export type EventType =
  | typeof StripeEvents[keyof typeof StripeEvents]
  | typeof ReservaEvents[keyof typeof ReservaEvents];
