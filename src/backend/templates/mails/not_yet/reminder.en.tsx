interface ReminderEmailENProps {
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

export default function ReminderEmailEN({
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
}: ReminderEmailENProps) {
  return {
    subject: `See you in ${tiempo} – ${actividad} is coming up!`,
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
            <h1>See you soon!</h1>
          </div>
          <div class="content">
            <p>Hello ${nombre},</p>
            <p>Just a quick reminder that your activity <strong>${actividad}</strong> is happening in ${tiempo}. We're looking forward to having you!</p>

            <h3>Your booking summary:</h3>
            <ul>
              <li><strong>Booking code:</strong> ${codigoReserva}</li>
              <li><strong>Date and time:</strong> ${fecha}</li>
              <li><strong>Attendees:</strong> ${participantes}</li>
              <li><strong>Meeting point:</strong> ${puntoEncuentro}</li>
            </ul>

            <p>Please make sure to arrive <strong>15 minutes before the start time</strong>.</p>

            <h4>Need to make changes?</h4>
            <p>If you need to cancel or reschedule for any reason, you can contact us at <strong>${telefonoContacto}</strong> or <strong>${correoContacto}</strong>. If you have any questions, we're here to help.</p>

            <p>See you soon!</p>
            <p><strong>${nombreComercial}</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${nombreComercial}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  };
}
