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

export function RefundEmailES({
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
    subject: `Reembolso completo procesado para ${actividad}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; color: #333;">
          <h2>Hola ${nombre},</h2>
          <p>Tu reembolso completo por la actividad <strong>${actividad}</strong> ha sido procesado. El monto ha sido devuelto al mismo método de pago que utilizaste.</p>
          <ul>
            <li><strong>Código de reserva:</strong> ${codigoReserva}</li>
            <li><strong>Fecha y hora:</strong> ${fecha}</li>
            <li><strong>Participantes:</strong> ${participantes}</li>
            <li><strong>Precio original:</strong> ${precio}</li>
            <li><strong>Monto reembolsado:</strong> ${montoReembolsado}</li>
          </ul>
          <p>Ten en cuenta que puede tomar algunos días hábiles para que el reembolso se vea reflejado en tu cuenta, según tu banco o proveedor de tarjeta.</p>
          <p>Si tienes alguna duda sobre el reembolso, contáctanos a <strong>${telefonoContacto}</strong> o <strong>${correoContacto}</strong>.</p>
          <p>Gracias por tu comprensión,<br>${nombreComercial}</p>
        </body>
      </html>
    `,
  };
}
