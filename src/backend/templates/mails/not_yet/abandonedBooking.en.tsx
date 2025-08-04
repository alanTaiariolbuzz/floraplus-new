interface AbandonedBookingProps {
  nombre: string;
  actividad: string;
  codigoDescuento?: string;
  returnToUrl: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  descuentoActivado?: boolean;
}

export default function AbandonedBookingEN({
  nombre,
  actividad,
  codigoDescuento,
  returnToUrl,
  telefonoContacto,
  correoContacto,
  nombreComercial,
  descuentoActivado = false,
}: AbandonedBookingProps) {
  return {
    subject: `Don’t miss out on ${actividad}! Complete your booking now`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
          .header { background-color: #60a5fa; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #93c5fd; border-top: none; border-radius: 0 0 8px 8px; }
          a { color: #2563eb; text-decoration: none; font-weight: bold; }
          .discount { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Don’t miss out on ${actividad}!</h1>
        </div>
        <div class="content">
          <p>Hello ${nombre},</p>
          <p>We noticed you didn’t get a chance to finish your reservation for <strong>${actividad}</strong>.</p>
          ${
            descuentoActivado && codigoDescuento
              ? `<p class="discount">Still thinking it over? Here’s a special discount just for you:<br/>
                 Use code <strong>${codigoDescuento}</strong> at checkout and enjoy a special price if you complete your booking soon!</p>`
              : ''
          }
          <p>It’s not confirmed yet—and spots can fill up quickly—so don’t miss out on this incredible experience!</p>
          <p><a href="${returnToUrl}">Click below to complete your booking now</a></p>
          <p>If you have any questions or need help, feel free to contact us at <a href="tel:${telefonoContacto}">${telefonoContacto}</a> or <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
          <p>We can’t wait to see you soon!</p>
          <p><strong>${nombreComercial}</strong></p>
        </div>
      </body>
      </html>
    `,
  };
}
