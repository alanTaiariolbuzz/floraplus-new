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

export default function TemporaryUnavailableEN({
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
    subject: `Update about your booking – ${actividad} temporarily unavailable`,
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
          <h1>Update about your booking</h1>
        </div>
        <div class="content">
          <p>Hello ${nombre},</p>
          <p>We’re contacting you regarding your upcoming booking for <strong>${actividad}</strong>.</p>
          <p>Due to force majeure circumstances, this activity will be <strong>temporarily unavailable</strong> during the period of your scheduled visit. This means your reservation for <strong>${fechaActividad}</strong> can no longer be fulfilled as planned.</p>
          <h3>Here are the details of your booking:</h3>
          <ul>
            <li><strong>Booking code:</strong> ${codigoReserva}</li>
            <li><strong>Original start time:</strong> ${fechaActividad}</li>
            <li><strong>Attendees:</strong> ${participantes}</li>
            <li><strong>Total price:</strong> ${precio}</li>
          </ul>
          <p>We’re truly sorry for this unexpected change. We’ll be reaching out to help you reschedule, switch to a different experience, or process a refund if needed.</p>
          <p>If you have any questions in the meantime, please don’t hesitate to contact us at <a href="tel:${telefonoContacto}">${telefonoContacto}</a> or <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
          <p>Thank you for your understanding,</p>
          <p><strong>${nombreComercial}</strong></p>
        </div>
      </body>
      </html>
    `,
  };
}
