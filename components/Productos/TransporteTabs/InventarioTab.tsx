"use client";
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
} from "@mui/material";
import { useState, useEffect } from "react";

interface Horario {
  hora_salida: string;
  hora_llegada: string;
}

interface TransporteState {
  titulo: string;
  direccion: string;
  precio: number;
  cupo_maximo: number;
  limite_horario: boolean;
  limite_horas: number;
  horarios: Horario[];
  mensaje: string;
  actividad_ids: number[];
}

interface InventarioTabProps {
  transporteData: TransporteState;
  setTransporteData: React.Dispatch<React.SetStateAction<TransporteState>>;
}

const InventarioTab = ({
  transporteData,
  setTransporteData,
}: InventarioTabProps) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: number) => {
    const newErrors = { ...errors };

    if (name === "cupo_maximo") {
      if (value < 0) {
        newErrors.cupo_maximo = "El cupo no puede ser negativo";
      } else {
        delete newErrors.cupo_maximo; // 🔹 Elimina el paréntesis extra
      }
    }

    if (name === "limite_horas") {
      if (value < 1 || value > 24) {
        newErrors.limite_horas = "Debe ser entre 1 y 24 horas";
      } else {
        delete newErrors.limite_horas; // 🔹 Elimina el paréntesis extra
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNumberChange = (name: string, value: string) => {
    const numericValue = parseInt(value) || 0;

    setTransporteData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));

    validateField(name, numericValue);
  };

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Typography variant="h6">Configuración de Inventario</Typography>

      {/* Capacidad máxima */}
      <TextField
        fullWidth
        label="Capacidad máxima"
        type="number"
        value={transporteData.cupo_maximo}
        onChange={(e) => handleNumberChange("cupo_maximo", e.target.value)}
        error={!!errors.cupo_maximo}
        helperText={errors.cupo_maximo}
        InputProps={{
          inputProps: {
            min: 0,
            step: 1,
          },
        }}
      />

      {/* Límite de reservas */}
      <FormControlLabel
        control={
          <Switch
            checked={transporteData.limite_horario}
            onChange={(e) =>
              setTransporteData((prev) => ({
                ...prev,
                limite_horario: e.target.checked,
                ...(!e.target.checked && { limite_horas: 0 }),
              }))
            }
            color="primary"
          />
        }
        label={
          <Box>
            <Typography>Limitar reservas previas al horario</Typography>
            <Typography variant="caption" color="text.secondary">
              Habilitar límite de tiempo para reservas
            </Typography>
          </Box>
        }
        sx={{ alignItems: "flex-start" }}
      />

      {transporteData.limite_horario && (
        <TextField
          fullWidth
          label="Horas mínimas antes del transporte"
          type="number"
          value={transporteData.limite_horas}
          onChange={(e) => handleNumberChange("limite_horas", e.target.value)}
          error={!!errors.limite_horas}
          helperText={errors.limite_horas || "Máximo 24 horas"}
          InputProps={{
            inputProps: {
              min: 1,
              max: 24,
              step: 1,
            },
            endAdornment: (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                horas antes
              </Typography>
            ),
          }}
        />
      )}

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Corrige los errores antes de continuar
        </Alert>
      )}
    </Stack>
  );
};

export default InventarioTab;
