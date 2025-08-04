interface TemporaryUnavailableProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fechaActividad: string;
  participantes: number;
  precio: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
}

export default function TemporaryUnavailableES({
  nombre,
  actividad,
  codigoReserva,
  fechaActividad,
  participantes,
  precio,
  telefonoContacto,
  correoContacto,
  nombreComercial,
}: TemporaryUnavailableProps) {
  return {
    subject: `Actualización sobre tu reserva – ${actividad} temporalmente no disponible`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
          .header { background-color: #f87171; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #fca5a5; border-top: none; border-radius: 0 0 8px 8px; }
          a { color: #ef4444; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Actualización sobre tu reserva</h1>
        </div>
        <div class="content">
          <p>Hola ${nombre},</p>
          <p>Te escribimos para informarte que la actividad <strong>${actividad}</strong> estará <strong>temporalmente no disponible</strong> durante la fecha que habías reservado, debido a motivos de fuerza mayor.</p>
          <p>Tu reserva no podrá realizarse según lo planeado.</p>
          <ul>
            <li><strong>Código de reserva:</strong> ${codigoReserva}</li>
            <li><strong>Fecha y hora:</strong> ${fechaActividad}</li>
            <li><strong>Participantes:</strong> ${participantes}</li>
            <li><strong>Precio total:</strong> ${precio}</li>
          </ul>
          <p>Nos pondremos en contacto contigo para reprogramar, ofrecerte otra experiencia o gestionar un reembolso si es necesario.</p>
          <p>Si tienes alguna pregunta, contáctanos a <a href="tel:${telefonoContacto}">${telefonoContacto}</a> o <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
          <p>Gracias por tu comprensión,</p>
          <p><strong>${nombreComercial}</strong></p>
        </div>
      </body>
      </html>
    `,
  };
}
