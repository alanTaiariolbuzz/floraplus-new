interface UpdateEmailESProps {
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

export default function UpdateEmailES({
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
}: UpdateEmailESProps) {
  return {
    subject: `Tu reserva ha sido actualizada – ${actividad}`,
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
            <h1>Reserva actualizada</h1>
          </div>
          <div class="content">
            <p>Hola ${nombre},</p>
            <p>Hemos realizado los cambios que solicitaste en tu reserva para <strong>${actividad}</strong>.</p>

            <h3>Detalles actualizados:</h3>
            <ul>
              <li><strong>Código de reserva:</strong> ${codigoReserva}</li>
              <li><strong>Fecha y hora:</strong> ${fecha}</li>
              <li><strong>Participantes:</strong> ${participantes}</li>
              <li><strong>Punto de encuentro:</strong> ${puntoEncuentro}</li>
              <li><strong>Precio total:</strong> ${precio}</li>
            </ul>

            <p>¿Tienes dudas o necesitas hacer nuevos cambios?</p>
            <p>Contáctanos a <strong>${telefonoContacto}</strong> o <strong>${correoContacto}</strong>.</p>

            <p>¡Te esperamos pronto!</p>
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
