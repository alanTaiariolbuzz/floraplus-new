interface ConfirmEmailProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fecha: string;
  participantes: number;
  tarifas: string[];
  precioTotal: string;
  adicionales?: string[];
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  logoUrl?: string;
}

export default function ConfirmEmailEN({
  nombre,
  actividad,
  codigoReserva,
  fecha,
  participantes,
  tarifas,
  precioTotal,
  adicionales = [],
  telefonoContacto,
  correoContacto,
  nombreComercial,
  logoUrl,
}: ConfirmEmailProps) {
  return {
    subject: `Your reservation for ${actividad} has been confirmed`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reservation Confirmation - ${nombreComercial}</title>
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

              .item-titles {
                font-size: 16px;
              }

              .item {
                font-size: 12.8px;
              }

              .total-price {
                font-size: 14.4px;
              }

              .email-cont2 {
                padding: 30px 20px;
              }
              .contact-info {
                padding-left: 20px;
                padding-right: 20px;
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

              <div class="greeting">Hello ${nombre},</div>

              <div class="confirmation-message">Your reservation is confirmed!</div>

              <div class="item-titles">
                Reservation Code:
                <span style="color: #212121; font-weight: 400; margin-left: 5px">
                  ${codigoReserva}
                </span>
              </div>

              <div class="section" style="margin-top: 24px">
                <div class="item-titles">Date & Time</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/calendar.png" alt="Date" style="width: 17px; height: 19px; margin-right: 10px; vertical-align: middle;" />
                  ${fecha}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Participants</div>
                ${tarifas
                  .map(
                    (tarifa: string) =>
                      `<div class="item"><img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/group.png" alt="Participants" style="width: 19px; height: 12px; margin-right: 10px; vertical-align: middle;" /> ${tarifa}</div>`
                  )
                  .join("")}
              </div>

              ${
                adicionales.length > 0
                  ? `
                <div class="section">
                  <div class="item-titles">Extras</div>
                  ${adicionales
                    .map(
                      (extra: string) =>
                        `<div class="item"><img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/cart.png" alt="Extras" style="width: 17px; height: 17px; margin-right: 10px; vertical-align: middle;" /> ${extra}</div>`
                    )
                    .join("")}
                </div>
                `
                  : ""
              }

              <div class="section">
                <div class="item-titles">Total Price</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/bill.png" alt="Total Price" style="width: 16px; height: 17px; margin-right: 10px; vertical-align: middle;" />
                  ${precioTotal}
                </div>
              </div>
            </div>

            <div class="contact-info">
              <div>
                <img src="https://stg.getfloraplus.com/icons/mails/alert.png" alt="alert" style="width: 30px; height: 30px; margin-top: 40px; margin-bottom: 20px; margin-left: 10px;" />
              </div>

              <div class="confirmation-message" style="margin-bottom: 20px">
                Need to make changes?
              </div>

              <div>
                <p style="font-size: 20px; font-weight: 400;">Contact us</p>
              </div>
              ${
                telefonoContacto
                  ? `<div class="item" style="margin-top: 23px">
                      <img
                        class="checkbox"
                        src="https://stg.getfloraplus.com/icons/mails/mobile.png"
                        alt="Phone"
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
                        alt="Email"
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
