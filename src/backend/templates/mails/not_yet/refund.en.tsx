interface RefundEmailProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fecha: string;
  participantes: number;
  precio: string;
  montoReembolsado: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
}

export function RefundEmailEN({
  nombre,
  actividad,
  codigoReserva,
  fecha,
  participantes,
  precio,
  montoReembolsado,
  telefonoContacto,
  correoContacto,
  nombreComercial,
}: RefundEmailProps) {
  return {
    subject: `Your full refund for ${actividad} has been processed`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; color: #333;">
          <h2>Hello ${nombre},</h2>
          <p>We’ve processed a full refund for your booking of <strong>${actividad}</strong>. The amount has been returned to the original payment method.</p>
          <ul>
            <li><strong>Booking code:</strong> ${codigoReserva}</li>
            <li><strong>Date and time:</strong> ${fecha}</li>
            <li><strong>Attendees:</strong> ${participantes}</li>
            <li><strong>Original price:</strong> ${precio}</li>
            <li><strong>Refunded amount:</strong> ${montoReembolsado}</li>
          </ul>
          <p>Please note that depending on your bank or card provider, it may take a few business days for the refund to appear on your statement.</p>
          <p>If you have any questions, feel free to reach out at <strong>${telefonoContacto}</strong> or <strong>${correoContacto}</strong>.</p>
          <p>We hope to welcome you on another occasion.<br>${nombreComercial}</p>
        </body>
      </html>
    `,
  };
}
