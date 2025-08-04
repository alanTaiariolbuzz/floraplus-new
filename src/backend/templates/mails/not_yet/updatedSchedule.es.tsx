interface UpdatedScheduleProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fechaOriginal: string;
  fechaNueva: string;
  participantes: number;
  precio: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  puntoEncuentro: string; // para el punto de encuentro o pickup
}

export default function UpdatedScheduleES({
  nombre,
  actividad,
  codigoReserva,
  fechaOriginal,
  fechaNueva,
  participantes,
  precio,
  telefonoContacto,
  correoContacto,
  nombreComercial,
  puntoEncuentro,
}: UpdatedScheduleProps) {
  return {
    subject: `Nuevo horario para tu actividad – ${actividad}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nuevo horario para tu actividad</h1>
        </div>
        <div class="content">
          <p>Hola ${nombre},</p>
          <p>Queremos informarte que el <strong>horario de inicio</strong> de tu actividad <strong>${actividad}</strong> ha cambiado.</p>
          <h3>Detalles actualizados:</h3>
          <ul>
            <li><strong>Código de reserva:</strong> ${codigoReserva}</li>
            <li><strong>Horario original:</strong> ${fechaOriginal}</li>
            <li><strong>Nuevo horario:</strong> ${fechaNueva}</li>
            <li><strong>Participantes:</strong> ${participantes}</li>
            <li><strong>${puntoEncuentro}</strong></li>
            <li><strong>Precio total:</strong> ${precio}</li>
          </ul>
          <p>Por favor, llega <strong>15 minutos antes del nuevo horario de inicio.</strong></p>
          <p>Si el cambio afecta tus planes, contáctanos a <a href="tel:${telefonoContacto}">${telefonoContacto}</a> o <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
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
