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

export default function AbandonedBookingES({
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
    subject: `¡No dejes pasar ${actividad}! Completa tu reserva`,
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
          <h1>¡No dejes pasar ${actividad}!</h1>
        </div>
        <div class="content">
          <p>Hola ${nombre},</p>
          <p>Vimos que comenzaste a reservar <strong>${actividad}</strong>, pero no llegaste a finalizar el proceso.</p>
          ${
            descuentoActivado && codigoDescuento
              ? `<p class="discount">¡Aprovecha un descuento especial para terminar tu compra!<br/>
                 Usa el código <strong>${codigoDescuento}</strong> al finalizar tu reserva y obtén un precio especial.</p>`
              : ''
          }
          <p>Tu cupo aún está disponible, pero los espacios pueden agotarse rápido.</p>
          <p><a href="${returnToUrl}">Haz clic aquí para completar tu reserva</a></p>
          <p>Si necesitas ayuda, contáctanos a <a href="tel:${telefonoContacto}">${telefonoContacto}</a> o <a href="mailto:${correoContacto}">${correoContacto}</a>.</p>
          <p>¡Esperamos verte pronto!</p>
          <p><strong>${nombreComercial}</strong></p>
        </div>
      </body>
      </html>
    `,
  };
}
