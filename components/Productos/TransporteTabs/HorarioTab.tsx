"use client";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

interface HorarioTransporte {
  hora_salida: string;
  hora_llegada: string;
}

interface HorarioTabProps {
  horarios: HorarioTransporte[];
  onHorariosChange: (horarios: HorarioTransporte[]) => void;
  modoEdicion?: boolean;
}

const HorarioTab = ({
  horarios = [],
  onHorariosChange,
  modoEdicion,
}: HorarioTabProps) => {
  const [showForm, setShowForm] = useState(horarios.length === 0);
  const [formData, setFormData] = useState<HorarioTransporte>({
    hora_salida: "",
    hora_llegada: "",
  });
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (modoEdicion) {
      setShowForm(horarios.length === 0);
    }
  }, [horarios, modoEdicion]);

  const validateTimeFormat = (time: string) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const handleSave = () => {
    if (!validateTimeFormat(formData.hora_salida)) {
      setError("Formato de hora salida inválido (HH:MM)");
      return;
    }

    if (!validateTimeFormat(formData.hora_llegada)) {
      setError("Formato de hora llegada inválido (HH:MM)");
      return;
    }

    if (formData.hora_llegada <= formData.hora_salida) {
      setError("La hora de llegada debe ser posterior a la salida");
      return;
    }

    const newHorarios = [...horarios];
    if (editingIndex !== null) {
      newHorarios[editingIndex] = formData;
    } else {
      newHorarios.push(formData);
    }

    onHorariosChange(newHorarios);
    setShowForm(false);
    setFormData({ hora_salida: "", hora_llegada: "" });
    setError("");
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    onHorariosChange(horarios.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData(horarios[index]);
    setShowForm(true);
    setError("");
  };

  return (
    <Box>
      {horarios.map((horario, index) => (
        <Box
          key={index}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            p: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
          }}
        >
          <ScheduleIcon color="action" sx={{ fontSize: 40 }} />

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", gap: 3, mb: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Salida
                </Typography>
                <Typography>{horario.hora_salida}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Llegada
                </Typography>
                <Typography>{horario.hora_llegada}</Typography>
              </Box>
            </Box>
          </Box>

          {modoEdicion && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleEdit(index)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(index)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      ))}

      <>
        {showForm && (
          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {editingIndex !== null ? "Editar horario" : "Nuevo horario"}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Hora de salida"
                type="time"
                fullWidth
                value={formData.hora_salida}
                onChange={(e) =>
                  setFormData({ ...formData, hora_salida: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Hora de llegada"
                type="time"
                fullWidth
                value={formData.hora_llegada}
                onChange={(e) =>
                  setFormData({ ...formData, hora_llegada: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: formData.hora_salida,
                }}
              />
            </Box>

            {error && (
              <Typography color="error" variant="caption" sx={{ mb: 1 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(null);
                  setFormData({ hora_salida: "", hora_llegada: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                color="primary"
              >
                {editingIndex !== null ? "Actualizar" : "Guardar"}
              </Button>
            </Box>
          </Box>
        )}

        {!showForm && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setShowForm(true);
              setFormData({ hora_salida: "", hora_llegada: "" });
              setEditingIndex(null);
            }}
            sx={{ mt: 2 }}
          >
            Agregar horario
          </Button>
        )}
      </>
    </Box>
  );
};

export default HorarioTab;
