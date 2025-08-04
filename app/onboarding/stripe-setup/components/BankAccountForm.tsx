import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Typography } from "@mui/material";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface BankAccountFormProps {
  onTokenGenerated: (token: string) => void;
  countryCode: string;
  agencyId: string;
  businessName: string;
  representativeData: {
    firstName: string;
    lastName: string;
    dob: {
      day: number;
      month: number;
      year: number;
    };
    identificationNumber: string;
  };
}

export default function BankAccountForm({
  onTokenGenerated,
  countryCode,
  agencyId,
  businessName,
  representativeData,
}: BankAccountFormProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState(businessName);
  const [accountType, setAccountType] = useState<"individual" | "company">(
    "company"
  );
  const [currency, setCurrency] = useState<"USD" | "CRC">(
    countryCode === "US" ? "USD" : "CRC"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankCountry, setBankCountry] = useState<"US" | "CR">("CR");
  const [legalConfirmation, setLegalConfirmation] = useState(false);
  const [bankingDocuments, setBankingDocuments] = useState<File[]>([]);
  const [documentationError, setDocumentationError] = useState<string | null>(
    null
  );

  // Actualizar la moneda cuando cambia el país
  useEffect(() => {
    setCurrency(countryCode === "US" ? "USD" : "CRC");
  }, [countryCode]);

  // Validar documentación bancaria
  const validateBankingDocuments = () => {
    if (bankCountry === "US") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setDocumentationError(null);

    try {
      // Validar documentación para cuentas en US
      if (bankCountry === "US" && !validateBankingDocuments()) {
        setIsSubmitting(false);
        return;
      }

      // Validar confirmación legal para cuentas en US
      if (bankCountry === "US" && !legalConfirmation) {
        setError(
          "Debes confirmar que la cuenta bancaria es propiedad legal de la empresa"
        );
        setIsSubmitting(false);
        return;
      }

      // Para cuentas en US, forzar tipo de cuenta como "company"
      if (bankCountry === "US") {
        setAccountType("company");
      }

      // Validar que el nombre del titular coincida con el tipo de cuenta
      if (accountType === "company") {
        // Para cuentas empresariales, el nombre debe ser exactamente el de la empresa
        if (accountHolderName !== businessName) {
          setError(
            `El nombre del titular debe coincidir exactamente con el nombre legal de la empresa: ${businessName}`
          );
          setIsSubmitting(false);
          return;
        }
      } else {
        // Para cuentas personales, el nombre debe ser el del representante legal
        const fullName = `${representativeData.firstName} ${representativeData.lastName}`;
        if (accountHolderName !== fullName) {
          setError(
            "El nombre del titular debe coincidir exactamente con el representante legal"
          );
          setIsSubmitting(false);
          return;
        }
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      // Preparar datos según el tipo de cuenta
      let bankAccountData: any = {
        country: bankCountry,
        currency: bankCountry === "CR" ? "crc" : "usd",
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        account_holder_type: accountType,
      };

      // Solo agregar routing_number para cuentas en US
      if (bankCountry === "US") {
        if (!routingNumber) {
          throw new Error(
            "El número de ruta es requerido para cuentas en Estados Unidos"
          );
        }
        bankAccountData.routing_number = routingNumber;
      }

      const { token, error } = await stripe.createToken(
        "bank_account",
        bankAccountData
      );

      if (error) {
        console.error("[BankAccountForm] Error de Stripe:", error);
        // Manejar errores específicos de Stripe
        if (error.code === "invalid_bank_account") {
          throw new Error(
            "La cuenta bancaria no es válida. Por favor, verifica los datos."
          );
        } else if (error.code === "invalid_account_holder_name") {
          throw new Error(
            "El nombre del titular debe coincidir exactamente con el nombre legal de la empresa"
          );
        } else {
          throw new Error(error.message);
        }
      }

      if (token) {
        // Preparar datos según el tipo de cuenta
        const tokenData = {
          token: token.id,
          country: bankCountry,
          currency: bankCountry === "CR" ? "crc" : "usd",
          account_holder_type: accountType,
          account_holder_name: accountHolderName,
          // Incluir información adicional para validación
          business_details:
            accountType === "company"
              ? {
                  name: accountHolderName,
                  type: "company",
                }
              : undefined,
          // Solo incluir datos individuales si es una cuenta personal
          ...(accountType === "individual" && {
            individual: {
              first_name: representativeData.firstName,
              last_name: representativeData.lastName,
              dob: representativeData.dob,
              id_number: representativeData.identificationNumber,
              id_number_type: "pan",
            },
          }),
          // Incluir información de documentación para cuentas en US
          ...(bankCountry === "US" && {
            banking_documents: bankingDocuments,
          }),
        };

        onTokenGenerated(JSON.stringify(tokenData));
      }
    } catch (err: any) {
      console.error("Error en el proceso de tokenización:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="bankCountry" className="block font-medium">
          País de la cuenta bancaria *
        </label>
        <select
          id="bankCountry"
          value={bankCountry}
          onChange={(e) => {
            const newCountry = e.target.value as "US" | "CR";
            setBankCountry(newCountry);
            // Forzar tipo de cuenta como "company" para US
            if (newCountry === "US") {
              setAccountType("company");
              setAccountHolderName(businessName);
            }
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        >
          <option value="CR">Costa Rica</option>
          <option value="US">Estados Unidos</option>
        </select>
        <p className="text-sm text-gray-500">
          Seleccione el país donde se encuentra la cuenta bancaria
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="accountHolderName" className="block font-medium">
          Nombre del titular de la cuenta *
        </label>
        <input
          id="accountHolderName"
          type="text"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
          placeholder={
            accountType === "company"
              ? businessName
              : `${representativeData.firstName} ${representativeData.lastName}`
          }
          disabled={bankCountry === "US"} // Deshabilitar edición para cuentas en US
        />
        <p className="text-sm text-gray-500">
          {accountType === "company"
            ? `Debe coincidir exactamente con el nombre legal de la empresa: ${businessName}`
            : "Debe coincidir con el nombre del representante legal"}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="accountNumber" className="block font-medium">
          Número de cuenta *
        </label>
        <input
          id="accountNumber"
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {bankCountry === "US" && (
        <>
          <div className="space-y-2">
            <label htmlFor="routingNumber" className="block font-medium">
              Número de ruta (ABA) *
            </label>
            <input
              id="routingNumber"
              type="text"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <p className="text-sm text-gray-500">
              Ingrese el número de ruta ABA de 9 dígitos
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Typography
              variant="subtitle2"
              className="text-blue-800 font-medium mb-2"
            >
              Documentación requerida para cuenta en EE.UU.
            </Typography>
            <Typography variant="body2" className="text-blue-700">
              Para usar una cuenta bancaria en Estados Unidos, necesitarás
              proporcionar:
            </Typography>
            <ul className="list-disc list-inside mt-2 text-blue-700">
              <li>Documentos de constitución de la empresa en Costa Rica</li>
              <li>
                Documentación que demuestre la propiedad de la cuenta bancaria
                en EE.UU.
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

          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={legalConfirmation}
                onChange={(e) => setLegalConfirmation(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                Confirmo que esta cuenta bancaria es propiedad legal de la
                empresa registrada en Costa Rica y que he proporcionado toda la
                documentación requerida
              </span>
            </label>
          </div>
        </>
      )}

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
      >
        {isSubmitting ? "Procesando..." : "Guardar información bancaria"}
      </button>
    </div>
  );
}
