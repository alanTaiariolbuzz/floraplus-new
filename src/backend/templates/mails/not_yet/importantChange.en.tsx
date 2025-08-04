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

export default function ImportantChangeEN({
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
    subject: `Important update about your activity – ${actividad}`,
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
          <h1>Important update about your activity</h1>
        </div>
        <div class="content">
          <p>Hello ${nombre},</p>
          <p>We’re reaching out regarding your upcoming booking for <strong>${actividad}</strong>.</p>
          <p>The time slot you booked (<strong>${fechaActividad}</strong>) is no longer available due to force majeure circumstances. We're truly sorry for the inconvenience this may cause.</p>
          <h3>Here are the details of your booking:</h3>
          <ul>
            <li><strong>Booking code:</strong> ${codigoReserva}</li>
            <li><strong>Original start time:</strong> ${fechaActividad}</li>
            <li><strong>Attendees:</strong> ${participantes}</li>
            <li><strong>Total price:</strong> ${precio}</li>
          </ul>
          <p>We’ll be contacting you shortly to help you reschedule or find the best possible alternative.</p>
          <p>If you have any questions in the meantime, feel free to reach out at <a href="tel:${telefonoContacto}">${telefonoContacto}</a> or <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
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
