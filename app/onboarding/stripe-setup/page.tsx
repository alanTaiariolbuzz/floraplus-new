"use client";

/* Esta ruta esta deprecada, se debe usar la ruta /onboarding/stripe-setup */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  createStripeAccountAction,
  completeStripeSetupAction,
} from "./actions";
import BankAccountForm from "./components/BankAccountForm";
import {
  Typography,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

// Loading fallback component for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <CircularProgress />
  </div>
);

function StripeSetupContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = searchParams.get("agencyId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"intro" | "details">("intro");
  const [stripeAccountId, setStripeAccountId] = useState<string>("");
  const [stripeRequirements, setStripeRequirements] = useState<string[]>([]);
  const [agencyData, setAgencyData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);

  // Estados para el proceso de configuración de Stripe
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // Estado para los detalles del negocio
  const [businessDetails, setBusinessDetails] = useState<{
    businessName: string;
    businessType: string;
    email: string;
    phone: string;
    website: string;
    taxId: string;
    bank_token?: string;
    // Campos específicos para requisitos de Stripe
    business_type?: string;
    external_account?: string;
    tos_acceptance_date?: number;
    tos_acceptance_ip?: string;
    // Información del representante
    representative?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dob: {
        day: number;
        month: number;
        year: number;
      };
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
      identificationNumber: string;
    };
    // Permite campos dinámicos para otros requisitos de Stripe
    [key: string]: any;
  }>({
    businessName: "",
    businessType: "individual",
    email: "",
    phone: "",
    website: "",
    taxId: "",
  });

  // Nuevo estado para documentación
  const [bankingDocuments, setBankingDocuments] = useState<File[]>([]);
  const [documentationError, setDocumentationError] = useState<string | null>(
    null
  );

  // Función para validar la dirección legal
  const validateLegalAddress = (address: any) => {
    if (!address) return false;
    return (
      address.country === "CR" &&
      address.line1 &&
      address.city &&
      address.state &&
      address.postal_code
    );
  };

  // Función para validar la documentación bancaria
  const validateBankingDocuments = () => {
    if (agencyData?.pais === "CR" && agencyData?.bank_country === "US") {
      if (bankingDocuments.length === 0) {
        setDocumentationError(
          "Se requieren documentos que vinculen la cuenta bancaria con la empresa"
        );
        return false;
      }
    }
    setDocumentationError(null);
    return true;
  };

  useEffect(() => {
    if (!agencyId || agencyId === "null" || agencyId === "undefined") {
      setError("No se proporcionó ID de agencia válido");
      setLoading(false);
      return;
    }

    // Verificar que el ID sea numérico
    if (isNaN(Number(agencyId))) {
      setError(`ID de agencia inválido: ${agencyId}`);
      setLoading(false);
      return;
    }

    async function loadAgencyData() {
      try {
        // Cargar datos de la agencia con todos los campos necesarios
        const { data, error } = await supabase
          .from("agencias")
          .select(
            `
            id,
            nombre,
            nombre_comercial,
            cedula,
            pais,
            web,
            email_contacto,
            telefono,
            fee
          `
          )
          .eq("id", agencyId)
          .single();

        if (error) {
          setError(`Error al cargar datos de la agencia: ${error.message}`);
          setLoading(false);
          return;
        }

        setAgencyData({
          ...data,
          bank_country: data.pais, // Inicialmente usamos el mismo país
        });
        setLoading(false);

        // Pre-llenar los campos con la información de la agencia
        setBusinessDetails((prev) => ({
          ...prev,
          businessName: data.nombre || "",
          businessType: "company", // Valor por defecto
          email: data.email_contacto || "",
          phone: data.telefono || "",
          website: data.web || "",
          taxId: data.cedula?.toString() || "",
          // Campos específicos para requisitos de Stripe
          business_type: "company",
          // Información del representante
          representative: {
            firstName: "", // Estos campos se llenarán en el formulario
            lastName: "",
            email: data.email_contacto || "",
            phone: data.telefono || "",
            dob: {
              day: 1,
              month: 1,
              year: 1990,
            },
            address: {
              line1: "",
              line2: "",
              city: "",
              state: "",
              postal_code: "",
              country: data.pais || "",
            },
            identificationNumber: "",
          },
        }));
      } catch (e: any) {
        setError(e.message || "Error inesperado al cargar datos");
        setLoading(false);
      }
    }

    loadAgencyData();
  }, [agencyId, router]);

  // Iniciar la creación de la cuenta de Stripe
  async function createStripeAccount() {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!agencyId) {
        setError("ID de agencia no encontrado");
        setIsSubmitting(false);
        return;
      }

      // Validar que el país de constitución sea Costa Rica
      if (agencyData?.pais !== "CR") {
        setError("La cuenta Stripe debe estar registrada en Costa Rica");
        setIsSubmitting(false);
        return;
      }

      // Validar documentación para cuentas bancarias internacionales
      if (!validateBankingDocuments()) {
        setIsSubmitting(false);
        return;
      }

      const agencyIdNumber = Number(agencyId);
      if (isNaN(agencyIdNumber)) {
        setError(`ID de agencia inválido: ${agencyId}`);
        setIsSubmitting(false);
        return;
      }

      // Crear cuenta de Stripe con país CR
      const result = await createStripeAccountAction(
        agencyIdNumber,
        "CR" // Forzar país CR para la cuenta Stripe
      );

      if (result.error) {
        // Manejar errores específicos de Stripe
        if (
          result.error.includes(
            "Address for business must match account country"
          )
        ) {
          setError("La dirección legal debe estar en Costa Rica");
        } else {
          setError(result.error);
        }
        setIsSubmitting(false);
        return;
      }

      // Actualizar estados con la información de la cuenta Stripe
      setStripeAccountId(result.stripeAccountId || "");
      setRequiredFields(result.requiredFields || []);

      // Guardar los requisitos pendientes de Stripe
      if (result.stripeRequirements) {
        setStripeRequirements(result.stripeRequirements.currently_due);
      }

      setStep("details");
      setIsSubmitting(false);

      // Pre-llenar algunos campos con la información de la agencia
      setBusinessDetails((prev) => ({
        ...prev,
        businessName: agencyData?.nombre || "",
        email: agencyData?.email_contacto || "",
        // Aseguramos que la dirección legal coincida con el país de constitución
        representative: {
          ...prev.representative!,
          address: {
            ...prev.representative!.address,
            country: "CR", // Forzar país CR para la dirección legal
          },
        },
      }));
    } catch (e: any) {
      setError(e.message || "Error inesperado al crear la cuenta de Stripe");
      setIsSubmitting(false);
    }
  }

  // Modificar handleSubmitDetails para asegurar consistencia en el nombre de la empresa
  async function handleSubmitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!agencyId) {
        setError("ID de agencia no encontrado");
        setIsSubmitting(false);
        return;
      }

      const agencyIdNumber = Number(agencyId);
      if (isNaN(agencyIdNumber)) {
        setError(`ID de agencia inválido para procesar: ${agencyId}`);
        setIsSubmitting(false);
        return;
      }

      // Validar la dirección legal aquí, cuando el usuario ha ingresado los datos
      if (!validateLegalAddress(businessDetails.representative?.address)) {
        setError("La dirección legal debe estar en Costa Rica y ser válida");
        setIsSubmitting(false);
        return;
      }

      // Verificar campos requeridos
      for (const field of requiredFields) {
        // @ts-ignore
        if (!businessDetails[field]) {
          setError(`El campo ${field} es requerido`);
          setIsSubmitting(false);
          return;
        }
      }

      // Validar documentación para cuentas bancarias internacionales
      if (
        agencyData?.bank_country === "US" &&
        (!bankingDocuments || bankingDocuments.length === 0)
      ) {
        setError(
          "Se requieren documentos que vinculen la cuenta bancaria con la empresa"
        );
        setIsSubmitting(false);
        return;
      }

      // Parsear el token bancario para asegurar que los datos sean consistentes
      let bankTokenData;
      try {
        bankTokenData = JSON.parse(businessDetails.bank_token || "{}");
      } catch (e) {
        setError("Error al procesar la información bancaria");
        setIsSubmitting(false);
        return;
      }

      // Validar que el token bancario tenga los datos correctos
      if (
        !bankTokenData.token ||
        !bankTokenData.country ||
        !bankTokenData.account_holder_type
      ) {
        setError("La información bancaria está incompleta");
        setIsSubmitting(false);
        return;
      }

      // Validar que el tipo de cuenta sea "company" para cuentas en US
      if (
        agencyData?.bank_country === "US" &&
        bankTokenData.account_holder_type !== "company"
      ) {
        setError(
          "Para cuentas en Estados Unidos, solo se permiten cuentas empresariales"
        );
        setIsSubmitting(false);
        return;
      }

      // Validar que el nombre de la empresa coincida exactamente
      if (
        agencyData?.bank_country === "US" &&
        bankTokenData.account_holder_name !== businessDetails.businessName
      ) {
        setError(
          "El nombre del titular de la cuenta bancaria debe coincidir exactamente con el nombre legal de la empresa"
        );
        setIsSubmitting(false);
        return;
      }

      // Asegurar que el país bancario coincida con el token
      if (bankTokenData.country !== agencyData?.bank_country) {
        setError("El país de la cuenta bancaria no coincide con la selección");
        setIsSubmitting(false);
        return;
      }

      // Completar la configuración de Stripe
      const result = await completeStripeSetupAction(
        agencyIdNumber,
        stripeAccountId,
        {
          ...businessDetails,
          countryCode: "CR", // Forzar país CR para la cuenta Stripe
          bankCountry: agencyData?.bank_country, // Usar el país bancario seleccionado
          bankingDocuments: bankingDocuments,
          // Incluir información adicional para validación
          business_details: {
            name: businessDetails.businessName, // Usar el nombre exacto de la empresa
            tax_id: businessDetails.taxId,
            type: "company",
            address: {
              country: "CR",
              line1: businessDetails.representative?.address.line1,
              city: businessDetails.representative?.address.city,
              state: businessDetails.representative?.address.state,
              postal_code: businessDetails.representative?.address.postal_code,
            },
          },
          // Incluir información del representante legal
          representative: {
            ...businessDetails.representative,
            address: {
              ...businessDetails.representative?.address,
              country: "CR",
            },
          },
        }
      );

      if (result.error) {
        // Manejar errores específicos de Stripe
        if (
          result.error.includes(
            "Address for business must match account country"
          )
        ) {
          setError("La dirección legal debe estar en Costa Rica");
        } else if (result.error.includes("bank account")) {
          setError(
            "La cuenta bancaria debe estar vinculada legalmente a la empresa. Por favor, asegúrate de que el nombre del titular coincida exactamente con el nombre legal de la empresa y que hayas subido la documentación requerida."
          );
        } else {
          setError(result.error);
        }
        setIsSubmitting(false);
        return;
      }

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Error inesperado al completar la configuración");
      setIsSubmitting(false);
    }
  }

  // Handle bank token
  const handleBankToken = (tokenData: string) => {
    setBusinessDetails((prev) => ({
      ...prev,
      bank_token: tokenData,
    }));
  };

  // Pantalla de carga
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );

  // Pantalla de error
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );

  // Paso 1: Introducción y creación de cuenta Stripe
  if (step === "intro") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-full max-w-[700px] px-[50px] py-10 bg-white rounded-[16px] shadow-md">
          <Typography
            variant="h4"
            sx={{ fontWeight: "500", textAlign: "center" }}
          >
            Configuración de tu cuenta
          </Typography>

          <div className="mt-6 space-y-6">
            <div>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                País de constitución de la empresa
              </Typography>
              <Typography variant="body2" className="text-gray-600 mb-2">
                La empresa debe estar legalmente constituida en Costa Rica. La
                dirección legal debe coincidir con este país.
              </Typography>
              <select
                name="businessCountry"
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                value={agencyData?.pais || "CR"}
                disabled={true} // Forzar CR
              >
                <option value="CR">Costa Rica</option>
              </select>
            </div>

            <div>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                País de la cuenta bancaria
              </Typography>
              <Typography variant="body2" className="text-gray-600 mb-2">
                Selecciona el país donde está domiciliada la cuenta bancaria
                donde recibirás los pagos. La cuenta bancaria debe coincidir con
                el país de constitución de la empresa.
              </Typography>
              <select
                name="bankCountry"
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                value={
                  agencyData?.pais === "CR"
                    ? "CR"
                    : agencyData?.bank_country || ""
                }
                onChange={(e) => {
                  setAgencyData((prev: any) => ({
                    ...prev,
                    bank_country: e.target.value,
                  }));
                }}
                disabled={agencyData?.pais === "CR"}
              >
                <option value="">Selecciona un país</option>
                <option value="CR">Costa Rica</option>
                {agencyData?.pais !== "CR" && (
                  <option value="US">Estados Unidos</option>
                )}
              </select>
            </div>

            {agencyData?.bank_country === "US" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <Typography
                  variant="subtitle2"
                  className="text-blue-800 font-medium mb-2"
                >
                  Cuenta bancaria en Estados Unidos
                </Typography>
                <Typography variant="body2" className="text-blue-700">
                  Para usar una cuenta bancaria en Estados Unidos, necesitarás
                  proporcionar:
                </Typography>
                <ul className="list-disc list-inside mt-2 text-blue-700">
                  <li>
                    Documentos de constitución de la empresa en Costa Rica
                  </li>
                  <li>
                    Documentación que demuestre la propiedad de la cuenta
                    bancaria en EE.UU.
                  </li>
                  <li>Certificación de firma bancaria</li>
                  <li>
                    Documentos que vinculen legalmente la empresa con la cuenta
                    bancaria
                  </li>
                </ul>
                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setBankingDocuments(files);
                    }}
                    className="w-full"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {documentationError && (
                    <Typography variant="body2" className="text-red-600 mt-2">
                      {documentationError}
                    </Typography>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={createStripeAccount}
            disabled={isSubmitting || !agencyData?.bank_country}
            className="w-full mt-7"
            variant="orange"
          >
            {isSubmitting ? "Creando cuenta..." : "Continuar"}
          </Button>

          <Typography
            variant="body2"
            className="mt-6 text-gray-500 text-center"
          >
            Paso 1 de 3: Después de seleccionar los países, necesitarás
            proporcionar más detalles.
          </Typography>
        </div>
      </div>
    );
  }

  // Paso 2: Completar detalles de la cuenta
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-[700px] px-[50px] py-10 bg-white rounded-[16px] shadow-md">
        <Typography
          variant="h4"
          sx={{ fontWeight: "500", textAlign: "center" }}
        >
          Información del representante legal
        </Typography>

        {/* <div className="mb-6">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <Typography variant="body1" className="text-green-700 font-medium">
              Cuenta de Stripe creada exitosamente!
            </Typography>
            <Typography variant="body2" className="text-green-600 mt-1">
              ID: {stripeAccountId}
            </Typography>
          </div>
        </div> */}

        <form onSubmit={handleSubmitDetails} className="mt-6">
          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                Nombre
              </Typography>
              <TextField
                name="representative.firstName"
                label="Nombre"
                variant="outlined"
                required
                fullWidth
                value={businessDetails.representative?.firstName || ""}
                onChange={(e) => {
                  setBusinessDetails((prev) => ({
                    ...prev,
                    representative: {
                      ...prev.representative!,
                      firstName: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="w-1/2">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                Apellido
              </Typography>
              <TextField
                name="representative.lastName"
                label="Apellido"
                variant="outlined"
                required
                fullWidth
                value={businessDetails.representative?.lastName || ""}
                onChange={(e) => {
                  setBusinessDetails((prev) => ({
                    ...prev,
                    representative: {
                      ...prev.representative!,
                      lastName: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                Número de identificación (Cédula)
              </Typography>
              <TextField
                name="representative.identificationNumber"
                label="Cédula"
                variant="outlined"
                required
                fullWidth
                value={
                  businessDetails.representative?.identificationNumber || ""
                }
                onChange={(e) => {
                  setBusinessDetails((prev) => ({
                    ...prev,
                    representative: {
                      ...prev.representative!,
                      identificationNumber: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="w-1/2">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                Fecha de nacimiento
              </Typography>
              <DatePicker
                label="Fecha de nacimiento"
                value={birthDate}
                onChange={(date) => {
                  setBirthDate(date);
                  if (date) {
                    setBusinessDetails((prev) => ({
                      ...prev,
                      representative: {
                        ...prev.representative!,
                        dob: {
                          day: date.getDate(),
                          month: date.getMonth() + 1,
                          year: date.getFullYear(),
                        },
                      },
                    }));
                  }
                }}
              />
            </div>
          </div>

          <div className="mb-4">
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "500" }}
              className="pb-1"
            >
              Dirección
            </Typography>
            <TextField
              name="representative.address.line1"
              label="Dirección"
              variant="outlined"
              required
              fullWidth
              value={businessDetails.representative?.address.line1 || ""}
              onChange={(e) => {
                setBusinessDetails((prev) => ({
                  ...prev,
                  representative: {
                    ...prev.representative!,
                    address: {
                      ...prev.representative!.address,
                      line1: e.target.value,
                    },
                  },
                }));
              }}
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                Ciudad
              </Typography>
              <TextField
                name="representative.address.city"
                label="Ciudad"
                variant="outlined"
                required
                fullWidth
                value={businessDetails.representative?.address.city || ""}
                onChange={(e) => {
                  setBusinessDetails((prev) => ({
                    ...prev,
                    representative: {
                      ...prev.representative!,
                      address: {
                        ...prev.representative!.address,
                        city: e.target.value,
                      },
                    },
                  }));
                }}
              />
            </div>
            <div className="w-1/2">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "500" }}
                className="pb-1"
              >
                Estado/Provincia
              </Typography>
              <TextField
                name="representative.address.state"
                label="Estado/Provincia"
                variant="outlined"
                required
                fullWidth
                value={businessDetails.representative?.address.state || ""}
                onChange={(e) => {
                  setBusinessDetails((prev) => ({
                    ...prev,
                    representative: {
                      ...prev.representative!,
                      address: {
                        ...prev.representative!.address,
                        state: e.target.value,
                      },
                    },
                  }));
                }}
              />
            </div>
          </div>

          <div className="mb-4">
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "500" }}
              className="pb-1"
            >
              Código postal
            </Typography>
            <TextField
              name="representative.address.postal_code"
              label="Código postal"
              variant="outlined"
              required
              fullWidth
              value={businessDetails.representative?.address.postal_code || ""}
              onChange={(e) => {
                setBusinessDetails((prev) => ({
                  ...prev,
                  representative: {
                    ...prev.representative!,
                    address: {
                      ...prev.representative!.address,
                      postal_code: e.target.value,
                    },
                  },
                }));
              }}
            />
          </div>

          {/* Campos para la información de la cuenta bancaria */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md space-y-4">
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "500" }}
              className="text-blue-800"
            >
              Información de la cuenta bancaria:
            </Typography>
            <BankAccountForm
              onTokenGenerated={handleBankToken}
              countryCode={agencyData?.bank_country || "CR"}
              agencyId={agencyId || ""}
              businessName={agencyData?.nombre || ""}
              representativeData={{
                firstName: businessDetails.representative?.firstName || "",
                lastName: businessDetails.representative?.lastName || "",
                dob: businessDetails.representative?.dob || {
                  day: 1,
                  month: 1,
                  year: 1990,
                },
                identificationNumber:
                  businessDetails.representative?.identificationNumber || "",
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-7"
            variant="orange"
          >
            {isSubmitting ? "Procesando..." : "Completar configuración"}
          </Button>

          <Typography
            variant="body2"
            className="mt-6 text-gray-500 text-center"
          >
            Paso 2 de 2: Una vez completada la configuración, tendrás acceso
            completo a tu panel de control.
          </Typography>
        </form>
      </div>
    </div>
  );
}

export default function StripeSetup() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Suspense fallback={<LoadingFallback />}>
        <StripeSetupContent />
      </Suspense>
    </LocalizationProvider>
  );
}
