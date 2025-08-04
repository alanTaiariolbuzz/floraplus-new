interface ImportantChangeProps {
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

export default function ImportantChangeES({
  nombre,
  actividad,
  codigoReserva,
  fechaActividad,
  participantes,
  precio,
  telefonoContacto,
  correoContacto,
  nombreComercial,
}: ImportantChangeProps) {
  return {
    subject: `Cambio importante en tu actividad – ${actividad}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #fca5a5; border-top: none; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Cambio importante en tu actividad</h1>
        </div>
        <div class="content">
          <p>Hola ${nombre},</p>
          <p>El horario que habías reservado para <strong>${actividad}</strong> (<strong>${fechaActividad}</strong>) ya no está disponible debido a motivos de fuerza mayor.</p>
          <h3>Detalles de tu reserva:</h3>
          <ul>
            <li><strong>Código de reserva:</strong> ${codigoReserva}</li>
            <li><strong>Horario original:</strong> ${fechaActividad}</li>
            <li><strong>Participantes:</strong> ${participantes}</li>
            <li><strong>Precio total:</strong> ${precio}</li>
          </ul>
          <p>Nos pondremos en contacto contigo muy pronto para ayudarte a reprogramar o encontrar la mejor alternativa.</p>
          <p>Si tienes alguna pregunta, contáctanos a <a href="tel:${telefonoContacto}">${telefonoContacto}</a> o <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
          <p>Gracias por tu comprensión,</p>
          <p><strong>${nombreComercial}</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${nombreComercial}. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `,
  };
}
