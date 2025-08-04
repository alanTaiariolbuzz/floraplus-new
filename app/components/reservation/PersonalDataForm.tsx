"use client";

import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { Language } from "../../translations/reservation";
import { matchIsValidTel, MuiTelInput } from "mui-tel-input";

interface PersonalData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  terminos: boolean;
}

interface PersonalDataFormProps {
  onSubmit: (data: PersonalData) => void;
  initialData?: PersonalData | null;
  onValidate?: (validate: () => boolean, getData: () => PersonalData) => void;
  language: Language;
}

export default function PersonalDataForm({
  onSubmit,
  initialData,
  onValidate,
  language,
}: PersonalDataFormProps) {
  const { t } = useTranslation(language);

  const [formData, setFormData] = useState<PersonalData>({
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    email: initialData?.email || "",
    telefono: initialData?.telefono || "",
    terminos: initialData?.terminos || false,
  });

  const [errors, setErrors] = useState<Partial<PersonalData>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<PersonalData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = t("nameRequired");
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = t("lastNameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("emailInvalid");
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = t("phoneRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const getFormData = useCallback(() => formData, [formData]);

  // Exponer la función de validación y los datos al componente padre
  useEffect(() => {
    if (onValidate) {
      onValidate(validateForm, getFormData);
    }
  }, [onValidate, validateForm, getFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario comienza a escribir
    if (errors[name as keyof PersonalData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      telefono: value,
    }));
    // Limpiar error cuando el usuario comienza a escribir
    if (errors.telefono) {
      setErrors((prev) => ({
        ...prev,
        telefono: undefined,
      }));
    }
  };

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos = 600 segundos

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Formatear minutos y segundos (ej: 09:58)
  const formatTime = (seconds: number) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {/* Real timer of 10 minutes */}

        <h2 className="calendar-header font-medium text-base leading-6 tracking-[0.15px]">
          {t("enterYourData")}
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <TextField
            name="nombre"
            label={t("name")}
            variant="outlined"
            size="medium"
            value={formData.nombre}
            onChange={handleChange}
            error={!!errors.nombre}
            helperText={errors.nombre}
            style={{
              width: "100%",
              borderRadius: "4px",
            }}
          />

          <TextField
            name="apellido"
            label={t("lastName")}
            variant="outlined"
            size="medium"
            value={formData.apellido}
            onChange={handleChange}
            error={!!errors.apellido}
            helperText={errors.apellido}
            style={{
              width: "100%",
              borderRadius: "4px",
            }}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <TextField
            name="email"
            label={t("emailLabel")}
            variant="outlined"
            size="medium"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            style={{
              width: "100%",
              borderRadius: "4px",
            }}
          />

          <Box sx={{ width: "100%" }}>
            <MuiTelInput
              label={t("phoneLabel")}
              value={formData.telefono}
              onChange={handlePhoneChange}
              defaultCountry="CR"
              preferredCountries={["CR"]}
              fullWidth
              error={!!errors.telefono}
              helperText={errors.telefono}
              forceCallingCode
              langOfCountryName="es"
              size="medium"
            />
          </Box>
        </div>
        {/* Only visual the checkbox */}
        <div className="flex flex-row gap-2 items-center"></div>
      </div>
      <p className="text-xs text-[#616161]">
        {t("termsAndConditionsText")}{" "}
        <a
          href={
            language === "en"
              ? "https://getfloraplus.com/terms-of-service/"
              : "https://getfloraplus.com/terminos-y-condiciones/"
          }
          className="underline"
          target="_blank"
        >
          {t("termsAndConditions")}
        </a>{" "}
        {t("and")}
        &nbsp;
        <a
          href={
            language === "en"
              ? "https://getfloraplus.com/privacy-policy/"
              : "https://getfloraplus.com/politica-de-privacidad/"
          }
          className="underline"
          target="_blank"
        >
          {t("privacyPolicy")}
        </a>{" "}
        {t("ofFloraPlus")}
      </p>
    </div>
  );
}
