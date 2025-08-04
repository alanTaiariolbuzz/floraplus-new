interface ReminderEmailESProps {
  nombre: string;
  actividad: string;
  tiempo: string;
  codigoReserva: string;
  fecha: string;
  participantes: number;
  puntoEncuentro: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
}

export default function ReminderEmailES({
  nombre,
  actividad,
  tiempo,
  codigoReserva,
  fecha,
  participantes,
  puntoEncuentro,
  telefonoContacto,
  correoContacto,
  nombreComercial,
}: ReminderEmailESProps) {
  return {
    subject: `¡Nos vemos en ${tiempo}! ${actividad} está por comenzar`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4f46e5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>¡Nos vemos pronto!</h1>
          </div>
          <div class="content">
            <p>Hola ${nombre},</p>
            <p>Este es un recordatorio de que tu actividad <strong>${actividad}</strong> se realizará en ${tiempo}.</p>

            <h3>Detalles de tu reserva:</h3>
            <ul>
              <li><strong>Código de reserva:</strong> ${codigoReserva}</li>
              <li><strong>Fecha y hora:</strong> ${fecha}</li>
              <li><strong>Participantes:</strong> ${participantes}</li>
              <li><strong>Punto de encuentro:</strong> ${puntoEncuentro}</li>
            </ul>

            <p>Por favor, llega <strong>15 minutos antes del horario de inicio</strong>.</p>

            <h4>¿Necesitas hacer cambios?</h4>
            <p>Contáctanos al <strong>${telefonoContacto}</strong> o <strong>${correoContacto}</strong>.</p>

            <p>¡Nos vemos pronto!</p>
            <p>${nombreComercial}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${nombreComercial}. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `,
  };
}
