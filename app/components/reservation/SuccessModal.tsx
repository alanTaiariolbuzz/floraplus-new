import {
  CircleCheck,
  CalendarIcon,
  UsersRound,
  Car,
  Package,
} from "lucide-react";
import { Typography, Button, Box } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import { Language } from "../../translations/reservation";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: {
    reservationId: string;
    amount: number;
    activityName: string;
    customerName: string;
    date: string;
    time: string;
  };
  agenciaConfig: {
    successMessage: string;
    buttonText: string;
  };
  // Datos adicionales para mostrar detalles completos
  personalData?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  selectedTurno?: any;
  selectedTarifas?: Record<string, number>;
  selectedExtras?: {
    transporte: Record<number, number>;
    adicionales: Record<number, number>;
  };
  tarifas?: any[];
  actividad?: any;
  language: Language;
  calculateTotal?: () => number;
}

export const SuccessModal = ({
  isOpen,
  onClose,
  reservationData,
  agenciaConfig,
  personalData,
  selectedTurno,
  selectedTarifas,
  selectedExtras,
  tarifas,
  actividad,
  language,
  calculateTotal,
}: SuccessModalProps) => {
  const { t } = useTranslation(language);

  if (!isOpen) return null;

  // Determinar si tenemos datos completos
  const hasCompleteData =
    personalData &&
    selectedTurno &&
    selectedTarifas &&
    selectedExtras &&
    tarifas &&
    actividad &&
    calculateTotal;

  if (hasCompleteData) {
    // Modal completo con todos los detalles
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-[8px] p-8 max-w-[600px] w-full mx-4">
          <div className="">
            <div className="flex flex-col items-center justify-center">
              <CircleCheck color="#00C853" size={72} />
              <Typography
                variant="h4"
                sx={{ fontWeight: 500 }}
                className="mb-4 text-center pt-4 pb-2"
              >
                {t("reservationConfirmed")} {actividad?.titulo}
                {t("reservationConfirmed2")}
              </Typography>
              <Typography
                variant="body2"
                className="text-center text-[#212121]"
              >
                {t("emailSent")}
              </Typography>
            </div>
            <div className="bg-[#fafafa] rounded-[8px] p-4 mt-6">
              <Typography variant="h6" className="pb-2">
                {personalData?.nombre} {personalData?.apellido}
              </Typography>
              <div className="flex flex-row items-center">
                <Typography variant="subtitle2" className=" pr-[4px]">
                  Email:
                </Typography>
                <Typography variant="body2" className="">
                  {personalData?.email}
                </Typography>
              </div>
              <div className="flex flex-row items-center">
                <Typography variant="subtitle2" className=" pr-[4px]">
                  {t("phoneLabel")}
                </Typography>
                <Typography variant="body2" className="">
                  {personalData?.telefono}
                </Typography>
              </div>
            </div>
            <div className="flex flex-col p-4 border border-[#E0E0E0] rounded-[8px] mt-4">
              <Typography variant="h6" className="pb-2">
                {t("reservationDetails")}
              </Typography>
              <div className="flex flex-row items-center">
                <CalendarIcon className="w-4 h-4 mr-2" color="#666C67" />
                <Typography variant="body2">
                  {selectedTurno
                    ? new Intl.DateTimeFormat(
                        language === "en" ? "en-US" : "es-ES",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        }
                      )
                        .format(new Date(selectedTurno.fecha))
                        .replace(/^\w/, (c) => c.toUpperCase()) +
                      " - " +
                      new Intl.DateTimeFormat(
                        language === "en" ? "en-US" : "es-ES",
                        {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }
                      )
                        .format(
                          new Date(
                            `2000-01-01T${selectedTurno.hora_inicio.split("+")[0]}`
                          )
                        )
                        .replace(/a\.?m\.?/i, "AM")
                        .replace(/p\.?m\.?/i, "PM") +
                      (selectedTurno.hora_fin
                        ? " - " +
                          new Intl.DateTimeFormat(
                            language === "en" ? "en-US" : "es-ES",
                            {
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            }
                          )
                            .format(
                              new Date(
                                `2000-01-01T${selectedTurno.hora_fin.split("+")[0]}`
                              )
                            )
                            .replace(/a\.?m\.?/i, "AM")
                            .replace(/p\.?m\.?/i, "PM")
                        : "")
                    : t("selectDate")}
                </Typography>
              </div>

              <div className="flex flex-col gap-1 mt-[8px]">
                {/*reserva confirmada parte de tarifas */}
                {Object.entries(selectedTarifas)
                  .filter(([_, cantidad]) => cantidad > 0)
                  .map(([id, cantidad]) => {
                    const tarifa = tarifas?.find(
                      (t: any) => t.id === Number(id)
                    );
                    if (!tarifa) return null;
                    return (
                      <div
                        key={id}
                        className={`turno-item flex flex-row items-center ${
                          selectedTurno ? "" : ""
                        }`}
                      >
                        <UsersRound className="w-4 h-4 mr-2" color="#707070" />
                        <div className="flex flex-row justify-between w-full">
                          <span className="text-[14px] font-normal capitalize">
                            {cantidad}{" "}
                            {language === "en"
                              ? tarifa.nombre_en
                              : tarifa.nombre}
                          </span>
                          <span>${(tarifa.precio * cantidad).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}

                {/* Transporte */}
                {Object.entries(selectedExtras.transporte)
                  .filter(([_, cantidad]) => cantidad > 0)
                  .map(([id, cantidad]) => {
                    const transporte = actividad?.transporte?.find(
                      (t: any) => t.id === Number(id)
                    );
                    if (!transporte) return null;
                    return (
                      <div
                        key={`transporte-${id}`}
                        className="flex flex-row items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-600" />
                          <Typography variant="body2">
                            {cantidad} {transporte.titulo}
                          </Typography>
                        </div>
                        <Typography variant="body2">
                          ${(transporte.precio * cantidad).toFixed(2)}
                        </Typography>
                      </div>
                    );
                  })}

                {/* Adicionales */}
                {Object.entries(selectedExtras.adicionales)
                  .filter(([_, cantidad]) => cantidad > 0)
                  .map(([id, cantidad]) => {
                    const adicional = actividad?.adicionales?.find(
                      (a: any) => a.id === Number(id)
                    );
                    if (!adicional) return null;
                    return (
                      <div
                        key={`adicional-${id}`}
                        className="flex flex-row items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" color="#707070" />
                          <Typography variant="body2">
                            {cantidad} {adicional.titulo}
                          </Typography>
                        </div>
                        <span>${(adicional.precio * cantidad).toFixed(2)}</span>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-row justify-between items-center">
                <Typography variant="body1" className="font-bold text-lg">
                  Total:
                </Typography>
                <Typography variant="h6">
                  ${calculateTotal().toFixed(2)}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal genérico para casos donde no tenemos datos completos
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <CircleCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <Typography variant="h5" className="font-semibold mb-2">
            ¡Reserva Confirmada!
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-4">
            {agenciaConfig.successMessage}
          </Typography>

          <Box className="bg-gray-50 p-4 rounded mb-4 text-left">
            <Typography variant="body2" className="mb-1">
              <strong>Reserva:</strong> {reservationData.reservationId}
            </Typography>
            <Typography variant="body2" className="mb-1">
              <strong>Actividad:</strong> {reservationData.activityName}
            </Typography>
            <Typography variant="body2" className="mb-1">
              <strong>Estado:</strong> Pago procesado exitosamente
            </Typography>
            <Typography variant="body2" className="mb-1">
              <strong>Fecha de confirmación:</strong> {reservationData.date}
            </Typography>
            <Typography variant="body2" className="mb-1">
              <strong>Hora:</strong> {reservationData.time}
            </Typography>
          </Box>

          <Box className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outlined"
              className="flex-1"
              sx={{
                borderColor: "#ccc",
                color: "#666",
                "&:hover": {
                  borderColor: "#999",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                onClose();
              }}
              variant="contained"
              className="flex-1"
              sx={{
                backgroundColor: "#F47920",
                "&:hover": {
                  backgroundColor: "#e66a1a",
                },
              }}
            >
              {agenciaConfig.buttonText}
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
};
