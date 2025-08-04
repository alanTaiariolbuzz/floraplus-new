"use client";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Stack,
  InputAdornment,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRef, useState } from "react";

interface MensajeTabProps {
  transporteData: {
    mensaje: string;
  };
  setTransporteData: React.Dispatch<
    React.SetStateAction<{
      mensaje: string;
    }>
  >;
}

const variables = [
  {
    label: "Nombre del cliente",
    value: "/«NombreClient»",
    description: "Nombre completo del cliente",
  },
  {
    label: "Código de reserva",
    value: "/«CodigoReserva»",
    description: "Código único de reserva",
  },
  {
    label: "Total pago",
    value: "/«MontoTotal»",
    description: "Monto total de la reserva",
  },
  {
    label: "Participantes",
    value: "/«Participantes»",
    description: "Número de personas en la reserva",
  },
  {
    label: "Teléfono contacto",
    value: "/«TelefonoContacto»",
    description: "Teléfono de contacto de la empresa",
  },
  {
    label: "Correo contacto",
    value: "/«CorreoContacto»",
    description: "Correo electrónico de contacto",
  },
  {
    label: "Nombre comercial",
    value: "/«NombreComercial»",
    description: "Nombre de la empresa o marca",
  },
];

const MensajeTab = ({ transporteData, setTransporteData }: MensajeTabProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInsertVariable = (variableValue: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    const newValue =
      transporteData.mensaje.substring(0, start) +
      variableValue +
      transporteData.mensaje.substring(end);

    setTransporteData((prev) => ({
      ...prev,
      mensaje: newValue,
    }));

    // Mantener el foco y posición del cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + variableValue.length,
          start + variableValue.length
        );
      }
    }, 0);
  };

  const validateMessage = () => {
    if (!transporteData.mensaje.trim()) {
      setError("El mensaje no puede estar vacío");
      return false;
    }
    setError("");
    return true;
  };

  const handleCopyTemplate = () => {
    const template = `¡Hola /«NombreClient»! 

¡Gracias por reservar con nosotros! Tu actividad está confirmada.

Estos son los detalles de tu reserva:

**Código de reserva:** /«CodigoReserva»
**Fecha y hora:** [Fecha y hora de la actividad]
**Participantes:** /«Participantes»

**Precio total:** /«MontoTotal»

Por favor, llega **15 minutos antes de la hora de inicio**.

**¿Necesitas hacer cambios?**
Puedes contactarnos al /«TelefonoContacto» o escribirnos a /«CorreoContacto».
Consulta nuestras políticas de cancelación en nuestra página web.

¡Te esperamos pronto!
/«NombreComercial»

P.D.: Presenta este correo junto con una identificación con foto al llegar.`;

    setTransporteData((prev) => ({ ...prev, mensaje: template }));
    setSuccess("Plantilla copiada con éxito");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Typography variant="h6">Configuración del Mensaje</Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        multiline
        minRows={6}
        fullWidth
        value={transporteData.mensaje}
        onChange={(e) => {
          setTransporteData((prev) => ({ ...prev, mensaje: e.target.value }));
          validateMessage();
        }}
        onBlur={validateMessage}
        placeholder="Ej: ¡Hola /«NombreClient»! Tu actividad está confirmada. Código: /«CodigoReserva», Participantes: /«Participantes», Total: /«MontoTotal»..."
        inputRef={textareaRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <InfoIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle2" gutterBottom>
            Variables disponibles:
          </Typography>

          <Tooltip title="Usar plantilla ejemplo">
            <IconButton onClick={handleCopyTemplate} color="primary">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {variables.map((variable) => (
            <Tooltip key={variable.value} title={variable.description}>
              <Chip
                label={variable.label}
                onClick={() => handleInsertVariable(variable.value)}
                variant="outlined"
                color="primary"
                sx={{
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "primary.light" },
                }}
              />
            </Tooltip>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Variables dinámicas se actualizarán automáticamente
        </Typography>
      </Box>
    </Stack>
  );
};

export default MensajeTab;
