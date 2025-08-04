interface RefundEmailProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fecha: string; // fecha del reembolso
  participantes: number;
  precio: string;
  montoReembolsado: string;
  tipoReembolso: "Parcial" | "Completo";
  motivo: string;
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  logoUrl?: string;
}

function RefundEmailES({
  nombre,
  actividad,
  codigoReserva,
  fecha,
  participantes,
  precio,
  montoReembolsado,
  tipoReembolso,
  motivo,
  telefonoContacto,
  correoContacto,
  nombreComercial,
  logoUrl,
}: RefundEmailProps) {
  return {
    subject: `Reembolso ${tipoReembolso.toLowerCase()} procesado para ${actividad}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reembolso - ${nombreComercial}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');

            body {
              font-family: "Roboto", Arial, sans-serif;
              max-width: 700px;
              margin: 0 auto;
              padding: 20px;
              color: #212121;
              background: #fff;
            }

            h1 {
              color: #2c3e50;
              font-weight: 500;
              font-size: 24px;
              margin-bottom: 20px;
            }

            .greeting {
              font-size: 20px;
              font-weight: 400;
              margin-bottom: 10px;
              margin-top: 30px;
            }

            .confirmation-message {
              font-weight: 500;
              font-size: 34px;
              margin-bottom: 25px;
            }

            .section {
              background-color: white;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 14px;
            }

            .section-title {
              font-weight: bold;
              margin-bottom: 10px;
            }

            .item-titles {
              font-weight: 500;
              color: #616161;
              font-size: 20px;
              letter-spacing: 0.15px;
              margin-bottom: 10px;
            }

            .item {
              text-align: left;
              vertical-align: middle;
              margin-bottom: 8px;
              margin-left: 12px;
              font-size: 20px;
              color: #212121;
            }

            .checkbox {
              margin-right: 10px;
            }

            .total-price {
              font-weight: bold;
              font-size: 18px;
            }

            .contact-info {
              padding-top: 30px;
              padding-left: 80px;
              padding-right: 80px;
              background-color: white;
              border-radius: 10px;
              padding-bottom: 20px;
            }

            .email-cont2 {
              padding: 40px 60px;
            }

            .divider {
              border-top: 1px solid #ddd;
              margin: 20px 0;
            }

            .email-container {
              background-color: #f5f5f5;
              border-radius: 10px;
              border: solid #eeeeee 1px;
              max-width: 700px;
              margin: 0 auto;
            }

            @media (max-width: 620px) {
              body {
                font-size: 80%;
              }

              h1 {
                font-size: 19.2px;
              }

              .greeting {
                font-size: 16px;
              }

              .confirmation-message {
                font-size: 27.2px;
              }

              .item-titles,
              .item {
                font-size: 16px;
              }

              .total-price {
                font-size: 14.4px;
              }

              .contact-info {
                padding-left: 20px;
                padding-right: 20px;
              }

              .email-cont2 {
                padding: 30px 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-cont2">
              <div
                style="
                  text-align: center;
                  background-color: #f57c00;
                  padding: 16px;
                  border-radius: 10px;
                  color: white;
                "
              >
                <table style="width: 100%; text-align: center;">
                  <tr>
                    <td style="text-align: center; vertical-align: middle;">
                      ${
                        logoUrl
                          ? `
                        <img
                          src="${logoUrl}"
                          alt="${nombreComercial}"
                          style="max-width: 57px; border-radius: 999px; margin-right: 18px; display: inline-block; vertical-align: middle;"
                        />
                      `
                          : ""
                      }
                      <h1 style="color: white; text-align: center; font-size: 24px; display: inline-block; vertical-align: middle; margin: 0;">
                        ${nombreComercial}
                      </h1>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="greeting">Hola ${nombre},</div>

              <div class="confirmation-message">
                Hemos procesado tu reembolso ${tipoReembolso.toLowerCase()}
              </div>

              <div class="item-titles">
                Código de reserva:
                <span style="color: #212121; font-weight: 400; margin-left: 5px">
                  ${codigoReserva}
                </span>
              </div>

              <div class="section" style="margin-top: 24px">
                <div class="item-titles">Tipo de reembolso</div>
                <div class="item">
                  ${tipoReembolso}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Monto reembolsado</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/bill.png" alt="Monto reembolsado" style="width: 15px; height: 16px; margin-right: 10px; vertical-align: middle;" />
                  ${montoReembolsado}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Monto original</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/bill.png" alt="Monto original" style="width: 15px; height: 16px; margin-right: 10px; vertical-align: middle;" />
                  ${precio}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Fecha de la actividad</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/calendar.png" alt="Fecha" style="width: 17px; height: 19px; margin-right: 10px; vertical-align: middle;" />
                  ${fecha}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Actividad</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/group.png" alt="Actividad" style="width: 22px; height: 22px; margin-right: 10px; vertical-align: middle;" />
                  ${actividad}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Motivo del reembolso</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/alert.png" alt="Motivo" style="width: 22px; height: 22px; margin-right: 10px; vertical-align: middle;" />
                  ${motivo}
                </div>
              </div>
               <div style="padding-left: 16px; padding-top: 14px">
          <div class="item-titles">Información importante</div>
          <li style="margin-left: 5px">
            El reembolso será reflejado por tu banco en un plazo de 3 a 5 días
            hábiles.
          </li>

          <li style="margin-left: 5px">
            El tiempo exacto puede variar según el banco o método de pago.
          </li>
   
        </div>
            </div>
                       
            <div class="contact-info">
              <div>
                <img src="https://stg.getfloraplus.com/icons/mails/alert.png" alt="alert" style="width: 30px; height: 30px; margin-top: 10px; margin-bottom: 20px; margin-left: 10px;" />
              </div>

              <div class="confirmation-message" style="margin-bottom: 20px">
                ¿Tienes dudas?
              </div>

              <div>
                <p style="font-size: 20px; font-weight: 400;">Contáctanos</p>
              </div>
              ${
                telefonoContacto
                  ? `<div class="item" style="margin-top: 23px">
                      <img
                        class="checkbox"
                        src="https://stg.getfloraplus.com/icons/mails/mobile.png"
                        alt="Teléfono"
                        style="width: 11px; height: 18px; margin-right: 16px; vertical-align: middle;"
                      />
                      <a href="tel:${telefonoContacto}" style="text-decoration: none; color: #212121;">${telefonoContacto}</a>
                    </div>`
                  : ""
              }
              ${
                correoContacto
                  ? `<div class="item" style="margin-bottom: 0px">
                      <img
                        class="checkbox"
                        src="https://stg.getfloraplus.com/icons/mails/mail.png"
                        alt="Correo"
                        style="width: 17px; height: 14px; margin-right: 10px; vertical-align: middle;"
                      />
                      <a href="mailto:${correoContacto}" style="text-decoration: none; color: #212121;">${correoContacto}</a>
                    </div>`
                  : ""
              }
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export default RefundEmailES;
