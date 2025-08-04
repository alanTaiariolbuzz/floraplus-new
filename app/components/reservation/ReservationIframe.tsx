"use client";

import { useState, useEffect } from "react";
import CalendarStep from "./CalendarStep";
import TariffSelector from "./TariffSelector";
import PersonalDataForm from "./PersonalDataForm";
// import ReservationPayment from "./PaymentForm";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { PaymentForm } from "./PaymentForm";
import type { Turno, Tarifa, PersonalData } from "../../types/reservation";
import { useReservationStore } from "../../store/reservationStore";
import { AlertTitle, Alert, Typography } from "@mui/material";
import {
  CalendarIcon,
  UsersRound,
  CreditCardIcon,
  Clock,
  CircleCheck,
  Car,
  Package,
} from "lucide-react";
import { ExtrasStep } from "./ExtrasStep";
import { useTranslation } from "../../hooks/useTranslation";
import { Language } from "../../translations/reservation";
import { formatDisplayDate, formatDisplayTime } from "../../utils/timezone";

// Función de utilidad para formatear números con separadores de miles
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface ReservationIframeProps {
  actividadId: string;
  language: Language;
}

interface Transporte {
  id: number;
  precio: number;
  titulo: string;
  direccion: string;
  hora_salida: string;
}

interface Adicional {
  id: number;
  titulo: string;
  titulo_en: string;
  precio: number;
  descripcion: string;
}

interface Actividad {
  titulo: string;
  titulo_en: string;
  descripcion: string;
  descripcion_en: string;
  imagen: string;
  transporte?: Transporte[];
  adicionales?: Adicional[];
  stripe_account_id?: string;
  agencia_id?: number;
  detalles?: {
    minimo_reserva: number;
    limite_reserva_minutos?: number | null;
    umbral_limite_personas?: number | null;
    umbral_limite_minutos?: number | null;
    umbral_limite_tipo?: string | null;
  };
}

interface AgenciaData {
  id: number;
  tax: number | null;
  convenience_fee_fijo: boolean;
  convenience_fee_fijo_valor: number | null;
  convenience_fee_variable: boolean;
  convenience_fee_variable_valor: number | null;
}

