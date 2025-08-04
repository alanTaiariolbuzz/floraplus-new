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
  puntoEncuentro: string;
}

export default function UpdatedScheduleEN({
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
    subject: `Updated start time for your activity – ${actividad}`,
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
          <h1>Updated Start Time</h1>
        </div>
        <div class="content">
          <p>Hello ${nombre},</p>
          <p>We’d like to inform you that the <strong>start time</strong> for your upcoming activity <strong>${actividad}</strong> has changed.</p>
          <h3>Here are your updated booking details:</h3>
          <ul>
            <li><strong>Booking code:</strong> ${codigoReserva}</li>
            <li><strong>Original start time:</strong> ${fechaOriginal}</li>
            <li><strong>New start time:</strong> ${fechaNueva}</li>
            <li><strong>Attendees:</strong> ${participantes}</li>
            <li><strong>${puntoEncuentro}</strong></li>
            <li><strong>Total price:</strong> ${precio}</li>
          </ul>
          <p>Please make sure to arrive <strong>15 minutes before the new start time</strong>.</p>
          <p>If you have any questions or if this change affects your plans, feel free to contact us at <a href="tel:${telefonoContacto}">${telefonoContacto}</a> or <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
          <p>Thank you for your understanding,</p>
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
