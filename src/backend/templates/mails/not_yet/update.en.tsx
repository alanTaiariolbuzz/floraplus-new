interface UpdateEmailENProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fecha: string;
  participantes: number;
  puntoEncuentro: string;
  precio: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
}

export default function UpdateEmailEN({
  nombre,
  actividad,
  codigoReserva,
  fecha,
  participantes,
  puntoEncuentro,
  precio,
  telefonoContacto,
  correoContacto,
  nombreComercial,
}: UpdateEmailENProps) {
  return {
    subject: `Your booking has been updated – ${actividad}`,
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
              background-color: #f59e0b;
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
            <h1>Booking updated</h1>
          </div>
          <div class="content">
            <p>Hello ${nombre},</p>
            <p>We've made the changes you requested to your booking for <strong>${actividad}</strong>.</p>

            <h3>Updated reservation details:</h3>
            <ul>
              <li><strong>Booking code:</strong> ${codigoReserva}</li>
              <li><strong>Date and time:</strong> ${fecha}</li>
              <li><strong>Total attendees:</strong> ${participantes}</li>
              <li><strong>Meeting point:</strong> ${puntoEncuentro}</li>
              <li><strong>Price:</strong> ${precio}</li>
            </ul>

            <p>If you have any questions or need further changes, feel free to contact us at <strong>${telefonoContacto}</strong> or <strong>${correoContacto}</strong>.</p>

            <p>We look forward to seeing you soon!</p>
            <p>${nombreComercial}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${nombreComercial}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  };
}
