export const translations = {
  en: {
    // Static content
    reservationDetails: "Reservation Details",
    selectDate: "Select a date",
    selectTime: "Select a time",
    selectPeople: "Select people",
    personalData: "Personal Information",
    chooseTimeRange: "Choose a time range:",
    convenienceFee: "Taxes & Fees",
    howManyPeople: "How many people?",
    minPeopleRequired: "You must select at least 1 person",
    enterYourData: "Enter your information",
    confirmReservation: "Confirm your reservation before the time runs out",
    continue: "Continue",
    back: "Back",
    loading: "Loading reservation...",
    error: "Error: No activity ID provided",
    poweredBy: "Powered by Flora Plus",
    reservationConfirmed: "Your reservation for:",
    reservationConfirmed2: " is confirmed.",
    emailSent: "We have sent the reservation details to your email.",
    emailLabel: "Email:",
    phoneLabel: "Phone:",
    reservationNumber: "Reservation number:",
    stripeDisclaimer:
      "By completing this purchase, you acknowledge that Flora Plus, LLC is the authorized technology provider for this reservation. The charge will appear in your financial report as 'Flora Plus'.",
    total: "Total:",
    termsAndConditionsText: "By clicking Continue, you accept the",
    termsAndConditions: "Terms and Conditions",
    and: "and",
    privacyPolicy: "Privacy Policy",
    ofFloraPlus: "of Flora Plus.",
    // Form labels
    name: "Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    // Validation errors
    nameRequired: "Name is required",
    lastNameRequired: "Last name is required",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email",
    phoneRequired: "Phone is required",
    // Steps
    step1: "Reservation Details",
    step2: "Extras",
    step3: "Personal Information",
    step4: "Payment",
    step5: "Confirmation",
    // Menu page
    ourActivities: "Our Activities",
    reserveNow: "Book Now",
    confirmReservationBeforeTimeRunsOut:
      "Confirm your reservation before the time runs out",
    pleaseCompleteYourPersonalData: "Please complete your personal data first",
    needTransport: "Need transport?",
    addExtras: "Add extras",
    // Payment form
    paymentInformation: "Payment Information",
    paymentMethod: "Payment Method",
    processingPayment: "Processing payment...",
    payAmount: "Pay",
    paymentError: "Error processing payment. Please try again.",
    configuringPayment: "Configuring payment form...",
    preparingReservation:
      "We are preparing everything so you can complete your reservation securely.",
    paymentSetupError: "Error setting up payment",
    retrySetup: "Retry setup",
    paymentFormError: "Could not initialize payment form",
    contactSupport:
      "Please try again or contact support if the problem persists.",
    paymentDataProtected:
      "Your payment data is protected by 256-bit SSL encryption",
  },
  es: {
    // Static content
    reservationDetails: "Detalles de reserva",
    selectDate: "Selecciona una fecha",
    selectTime: "Selecciona un horario",
    selectPeople: "Selecciona personas",
    personalData: "Datos personales",
    convenienceFee: "Impuestos y comisiones",
    chooseTimeRange: "Elige un rango de horario:",
    howManyPeople: "¿Cuántas personas?",
    minPeopleRequired: "Debes seleccionar al menos 1 persona",
    enterYourData: "Ingresa tus datos",
    confirmReservation: "Confirma tu reserva antes de que se agote el tiempo",
    continue: "Continuar",
    back: "Volver",
    loading: "Cargando reserva...",
    error: "Error: No se proporcionó un ID de actividad",
    poweredBy: "Powered by Flora Plus",
    reservationConfirmed: "Tu reserva para:",
    reservationConfirmed2: " está confirmada.",
    emailSent:
      "Te hemos enviado los detalles de la reserva por correo electrónico.",
    emailLabel: "Email:",
    phoneLabel: "Teléfono:",
    reservationNumber: "Número de reserva:",
    total: "Total:",
    stripeDisclaimer:
      "Al completar esta compra, reconoce que Flora Plus, LLC es el proveedor de tecnología autorizado para esta reserva. El cargo aparecerá en su reporte financiero como 'Flora Plus'.",
    termsAndConditionsText: "Al hacer clic en Continuar, acepta los",
    termsAndConditions: "Términos y Condiciones",
    and: "y la",
    privacyPolicy: "Política de Privacidad",
    ofFloraPlus: "de Flora Plus.",
    // Form labels
    name: "Nombre",
    lastName: "Apellido",
    email: "Email",
    phone: "Teléfono",
    // Validation errors
    nameRequired: "El nombre es requerido",
    lastNameRequired: "El apellido es requerido",
    emailRequired: "El email es requerido",
    emailInvalid: "Por favor ingresa un email válido",
    phoneRequired: "El teléfono es requerido",
    // Steps
    step1: "Detalles de reserva",
    step2: "Extras",
    step3: "Datos personales",
    step4: "Pago",
    step5: "Confirmation",
    // Menu page
    ourActivities: "Nuestras actividades",
    reserveNow: "Reservar ahora",
    confirmReservationBeforeTimeRunsOut:
      "Confirma tu reserva antes de que se agote el tiempo",
    pleaseCompleteYourPersonalData:
      "Por favor, completa tus datos personales primero",
    needTransport: "¿Necesitás ride a la actividad?",
    addExtras: "Agrega adicionales",
    // Payment form
    paymentInformation: "Información del pago",
    paymentMethod: "Método de pago",
    processingPayment: "Procesando pago...",
    payAmount: "Pagar",
    paymentError: "Error al procesar el pago. Por favor, intenta nuevamente.",
    configuringPayment: "Configurando el formulario de pago...",
    preparingReservation:
      "Estamos preparando todo para que puedas completar tu reserva de forma segura.",
    paymentSetupError: "Error al configurar el pago",
    retrySetup: "Reintentar configuración",
    paymentFormError: "No se pudo inicializar el formulario de pago",
    contactSupport:
      "Por favor, intenta nuevamente o contacta soporte si el problema persiste.",
    paymentDataProtected:
      "Tus datos de pago están protegidos por encriptación SSL de 256 bits",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
