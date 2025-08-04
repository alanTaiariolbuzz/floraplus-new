export default function renderRefundProcessedTemplateEN(
  data: Record<string, unknown>
) {
  const {
    codigo,
    clienteNombre,
    montoReembolsado,
    fechaReembolso,
    motivo,
    tipoReembolso = "completo", // "completo" o "parcial"
    montoOriginal,
    actividad,
    fechaActividad,
    horaActividad,
    nombreComercial = "Flora Plus",
    logoUrl,
    emailFrom,
    emailReplyTo,
  } = data;

  const esReembolsoCompleto = tipoReembolso === "completo";
  const tipoReembolsoText = esReembolsoCompleto
    ? "Full Refund"
    : "Partial Refund";
  const headerColor = esReembolsoCompleto ? "#E53935" : "#FFA726"; // Red for full, orange for partial

  return {
    subject: `${tipoReembolsoText} Processed - Reservation #${codigo}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${tipoReembolsoText} Processed</title>
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
            background-color: ${headerColor};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .logo {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 15px;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 8px 8px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: ${headerColor}
            text-align: center;
            margin: 20px 0;
          }
          .details {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .reservation-info {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #1E88E5;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
            background-color: ${headerColor};
          }
        </style>
      </head>
      <body>
        Entiendo que este correo no se envía.
      </body>
      </html>
    `,
  };
}
