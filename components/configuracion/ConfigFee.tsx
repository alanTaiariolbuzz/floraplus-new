import {
  Typography,
  TextField,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Button,
  Alert,
} from "@mui/material";
import { useState, useEffect } from "react";

interface AgencyData {
  id: number;
  tax: number | null;
  convenience_fee_fijo: boolean;
  convenience_fee_fijo_valor: number | null;
  convenience_fee_variable: boolean | null;
  convenience_fee_variable_valor: number | null;
}

// Función para obtener el token CSRF de las cookies
const getCsrfToken = (): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("csrf_token=")
  );

  if (csrfCookie) {
    return csrfCookie.split("=")[1];
  }

  return null;
};

export const ConfigFee = () => {
  const [feeType, setFeeType] = useState<"variable" | "fixed">("variable");
  const [tax, setTax] = useState("");
  const [convenienceFeeValue, setConvenienceFeeValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agencyId, setAgencyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Cargar datos de la agencia
  useEffect(() => {
    const loadAgencyData = async () => {
      setLoading(true);
      try {
        const csrfToken = getCsrfToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (csrfToken) {
          headers["x-csrf-token"] = csrfToken;
        }

        const response = await fetch("/api/agencias", {
          headers,
        });
        const result = await response.json();

        if (result.code === 200 && result.data.length > 0) {
          const agency = result.data[0] as AgencyData;
          setAgencyId(agency.id);

          // Cargar tax
          setTax(agency.tax?.toString() || "");

          // Determinar tipo de fee y cargar valor
          if (agency.convenience_fee_fijo) {
            setFeeType("fixed");
            setConvenienceFeeValue(
              agency.convenience_fee_fijo_valor?.toString() || ""
            );
          } else if (agency.convenience_fee_variable) {
            setFeeType("variable");
            setConvenienceFeeValue(
              agency.convenience_fee_variable_valor?.toString() || ""
            );
          }
        }
      } catch (error) {
        console.error("Error loading agency data:", error);
        setMessage({
          type: "error",
          text: "Error al cargar los datos de la agencia",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAgencyData();
  }, []);

  const handleFeeTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeeType(event.target.value as "variable" | "fixed");
    setConvenienceFeeValue(""); // Reset value when changing type
  };

  const handleSave = async () => {
    if (!agencyId) {
      setMessage({ type: "error", text: "ID de agencia no encontrado" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      const response = await fetch(`/api/agencias?id=${agencyId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          tax: tax ? parseFloat(tax) : null,
          convenience_fee_fijo: feeType === "fixed",
          convenience_fee_fijo_valor:
            feeType === "fixed" && convenienceFeeValue
              ? parseFloat(convenienceFeeValue)
              : null,
          convenience_fee_variable: feeType === "variable",
          convenience_fee_variable_valor:
            feeType === "variable" && convenienceFeeValue
              ? parseFloat(convenienceFeeValue)
              : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Configuración guardada exitosamente",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Error al guardar la configuración",
        });
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      setMessage({ type: "error", text: "Error al guardar la configuración" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Impuestos y Fees
        </Typography>
        <Typography>Cargando configuración...</Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
      <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
        Impuestos y Fees
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2, width: "320px" }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tax (%)"
            variant="outlined"
            type="number"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              mt: "-48px",
            }}
          >
            <RadioGroup
              row
              aria-labelledby="fee-type-radio-buttons"
              name="fee-type"
              value={feeType}
              onChange={handleFeeTypeChange}
            >
              <FormControlLabel
                value="variable"
                control={<Radio size="small" />}
                label="Variable (%)"
              />
              <FormControlLabel
                value="fixed"
                control={<Radio size="small" />}
                label="Fijo ($)"
              />
            </RadioGroup>
            <TextField
              fullWidth
              label={
                feeType === "variable"
                  ? "Convenience Fee (%)"
                  : "Convenience Fee ($)"
              }
              variant="outlined"
              type="number"
              value={convenienceFeeValue}
              onChange={(e) => setConvenienceFeeValue(e.target.value)}
              inputProps={{
                min: 0,
                step: 0.01,
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ minWidth: 120 }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </div>
  );
};