export const ReservationIframe = ({
  actividadId,
  language,
}: ReservationIframeProps) => {
  const { t } = useTranslation(language);
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number>(420); // 7 minutes in seconds
  const [showTimer, setShowTimer] = useState(false);
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [tarifas, setTarifas] = useState<Tarifa[] | null>(null);
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [selectedTarifas, setSelectedTarifas] = useState<
    Record<string, number>
  >({});
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationConfirmed, setReservationConfirmed] = useState(false);
  const [reservationNumber, setReservationNumber] = useState<string>("");
  const [reservationDetails, setReservationDetails] = useState<any>(null);
  const [hasExtras, setHasExtras] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<{
    transporte: Record<number, number>;
    adicionales: Record<number, number>;
  }>({ transporte: {}, adicionales: {} });
  const [validationFunctions, setValidationFunctions] = useState<{
    validate: () => boolean;
    getData: () => PersonalData;
  } | null>(null);
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [turnoReservasTotales, setTurnoReservasTotales] = useState<number>(0);
  const [agenciaData, setAgenciaData] = useState<AgenciaData | null>(null);
  const [agenciaId, setAgenciaId] = useState<number | null>(null);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  // Monitor agenciaData changes

  // Update agenciaId when actividad changes
  useEffect(() => {
    if (actividad?.agencia_id) {
      setAgenciaId(actividad.agencia_id);
    }
  }, [actividad]);

  // Remove the direct function call
  const fetchAgencia = async () => {
    if (!agenciaId) {
      return; // Add guard clause
    }
    try {
      const response = await fetch(`/api/agencias?id=${agenciaId}`);
      const data = await response.json();
      if (data.code === 200 && data.data && data.data.length > 0) {
        const agencia = data.data[0];
        setPais(agencia.pais);
        setAgenciaData({
          id: agencia.id,
          tax: agencia.tax,
          convenience_fee_fijo: agencia.convenience_fee_fijo,
          convenience_fee_fijo_valor: agencia.convenience_fee_fijo_valor,
          convenience_fee_variable: agencia.convenience_fee_variable,
          convenience_fee_variable_valor:
            agencia.convenience_fee_variable_valor,
        });
      }
    } catch (error) {
      console.error("Error fetching agency data:", error);
    }
  };

  const [pais, setPais] = useState<string | null>(null);

  // Add useEffect for fetchAgencia
  useEffect(() => {
    if (agenciaId) {
      fetchAgencia();
    }
  }, [agenciaId]); // Only run when agenciaId changes

  const { addReservation } = useReservationStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turnosRes, tarifasRes, actividadRes] = await Promise.all([
          fetch(`/api/public/turnos?actividad_id=${actividadId}`),
          fetch(`/api/public/tarifas?actividad_id=${actividadId}`),
          fetch(`/api/public/actividades?id=${actividadId}`),
        ]);

        if (!turnosRes.ok || !tarifasRes.ok || !actividadRes.ok) {
          throw new Error("Error al cargar los datos");
        }

        const [turnosData, tarifasData, actividadData] = await Promise.all([
          turnosRes.json(),
          tarifasRes.json(),
          actividadRes.json(),
        ]);

        setTurnos(turnosData.data);
        setTarifas(tarifasData.data);
        setActividad(actividadData.data);

        // Check if activity has extras
        setHasExtras(
          (actividadData.data.transporte?.length > 0 ||
            actividadData.data.adicionales?.length > 0) ??
            false
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [actividadId]);

  // Monitor actividad changes

  // Función para obtener las reservas totales de un turno
  const fetchTurnoReservasTotales = async (turnoId: number) => {
    try {
      const response = await fetch(`/api/public/reservas?turno_id=${turnoId}`);
      if (response.ok) {
        const data = await response.json();

        if (data.code === 200 && data.data) {
          // Calcular el total de personas en todas las reservas del turno
          const totalPersonas = data.data.reduce(
            (total: number, reserva: any) => {
              if (
                reserva.reserva_items &&
                Array.isArray(reserva.reserva_items)
              ) {
                const personasEnReserva = reserva.reserva_items.reduce(
                  (sum: number, item: any) => {
                    // Solo contar items de tipo 'tarifa' para el cálculo de personas
                    if (item.item_type === "tarifa" && item.cantidad) {
                      return sum + item.cantidad;
                    }
                    return sum;
                  },
                  0
                );
                return total + personasEnReserva;
              }
              return total;
            },
            0
          );

          setTurnoReservasTotales(totalPersonas);
        } else {
          console.warn("Respuesta inesperada del endpoint de reservas:", data);
          setTurnoReservasTotales(0);
        }
      } else {
        console.error("Error al obtener reservas del turno:", response.status);
        setTurnoReservasTotales(0);
      }
    } catch (error) {
      console.error("Error fetching turno reservas totales:", error);
      setTurnoReservasTotales(0);
    }
  };

  // Actualizar las reservas totales cuando se selecciona un turno
  useEffect(() => {
    if (selectedTurno) {
      fetchTurnoReservasTotales(selectedTurno.turno_id);
    } else {
      setTurnoReservasTotales(0);
    }
  }, [selectedTurno]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Detener el timer si la reserva ya fue confirmada
    if (showTimer && timeLeft > 0 && !reservationConfirmed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer se agotó - ejecutar inmediatamente
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showTimer, timeLeft, reservationConfirmed]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleTimeout = () => {
    // No ejecutar timeout si la reserva ya fue confirmada
    if (reservationConfirmed) {
      return;
    }

    setShowTimer(false);

    // No cancelar la reserva automáticamente - el cron job se encarga de eso
    setTimeoutError(
      language === "en"
        ? "Time has expired. Please start your reservation again."
        : "El tiempo ha expirado. Por favor, inicie su reserva nuevamente."
    );
  };

  const handleTurnoSelect = (turno: Turno | null) => {
    setSelectedTurno(turno);
  };

  const handleTarifasSelect = (tarifas: Record<string, number>) => {
    setSelectedTarifas(tarifas);
  };

  const handlePersonalDataSubmit = async (data: PersonalData) => {
    setPersonalData(data);

    // Crear la reserva antes del pago para obtener el reservaId
    if (!selectedTurno || !selectedTarifas) {
      setError("Faltan datos requeridos para la reserva");
      return;
    }

    try {
      const reservaData = {
        turno_id: selectedTurno.turno_id,
        cliente: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono,
        },
        items: [
          ...Object.entries(selectedTarifas)
            .filter(([_, cantidad]) => cantidad > 0)
            .map(([id, cantidad]) => ({
              item_type: "tarifa" as const,
              item_id: Number(id),
              cantidad: cantidad,
            })),
          ...Object.entries(selectedExtras.transporte)
            .filter(([_, cantidad]) => cantidad > 0)
            .map(([id, cantidad]) => ({
              item_type: "transporte" as const,
              item_id: Number(id),
              cantidad: cantidad,
            })),
          ...Object.entries(selectedExtras.adicionales)
            .filter(([_, cantidad]) => cantidad > 0)
            .map(([id, cantidad]) => ({
              item_type: "adicional" as const,
              item_id: Number(id),
              cantidad: cantidad,
            })),
        ],
      };

      const reservaResponse = await fetch("/api/public/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservaData),
      });

      if (!reservaResponse.ok) {
        const errorData = await reservaResponse.json();
        throw new Error(errorData.message || "Error al crear la reserva");
      }

      const reservaResult = await reservaResponse.json();
      const newReservaId =
        reservaResult.data?.reservaId || reservaResult.data?.id;

      if (!newReservaId) {
        throw new Error("No se recibió el ID de la reserva");
      }

      setReservaId(newReservaId);
      setCurrentStep(hasExtras ? 4 : 3);
      // Activar el timer solo después de completar los datos personales
      setShowTimer(true);
      setTimeLeft(420); // Reset timer to 7 minutes
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error inesperado";
      setError(errorMessage);
      console.error("Error creando reserva:", err);
    }
  };

  const handleExtrasSelect = (data: {
    transporte: Record<number, number>;
    adicionales: Record<number, number>;
  }) => {
    setSelectedExtras(data);
  };

  const handleBack = () => {
    if (currentStep === 2 && hasExtras) {
      setCurrentStep(1);
    } else if (currentStep === 3 && hasExtras) {
      setCurrentStep(2);
    } else if (currentStep === 4 && hasExtras) {
      setCurrentStep(3);
    } else if (currentStep === 5 && hasExtras) {
      setCurrentStep(4);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && hasExtras) {
      setCurrentStep(2);
    } else if (currentStep === 2 && hasExtras) {
      setCurrentStep(3);
    } else if (currentStep === 3 && hasExtras) {
      setCurrentStep(4);
    } else if (currentStep === 4 && hasExtras) {
      setCurrentStep(5);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const checkCanProceed = () => {
    if (currentStep === 1) {
      const totalTickets = Object.values(selectedTarifas).reduce(
        (sum, cantidad) => sum + cantidad,
        0
      );

      // Calcular el total de reservas que habría en el turno después de esta reserva
      const reservasTotalesConEstaReserva = turnoReservasTotales + totalTickets;

      return (
        selectedTurno &&
        reservasTotalesConEstaReserva >=
          (actividad?.detalles?.minimo_reserva ?? 1)
      );
    }
    if (currentStep === 2 && hasExtras) {
      return true;
    }
    if (currentStep === 3 && hasExtras) {
      return true;
    }
    if (currentStep === 4 && hasExtras) {
      return true;
    }
    if (currentStep === 5 && hasExtras) {
      return true;
    }
    return true;
  };

  const calculateTotal = () => {
    let total = 0;

    // Calculate tarifas total
    if (selectedTarifas && tarifas) {
      total += Object.entries(selectedTarifas).reduce(
        (acc, [tarifaId, cantidad]) => {
          const tarifa = tarifas.find((t) => t.id === Number(tarifaId));
          return acc + (tarifa ? tarifa.precio * cantidad : 0);
        },
        0
      );
    }

    // Calculate transporte total
    if (selectedExtras.transporte && actividad?.transporte) {
      total += Object.entries(selectedExtras.transporte).reduce(
        (acc, [transporteId, cantidad]) => {
          const transporte = actividad.transporte?.find(
            (t) => t.id === Number(transporteId)
          );
          return acc + (transporte ? transporte.precio * cantidad : 0);
        },
        0
      );
    }

    // Calculate adicionales total
    if (selectedExtras.adicionales && actividad?.adicionales) {
      total += Object.entries(selectedExtras.adicionales).reduce(
        (acc, [adicionalId, cantidad]) => {
          const adicional = actividad.adicionales?.find(
            (a) => a.id === Number(adicionalId)
          );
          return acc + (adicional ? adicional.precio * cantidad : 0);
        },
        0
      );
    }

    return total;
  };

  const calculateSubtotal = () => {
    return calculateTotal();
  };

  const calculateConvenienceFee = () => {
    if (!agenciaData) {
      return 0;
    }

    const subtotal = calculateSubtotal();

    if (
      agenciaData.convenience_fee_fijo &&
      agenciaData.convenience_fee_fijo_valor
    ) {
      return agenciaData.convenience_fee_fijo_valor;
    } else if (
      agenciaData.convenience_fee_variable &&
      agenciaData.convenience_fee_variable_valor
    ) {
      // No redondear aquí, calcular el valor exacto
      const fee = (subtotal * agenciaData.convenience_fee_variable_valor) / 100;

      return fee;
    }

    return 0;
  };

  const calculateTax = () => {
    if (!agenciaData || !agenciaData.tax) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    // Tax se calcula solo sobre el subtotal, no sobre subtotal + convenience fee
    const tax = (subtotal * agenciaData.tax) / 100;

    return tax;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const convenienceFee = calculateConvenienceFee();
    const tax = calculateTax();
    const total = subtotal + convenienceFee + tax;

    return total;
  };

  const handlePaymentSubmit = async (paymentMethodId: string) => {
    if (!reservaId || !selectedTurno || !personalData) {
      setError("Faltan datos requeridos para confirmar la reserva");
      return;
    }

    try {
      // Confirmar la reserva en la base de datos
      const confirmResponse = await fetch(
        `/api/reservas/${reservaId}/confirmar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.message || "Error al confirmar la reserva");
      }

      const confirmData = await confirmResponse.json();

      // Crear objeto de reserva confirmada para el store
      const confirmedReservation = {
        id: reservaId,
        turno_id: selectedTurno.turno_id,
        personal_data: personalData,
        tarifas: selectedTarifas,
        payment_data: {
          cardNumber: "",
          cardHolder: "",
          expiryDate: "",
          cvv: "",
        },
        total: calculateGrandTotal(),
        numero_reserva: confirmData.data.numero_reserva,
        estado: "confirmed" as const,
        fecha_creacion: new Date().toISOString(),
      };

      setReservationNumber(confirmedReservation.numero_reserva);
      setReservationDetails(confirmedReservation);
      setReservationConfirmed(true);
      setCurrentStep(hasExtras ? 5 : 4);

      // Detener el timer inmediatamente cuando se confirma la reserva
      setShowTimer(false);

      addReservation(confirmedReservation);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error inesperado";
      setError(errorMessage);
      console.error("Error confirming reservation:", err);
    }
  };

  useEffect(() => {
    // Agregar la clase al body cuando el componente se monta
    document.body.dataset.mode = "reservation-iframe";

    // Remover la clase cuando el componente se desmonta
    return () => {
      document.body.dataset.mode = "";
    };
  }, []);

  if (isLoading) {
    return (
      <div className="reservation-container">
        <div className="text-center py-8"></div>
      </div>
    );
  }

  if (error || timeoutError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center ">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="reservation-details">
            <h4 className="font-medium text-[16px] mb-4 text-red-600">
              {timeoutError
                ? language === "en"
                  ? "Time Expired"
                  : "Tiempo Expirado"
                : t("error")}
            </h4>
            <Typography variant="body2" className="text-gray-600">
              {timeoutError || error}
            </Typography>
            {timeoutError && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    // Resetear todo el estado para empezar de nuevo
                    setCurrentStep(1);
                    setShowTimer(false);
                    setTimeLeft(420);
                    setTimeoutError(null);
                    setError(null);
                    setPersonalData(null);
                    setSelectedTurno(null);
                    setSelectedTarifas({});
                    setSelectedExtras({ transporte: {}, adicionales: {} });
                    setReservaId(null);
                  }}
                  className="button-primary w-full"
                >
                  {language === "en"
                    ? "Start New Reservation"
                    : "Iniciar Nueva Reserva"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  let popupTest = false;

  if (reservationConfirmed || popupTest) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 ">
        <div className="bg-white rounded-[8px] p-8 max-w-[600px] w-full mx-4">
          <div className=" ">
            <div className="flex flex-col items-center justify-center">
              <CircleCheck color="#00C853" size={72} />
              <Typography
                variant="h4"
                sx={{ fontWeight: 500 }}
                className="mb-4 text-center pt-4 pb-2"
              >
                {t("reservationConfirmed")}{" "}
                {language === "en" ? actividad?.titulo_en : actividad?.titulo}
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
                    ? formatDisplayDate(selectedTurno.fecha, language) +
                      " - " +
                      formatDisplayTime(selectedTurno.hora_inicio, language) +
                      (selectedTurno.hora_fin
                        ? " - " +
                          formatDisplayTime(selectedTurno.hora_fin, language)
                        : "")
                    : t("selectDate")}
                </Typography>
              </div>

              <div className="flex flex-col gap-1 mt-[8px]">
                {/*reserva confirmada parte de tarifas */}
                {Object.entries(selectedTarifas)
                  .filter(([_, cantidad]) => cantidad > 0)
                  .map(([id, cantidad]) => {
                    const tarifa = tarifas?.find((t) => t.id === Number(id));
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
                          <span className="text-[14px]">
                            ${formatCurrency(tarifa.precio * cantidad)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {/* Transporte */}
                {Object.entries(selectedExtras.transporte)
                  .filter(([_, cantidad]) => cantidad > 0)
                  .map(([id, cantidad]) => {
                    const transporte = actividad?.transporte?.find(
                      (t) => t.id === Number(id)
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
                          ${formatCurrency(transporte.precio * cantidad)}
                        </Typography>
                      </div>
                    );
                  })}

                {/* Adicionales */}
                {Object.entries(selectedExtras.adicionales)
                  .filter(([_, cantidad]) => cantidad > 0)
                  .map(([id, cantidad]) => {
                    const adicional = actividad?.adicionales?.find(
                      (a) => a.id === Number(id)
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
                        <span className="text-[14px]">
                          ${formatCurrency(adicional.precio * cantidad)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-row justify-between items-center">
                <div className="w-full">
                  {(calculateConvenienceFee() > 0 || calculateTax() > 0) && (
                    <div className="mt-2 flex flex-row justify-between items-center w-full">
                      <Typography variant="body2" className="font-medium">
                        {t("convenienceFee")}:
                      </Typography>
                      <Typography variant="body2">
                        $
                        {formatCurrency(
                          calculateConvenienceFee() + calculateTax()
                        )}
                      </Typography>
                    </div>
                  )}

                  <div className="mt-2 flex flex-row justify-between items-center w-full">
                    <Typography variant="body1" className="font-bold text-lg">
                      {t("total")}
                    </Typography>
                    <Typography variant="h6">
                      ${formatCurrency(calculateGrandTotal())}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent ">
      {/* Header SIEMPRE arriba */}
      <div className="reservation-header w-full lg:w-[66%] ">
        <Typography
          variant="subtitle1"
          className="bg-[#FB8C00] text-white pt-[13px] pr-6 pb-[13px] pl-6 rounded-t-[8px]"
        >
          {language === "en"
            ? actividad?.titulo_en
            : actividad?.titulo || t("loading")}
        </Typography>
        <div className="steps-container flex flex-row justify-between px-2 md:px-6 xl:px-10 py-7 bg-white border-b border-[#f5f5f5]">
          <div
            className={`step-item ${currentStep >= 1 ? "active" : "inactive"}`}
          >
            <span
              className={`text-[12px] font-normal rounded-full text-white w-[24px] h-[24px] mb-2 md:mb-0 flex items-center justify-center mr-2 ${
                currentStep >= 1 ? "bg-[#FB8C00]" : "bg-[#B2B2B2]"
              }`}
            >
              1
            </span>
            {t("step1")}
          </div>
          <div className="step-separator hidden sm:block">
            <hr className="border-t border-gray-300 w-[30px] xl:w-[100px]" />
          </div>
          {hasExtras && (
            <>
              <div
                className={`step-item ${currentStep >= 2 ? "active" : "inactive"}`}
              >
                <span
                  className={`text-[12px] font-normal rounded-full text-white w-[24px] h-[24px] mb-2 sm:mb-0 flex items-center justify-center mr-2 ${
                    currentStep >= 2 ? "bg-[#FB8C00]" : "bg-[#B2B2B2]"
                  }`}
                >
                  2
                </span>{" "}
                {t("step2")}
              </div>
              <div className="step-separator hidden sm:block">
                <hr className="border-t border-gray-300 w-[30px] xl:w-[100px]" />
              </div>
            </>
          )}
          <div
            className={`step-item ${currentStep >= (hasExtras ? 3 : 2) ? "active" : "inactive"}`}
          >
            <span
              className={`text-[12px] font-normal rounded-full text-white w-[24px] h-[24px] mb-2 sm:mb-0 flex items-center justify-center mr-2 ${
                currentStep >= (hasExtras ? 3 : 2)
                  ? "bg-[#FB8C00]"
                  : "bg-[#B2B2B2]"
              }`}
            >
              {hasExtras ? "3" : "2"}
            </span>{" "}
            {t("step3")}
          </div>
          <div className="step-separator hidden sm:block">
            <hr className="border-t border-gray-300 w-[30px] xl:w-[100px]" />
          </div>
          <div
            className={`step-item ${currentStep >= (hasExtras ? 4 : 3) ? "active" : "inactive"}`}
          >
            <span
              className={`text-[12px] font-normal rounded-full text-white w-[24px] h-[24px] mb-2 sm:mb-0 flex items-center justify-center mr-2 ${
                currentStep >= (hasExtras ? 4 : 3)
                  ? "bg-[#FB8C00]"
                  : "bg-[#B2B2B2]"
              }`}
            >
              {hasExtras ? "4" : "3"}
            </span>{" "}
            {t("step4")}
          </div>
        </div>
        {showTimer &&
          (currentStep === (hasExtras ? 4 : 3) || currentStep === 5) && (
            <div className="px-8 bg-white pt-5">
              <div className="flex flex-row justify-center items-center p-[11px] gap-[10px] w-full h-[54px] bg-[#FFFDE7] rounded-[8px]">
                <span className="text-[14px] font-medium leading-[143%] text-[#FF9100]">
                  {t("confirmReservationBeforeTimeRunsOut")}{" "}
                  <span className="text-[24px] font-normal ml-1">
                    {formatTime(timeLeft)}
                  </span>
                </span>
              </div>
            </div>
          )}
      </div>
      {/* Contenido principal responsive */}
      <div className="flex flex-col lg:flex-row w-full">
        <div className="main-content w-full lg:w-[66%] bg-white pt-5 ">
          {/* Form Section (66%) */}
          <div className="form-section w-full px-4 md:px-6 xl:px-8 pb-4">
            {currentStep === 1 && turnos && tarifas && (
              <div>
                <div className="reservation-steps-container ">
                  <div className="calendar-section  gap-4 w-full sm:w-auto flex  flex-col md:flex-row">
                    <CalendarStep
                      turnos={turnos}
                      onSelectTurno={handleTurnoSelect}
                      selectedTurno={selectedTurno}
                      tarifas={tarifas}
                      onTarifasSelect={handleTarifasSelect}
                      selectedTarifas={selectedTarifas}
                      pais={pais}
                      minimo_reserva={actividad?.detalles?.minimo_reserva ?? 1}
                      language={language}
                      turnoReservasTotales={turnoReservasTotales}
                      detalles={actividad?.detalles}
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center border-t border-[#F5F5F5] pt-6">
                  <div>
                    {(actividad?.detalles?.minimo_reserva ?? 1) > 1 &&
                      selectedTurno &&
                      (() => {
                        const totalTickets = Object.values(
                          selectedTarifas
                        ).reduce((sum, cantidad) => sum + cantidad, 0);
                        const reservasTotalesConEstaReserva =
                          turnoReservasTotales + totalTickets;
                        const minimoRequerido =
                          actividad?.detalles?.minimo_reserva ?? 1;

                        // Solo mostrar alerta si NO se cumple el mínimo
                        if (reservasTotalesConEstaReserva < minimoRequerido) {
                          return (
                            <Alert severity="info">
                              <Typography
                                variant="body2"
                                className="max-w-[400px]"
                              >
                                {language === "en"
                                  ? `This activity requires a minimum of ${minimoRequerido} total reservations to be confirmed. Currently there are ${turnoReservasTotales} reservations for this time slot.`
                                  : `Esta actividad requiere un mínimo de ${minimoRequerido} reservas totales para confirmarse. Actualmente hay ${turnoReservasTotales} reservas para este horario.`}
                              </Typography>
                            </Alert>
                          );
                        }
                        return null;
                      })()}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentStep(2);
                    }}
                    disabled={!checkCanProceed()}
                    className="button-primary"
                  >
                    {t("continue")}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && hasExtras && (
              <div>
                <ExtrasStep
                  transporte={actividad?.transporte || []}
                  adicionales={actividad?.adicionales || []}
                  onExtrasSelect={handleExtrasSelect}
                  initialData={selectedExtras}
                  language={language}
                />
                <div className="mt-8 flex justify-between border-t border-[#F5F5F5] pt-6">
                  <button onClick={handleBack} className="button-secondary">
                    {t("back")}
                  </button>
                  <button onClick={handleNext} className="button-primary">
                    {t("continue")}
                  </button>
                </div>
              </div>
            )}

            {currentStep === (hasExtras ? 3 : 2) && (
              <div>
                <PersonalDataForm
                  onSubmit={handlePersonalDataSubmit}
                  initialData={personalData ?? undefined}
                  onValidate={(validate, getData) => {
                    setValidationFunctions({ validate, getData });
                  }}
                  language={language}
                />
                <div className="mt-8 flex justify-between border-t border-[#F5F5F5] pt-6">
                  <button onClick={handleBack} className="button-secondary">
                    {t("back")}
                  </button>
                  <button
                    onClick={() => {
                      if (validationFunctions) {
                        const { validate, getData } = validationFunctions;
                        if (validate()) {
                          handlePersonalDataSubmit(getData());
                          handleNext();
                        }
                      }
                    }}
                    className="button-primary"
                  >
                    {t("continue")}
                  </button>
                </div>
              </div>
            )}

            {currentStep === (hasExtras ? 4 : 3) && (
              <div>
                {!personalData ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">
                      {t("pleaseCompleteYourPersonalData")}
                    </p>
                  </div>
                ) : !reservaId ? (
                  <></>
                ) : (
                  <PaymentForm
                    onPayment={handlePaymentSubmit}
                    name={`${personalData?.nombre} ${personalData?.apellido}`}
                    total={calculateGrandTotal()}
                    subtotal={calculateSubtotal()}
                    agencia_id={actividad?.agencia_id || 0}
                    personalData={personalData}
                    reservaId={reservaId}
                    language={language}
                  />
                )}
              </div>
            )}

            {currentStep === 5 && reservationConfirmed && <></>}
          </div>
        </div>
        {/* Sidebar */}
        <div className="sidebar w-full lg:w-[33%] mt-4 lg:mt-[30px] lg:absolute lg:right-0 lg:top-0 static">
          <div className="w-full h-[36px] rounded-[8px] flex items-center justify-end pr-6 bg-white text-black mb-2">
            <p className="text-[12px] font-normal">{t("poweredBy")}</p>
          </div>
          <div className="sidebar-card">
            <img
              src={actividad?.imagen}
              alt={
                language === "en"
                  ? actividad?.titulo_en
                  : actividad?.titulo || "Activity"
              }
              className="sidebar-image"
            />
            <div className="sidebar-content pb-4">
              <div className="md:mx-8 mt-4 mx-4">
                <Typography variant="body2" className=" ">
                  {language === "en"
                    ? actividad?.descripcion_en
                    : actividad?.descripcion || t("loading")}
                </Typography>
              </div>

              <div className="flex flex-row items-center w-full ">
                <span className="bg-[#000000cc] w-[10px] h-[10px] rounded-full ml-[-6px] z-10"></span>
                <hr className="my-4 border-t border-dashed border-gray-300 w-full" />
                <span className="bg-[#000000cc] w-[10px] h-[10px] rounded-full mr-[-6px] z-10"></span>
              </div>
              <div className="reservation-details md:mx-8 mx-4">
                <h4 className="font-medium text-[16px] mb-2      letter-spacing: 0.15px; tracking-[0">
                  {t("reservationDetails")}
                </h4>
                <div className="">
                  <div
                    className={`flex flex-row items-center rounded-[4px] p-2 ${
                      selectedTurno ? "bg-[#FFF3E0]" : "bg-[#f5f5f5]"
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" color="#707070" />
                    <Typography variant="body2" className="">
                      {selectedTurno
                        ? formatDisplayDate(selectedTurno.fecha, language) +
                          " - " +
                          formatDisplayTime(
                            selectedTurno.hora_inicio,
                            language
                          ) +
                          (selectedTurno.hora_fin
                            ? " - " +
                              formatDisplayTime(
                                selectedTurno.hora_fin,
                                language
                              )
                            : "")
                        : t("selectDate")}
                    </Typography>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    {/* Tarifas */}
                    {Object.entries(selectedTarifas).filter(
                      ([_, cantidad]) => cantidad > 0
                    ).length > 0 ? (
                      Object.entries(selectedTarifas)
                        .filter(([_, cantidad]) => cantidad > 0)
                        .map(([id, cantidad]) => {
                          const tarifa = tarifas?.find(
                            (t) => t.id === Number(id)
                          );
                          if (!tarifa) return null;
                          return (
                            <div
                              key={id}
                              className={`turno-item flex flex-row items-center rounded-[4px] p-2 ${
                                selectedTurno ? "bg-[#FFF3E0]" : "bg-[#f5f5f5]"
                              }`}
                            >
                              <UsersRound
                                className="w-4 h-4 mr-2"
                                color="#707070"
                              />
                              <div className="flex flex-row justify-between w-full">
                                <span className="text-[14px] font-normal capitalize">
                                  {cantidad}{" "}
                                  {language === "en"
                                    ? tarifa.nombre_en
                                    : tarifa.nombre}
                                </span>

                                <Typography
                                  variant="body2"
                                  className="text-[14px]"
                                >
                                  ${formatCurrency(tarifa.precio * cantidad)}
                                </Typography>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="turno-item flex flex-row items-center rounded-[4px] p-2 bg-[#f5f5f5]">
                        <UsersRound className="w-4 h-4 mr-2" color="#707070" />
                        <Typography variant="body2" className="">
                          {t("selectPeople")}
                        </Typography>
                      </div>
                    )}

                    {/* Transporte */}
                    {Object.entries(selectedExtras.transporte)
                      .filter(([_, cantidad]) => cantidad > 0)
                      .map(([id, cantidad]) => {
                        const transporte = actividad?.transporte?.find(
                          (t) => t.id === Number(id)
                        );
                        if (!transporte) return null;
                        return (
                          <div
                            key={`transporte-${id}`}
                            className={`turno-item flex flex-row items-center rounded-[4px] p-2 ${
                              selectedTurno ? "bg-[#FFF3E0]" : "bg-[#f5f5f5]"
                            }`}
                          >
                            <Car className="w-4 h-4 mr-2" />
                            <Typography
                              variant="body2"
                              className="flex flex-row justify-between w-full"
                            >
                              <p>
                                {cantidad} {transporte.titulo}
                              </p>
                              <p className="text-[14px]">
                                ${formatCurrency(transporte.precio * cantidad)}
                              </p>
                            </Typography>
                          </div>
                        );
                      })}

                    {/* Adicionales */}
                    {Object.entries(selectedExtras.adicionales)
                      .filter(([_, cantidad]) => cantidad > 0)
                      .map(([id, cantidad]) => {
                        const adicional = actividad?.adicionales?.find(
                          (a) => a.id === Number(id)
                        );
                        if (!adicional) return null;
                        return (
                          <div
                            key={`adicional-${id}`}
                            className={`turno-item flex flex-row items-center rounded-[4px] p-2 ${
                              selectedTurno ? "bg-[#FFF3E0]" : "bg-[#f5f5f5]"
                            }`}
                          >
                            <Package className="w-4 h-4 mr-2" color="#707070" />
                            <Typography
                              variant="body2"
                              className="flex flex-row justify-between w-full"
                            >
                              <p>
                                {cantidad}{" "}
                                {language === "en"
                                  ? adicional.titulo_en
                                  : adicional.titulo}
                              </p>
                              <p className="text-[14px]">
                                ${formatCurrency(adicional.precio * cantidad)}
                              </p>
                            </Typography>
                          </div>
                        );
                      })}
                  </div>

                  <div className="flex flex-row items-center justify-between px-3 mt-2">
                    <Typography variant="body2" className="">
                      {t("convenienceFee")}
                    </Typography>
                    <Typography variant="body2" className="font-bold">
                      $
                      {formatCurrency(
                        calculateConvenienceFee() + calculateTax()
                      ) || "0"}
                    </Typography>
                  </div>

                  <div className="flex flex-row items-center justify-between px-3 mt-2 border-t border-[#F5F5F5] pt-2">
                    <Typography variant="body1" className="">
                      Total:
                    </Typography>
                    <Typography variant="h6" className="font-bold">
                      ${formatCurrency(calculateGrandTotal())}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
