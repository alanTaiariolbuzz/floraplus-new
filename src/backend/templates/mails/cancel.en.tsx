interface CancelEmailENProps {
  nombre: string;
  actividad: string;
  codigoReserva: string;
  fecha: string;
  participantes: number;
  precio: string;
  tarifas?: string[];
  adicionales?: string[];
  telefonoContacto: string;
  correoContacto: string;
  nombreComercial: string;
  logoUrl?: string;
}

export default function CancelEmailEN({
  nombre,
  actividad,
  codigoReserva,
  fecha,
  participantes,
  precio,
  tarifas,
  adicionales,
  telefonoContacto,
  correoContacto,
  nombreComercial,
  logoUrl,
}: CancelEmailENProps) {
  return {
    subject: `Your booking for ${actividad} has been cancelled`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Booking Cancelled - ${nombreComercial}</title>
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
              color: #ef4444;
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

            .cancel-message {
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

              .cancel-message {
                font-size: 27.2px;
              }

              .item-titles {
                font-size: 16px;
              }

              .item {
                font-size: 12.8px;
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

              <div class="cancel-message">Your booking has been cancelled</div>

              <div class="item-titles">
                Reservation Code:
                <span style="color: #212121; font-weight: 400; margin-left: 5px">
                  ${codigoReserva}
                </span>
              </div>

              <div class="section" style="margin-top: 24px">
                <div class="item-titles">Activity</div>
                <div class="item">
                  ${actividad}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Date & Time</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/calendar.png" alt="Date" style="width: 17px; height: 19px; margin-right: 10px; vertical-align: middle;" />
                  ${fecha}
                </div>
              </div>

              <div class="section">
                <div class="item-titles">Participants</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/group.png" alt="Participants" style="width: 19px; height: 12px; margin-right: 10px; vertical-align: middle;" />
                  ${participantes}
                </div>
              </div>

              ${
                tarifas && tarifas.length > 0
                  ? `<div class="section">
                      <div class="item-titles">Rates</div>
                      ${tarifas
                        .map(
                          (tarifa) => `
                        <div class="item">
                          <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/check.png" alt="Rate" style="width: 16px; height: 16px; margin-right: 10px; vertical-align: middle;" />
                          ${tarifa}
                        </div>
                      `
                        )
                        .join("")}
                    </div>`
                  : ""
              }

              ${
                adicionales && adicionales.length > 0
                  ? `<div class="section">
                      <div class="item-titles">Add-ons</div>
                      ${adicionales
                        .map(
                          (adicional) => `
                        <div class="item">
                          <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/check.png" alt="Add-on" style="width: 16px; height: 16px; margin-right: 10px; vertical-align: middle;" />
                          ${adicional}
                        </div>
                      `
                        )
                        .join("")}
                    </div>`
                  : ""
              }

              <div class="section">
                <div class="item-titles">Total Price</div>
                <div class="item">
                  <img class="checkbox" src="https://stg.getfloraplus.com/icons/mails/bill.png" alt="Total Price" style="width: 16px; height: 17px; margin-right: 10px; vertical-align: middle;" />
                  ${precio}
                </div>
              </div>
            </div>

            <div class="contact-info">
              <div>
                <img src="https://stg.getfloraplus.com/icons/mails/alert.png" alt="alert" style="width: 30px; height: 30px; margin-top: 40px; margin-bottom: 20px; margin-left: 10px;" />
              </div>

              <div class="cancel-message" style="margin-bottom: 20px; font-size: 24px;">
                Questions or need help?
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
