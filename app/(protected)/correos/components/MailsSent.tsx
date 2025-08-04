import { Typography } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";

interface EmailSent {
  id: number;
  tipo_correo: string;
  destinatario: string;
  asunto: string;
  estado: string;
  enviado_en: string;
  metadata?: {
    data?: {
      actividad?: string;
      codigoReserva?: string;
      nombre?: string;
      nombreComercial?: string;
      fecha?: string;
      precioTotal?: string;
      participantes?: number;
      tarifas?: string[];
      correoContacto?: string;
      telefonoContacto?: string;
      adicionales?: any[];
    };
    fromName?: string;
    template?: string;
  };
  reserva_id?: number;
  agencia_id?: number;
  usuario_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export default function MailsSent() {
  const [emails, setEmails] = useState<EmailSent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/correos_enviados");
        const result = await response.json();

        if (result.code === 200) {
          setEmails(result.data.emails);
        } else {
          setError(result.message || "Error al cargar correos");
        }
      } catch (err) {
        setError("Error al cargar correos enviados");
        console.error("Error fetching emails:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTemplateDisplayName = (templateName: string) => {
    const templateMap: Record<string, string> = {
      confirm: "Confirmación de Reserva",
      "confirm.en": "Reservation Confirmation",
      cancel: "Cancelación de Reserva",
      "cancel.en": "Reservation Cancellation",
      refund: "Reembolso",
      "refund.en": "Refund",
      "refund-processed": "Reembolso",
      reminder: "Recordatorio",
      "reminder.en": "Reminder",
    };

    return templateMap[templateName] || templateName;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enviado":
        return "text-green-600";
      case "fallido":
        return "text-red-600";
      case "pendiente":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "enviado":
        return "Enviado";
      case "fallido":
        return "Fallido";
      case "pendiente":
        return "Pendiente";
      default:
        return status;
    }
  };

  return (
    <div className="rounded-[8px] overflow-hidden border border-[#E0E0E0]">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="bg-[#FAFAFA] h-[55px]">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
              Actividad
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
              Plantilla de correo
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
              Fecha y hora
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium tracking-normal">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium tracking-normal">
              Dirección de correo
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {loading && (
            <tr>
              <td colSpan={5} className="border-t border-[#E0E0E0]">
                <div className="rounded-[8px] w-full">
                  <div className="bg-[#fafafa] h-[180px] w-[96.5%] flex flex-col items-center justify-center m-4 rounded-[10px]">
                    <Typography variant="body1" sx={{ py: "12px" }}>
                      Cargando correos...
                    </Typography>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {error && (
            <tr>
              <td colSpan={5} className="border-t border-[#E0E0E0]">
                <div className="rounded-[8px] w-full">
                  <div className="bg-[#fafafa] h-[180px] w-[96.5%] flex flex-col items-center justify-center m-4 rounded-[10px]">
                    <Image
                      src="/icons/mail-error.svg"
                      alt="Mail Error"
                      width={21}
                      height={21}
                    />
                    <Typography variant="body1" sx={{ py: "12px" }}>
                      {error}
                    </Typography>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {!loading && !error && emails.length === 0 && (
            <tr>
              <td colSpan={5} className="border-t border-[#E0E0E0]">
                <div className="rounded-[8px] w-full">
                  <div className="bg-[#fafafa] h-[180px] w-[96.5%] flex flex-col items-center justify-center m-4 rounded-[10px]">
                    <Image
                      src="/icons/mail-error.svg"
                      alt="Mail Error"
                      width={21}
                      height={21}
                    />
                    <Typography variant="body1" sx={{ py: "12px" }}>
                      No tienes correos enviados
                    </Typography>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            emails.length > 0 &&
            emails.map((email) => (
              <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                  {email?.metadata?.data ? (
                    <div>
                      <div className="font-medium">
                        {email?.metadata?.data?.actividad ||
                          "Actividad no disponible"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {email?.metadata?.data?.codigoReserva}
                      </div>
                    </div>
                  ) : (
                    "Sin reserva asociada"
                  )}
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                  {getTemplateDisplayName(email.tipo_correo)}
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                  {formatDate(email.enviado_en)}
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-right">
                  <span
                    className={`font-medium ${getStatusColor(email.estado)}`}
                  >
                    {getStatusText(email.estado)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-right">
                  {email.destinatario}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
