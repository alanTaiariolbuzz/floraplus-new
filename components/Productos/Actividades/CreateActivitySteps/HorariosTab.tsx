"use client";
import {
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Chip,
  InputAdornment,
} from "@mui/material";
import { useState, useEffect } from "react";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
export interface Schedule {
  dia_completo: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
  cupo: number;
  tipo_horario: "especifico" | "rango";
}

interface ScheduleTabProps {
  cronograma?: Schedule[];
  onCronogramaChange: (cronograma: Schedule[]) => void;
}

type TipoHorario = "especifico" | "rango" | "";

const daysMap = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 0,
} as const;

const formatTimeTo12Hour = (time: string) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

type DayKey = keyof typeof daysMap;

const HorariosTab = ({
  cronograma = [], // Valor por defecto
  onCronogramaChange,
}: ScheduleTabProps) => {
  const [showForm, setShowForm] = useState(
    cronograma.length === 0 ? true : false
  );
  const [formData, setFormData] = useState({
    hora_inicio: "",
    hora_fin: "",
    cupo: "",
    dias: [] as number[],
    dia_completo: false,
    tipo_horario: "especifico" as TipoHorario,
  });
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tipoHorarioFijo, setTipoHorarioFijo] = useState<
    "especifico" | "rango" | null
  >(null);
  // Estados para validación visual de campos
  const [fieldErrors, setFieldErrors] = useState({
    hora_inicio: false,
    hora_fin: false,
    cupo: false,
    dias: false,
  });

  useEffect(() => {
    if (cronograma?.length > 0) {
      // Si ya hay horarios guardados, usar el tipo del primer horario
      setTipoHorarioFijo(cronograma[0].tipo_horario);
      setFormData((prev) => ({
        ...prev,
        tipo_horario: cronograma[0].tipo_horario,
      }));
      // Si hay horarios, ocultar el formulario por defecto
      setShowForm(false);
    } else {
      setTipoHorarioFijo(null);
      // Si no hay horarios, mantener "especifico" como valor por defecto
      setFormData((prev) => ({
        ...prev,
        tipo_horario: "especifico",
      }));
      // Si no hay horarios, mostrar el formulario por defecto
      setShowForm(true);
    }
  }, [cronograma]);

  const toggleDay = (day: DayKey) => {
    setFormData((prev) => {
      const isSelected = prev.dias.includes(daysMap[day]);
      const updatedDias = isSelected
        ? prev.dias.filter((d) => d !== daysMap[day]) // Quitamos el día
        : [...prev.dias, daysMap[day]]; // Agregamos el día

      return {
        ...prev,
        dias: updatedDias,
        dia_completo: updatedDias.length === Object.values(daysMap).length, // Si están todos, activamos el toggle
      };
    });
  };

  const toggleAllDays = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      dia_completo: checked,
      dias: checked ? Object.values(daysMap) : [],
    }));
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      hora_inicio: "",
      hora_fin: "",
      cupo: "",
      dias: [],
      dia_completo: false,
      tipo_horario: "especifico",
    });
    setEditingIndex(null);
    setError("");
    setFieldErrors({
      hora_inicio: false,
      hora_fin: false,
      cupo: false,
      dias: false,
    });
  };

  const handleAddClick = () => {
    setEditingIndex(null);
    setShowForm(true);
    setError("");
    setFieldErrors({
      hora_inicio: false,
      hora_fin: false,
      cupo: false,
      dias: false,
    });
    // Si hay un tipo fijo, usar ese tipo
    if (tipoHorarioFijo) {
      setFormData((prev) => ({
        ...prev,
        tipo_horario: tipoHorarioFijo,
        hora_inicio: "",
        hora_fin: "",
        cupo: "",
        dias: [],
        dia_completo: false,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tipo_horario: "especifico",
        hora_inicio: "",
        hora_fin: "",
        cupo: "",
        dias: [],
        dia_completo: false,
      }));
    }
  };

  const handleSaveSchedule = () => {
    // Limpiar errores previos
    setFieldErrors({
      hora_inicio: false,
      hora_fin: false,
      cupo: false,
      dias: false,
    });

    let hasErrors = false;

    if (!formData.hora_inicio) {
      setFieldErrors((prev) => ({ ...prev, hora_inicio: true }));
      setError("Debe ingresar una hora de inicio");
      hasErrors = true;
    }

    if (formData.tipo_horario === "rango" && !formData.hora_fin) {
      setFieldErrors((prev) => ({ ...prev, hora_fin: true }));
      setError("Debe ingresar una hora de fin para el rango");
      hasErrors = true;
    }

    if (
      !formData.cupo ||
      isNaN(Number(formData.cupo)) ||
      Number(formData.cupo) <= 0
    ) {
      setFieldErrors((prev) => ({ ...prev, cupo: true }));
      setError("Capacidad debe ser un número positivo mayor a 0");
      hasErrors = true;
    }

    if (formData.dias.length === 0) {
      setFieldErrors((prev) => ({ ...prev, dias: true }));
      setError("Debe seleccionar al menos un día");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    // Si no hay errores, limpiar el mensaje de error
    setError("");

    const newSchedule: Schedule = {
      dia_completo: formData.dia_completo,
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: new Date().toISOString().split("T")[0],
      dias: formData.dias,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.tipo_horario === "rango" ? formData.hora_fin : "",
      cupo: Number(formData.cupo),
      tipo_horario: formData.tipo_horario as "especifico" | "rango",
    };

    if (editingIndex !== null) {
      const updatedCronograma = [...cronograma];
      updatedCronograma[editingIndex] = newSchedule;
      onCronogramaChange(updatedCronograma);
    } else {
      onCronogramaChange([...cronograma, newSchedule]);
    }

    // Si era el primer horario (no había horarios antes), mantener el formulario visible
    // Si ya había horarios, ocultar el formulario
    if (cronograma.length === 0) {
      // Era el primer horario, mantener formulario visible y limpiar campos
      setFormData({
        hora_inicio: "",
        hora_fin: "",
        cupo: "",
        dias: [],
        dia_completo: false,
        tipo_horario: "especifico",
      });
      setError("");
    } else {
      // Ya había horarios, ocultar el formulario
      setShowForm(false);
      setFormData({
        hora_inicio: "",
        hora_fin: "",
        cupo: "",
        dias: [],
        dia_completo: false,
        tipo_horario: "especifico",
      });
      setEditingIndex(null);
      setError("");
    }
  };

  //use state show form
  const [showFields, setShowFields] = useState(false);
  const handleAppearForm = () => {
    setShowFields(true);
  };

  const [showFieldsRango, setShowFieldsRango] = useState(false);

  const handleAppearFormRango = () => {
    setShowFieldsRango(true);
  };

  const handleDelete = (index: number) => {
    onCronogramaChange(cronograma.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({
      hora_inicio: cronograma[index].hora_inicio,
      hora_fin: cronograma[index].hora_fin,
      cupo: cronograma[index].cupo.toString(),
      dias: cronograma[index].dias,
      dia_completo: cronograma[index].dia_completo,
      tipo_horario: cronograma[index].tipo_horario,
    });
    setShowForm(true);
  };

  // Funciones para limpiar errores específicos
  const clearHoraInicioError = () => {
    if (fieldErrors.hora_inicio) {
      setFieldErrors((prev) => ({ ...prev, hora_inicio: false }));
      setError("");
    }
  };

  const clearHoraFinError = () => {
    if (fieldErrors.hora_fin) {
      setFieldErrors((prev) => ({ ...prev, hora_fin: false }));
      setError("");
    }
  };

  const clearCupoError = () => {
    if (fieldErrors.cupo) {
      setFieldErrors((prev) => ({ ...prev, cupo: false }));
      setError("");
    }
  };

  const clearDiasError = () => {
    if (fieldErrors.dias) {
      setFieldErrors((prev) => ({ ...prev, dias: false }));
      setError("");
    }
  };

  // Función para validar input de capacidad
  const handleCupoChange = (value: string) => {
    // Remover caracteres no válidos (solo permitir números)
    const cleanValue = value.replace(/[^0-9]/g, "");

    // Si el valor está vacío, permitir
    if (cleanValue === "") {
      setFormData((prev) => ({ ...prev, cupo: "" }));
      clearCupoError();
      return;
    }

    // Convertir a número y validar que sea positivo
    const numValue = parseInt(cleanValue);
    if (numValue > 0) {
      setFormData((prev) => ({ ...prev, cupo: cleanValue }));
      clearCupoError();
    }
  };

  return (
    <>
      <div className="flex flex-row flex-wrap gap-x-1 gap-y-3 w-full">
        {editingIndex === null &&
          cronograma.map((schedule, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-[8px] p-3 mb-3 flex items-center gap-3 flex-grow-0 flex-shrink-0 basis-[calc(50%-2px)]"
            >
              <Box sx={{ flexGrow: 1 }}>
                <div className="flex flex-row">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatTimeTo12Hour(schedule.hora_inicio)}
                    {schedule.hora_fin
                      ? ` - ${formatTimeTo12Hour(schedule.hora_fin)}`
                      : ""}
                  </Typography>
                </div>
                <Typography variant="body2" color="text.secondary">
                  Cupo: {schedule.cupo} personas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tipo:&nbsp;
                  {schedule.tipo_horario === "especifico"
                    ? "Horario Específico"
                    : "Rango de Horarios"}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                  {schedule.dias.map((dayNumber) => (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      key={dayNumber}
                    >
                      {Object.keys(daysMap).find(
                        (k) => daysMap[k as DayKey] === dayNumber
                      )}
                      ,&nbsp;
                    </Typography>
                  ))}
                </Box>
              </Box>

              <EditIcon
                onClick={() => handleEdit(index)}
                sx={{ cursor: "pointer", color: "#707070" }}
              />
              <DeleteIcon
                onClick={() => handleDelete(index)}
                sx={{ cursor: "pointer", color: "error.main" }}
              />
            </div>
          ))}
      </div>

      {showForm && (
        <Box
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            p: 3,
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            {editingIndex !== null ? "Editar Horario" : "Agregar horarios"}
          </Typography>

          {/* {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{
                mb: 2,
                p: 2,
                bgcolor: "error.light",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "error.main",
              }}
            >
              {error}
            </Typography>
          )} */}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              mb: 3,
            }}
          >
            {/* Box para Horario Específico */}
            {(!tipoHorarioFijo || tipoHorarioFijo === "especifico") && (
              <Box
                sx={{
                  maxWidth: "580px",
                  flex: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  p: 2,
                  bgcolor:
                    formData.tipo_horario === "especifico"
                      ? "#FFF3E0"
                      : "transparent",
                }}
              >
                {cronograma.length === 0 && (
                  <FormControlLabel
                    control={
                      <Switch
                        color="primary"
                        checked={
                          formData.tipo_horario ===
                          ("especifico" as TipoHorario)
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipo_horario: e.target.checked
                              ? "especifico"
                              : "rango",
                            hora_fin: e.target.checked ? "" : prev.hora_fin,
                          }))
                        }
                      />
                    }
                    label="Horarios específicos"
                    sx={{ mb: 2 }}
                  />
                )}
                {formData.tipo_horario === "especifico" &&
                  cronograma.length === 0 &&
                  !showFields && (
                    <div className="flex flex-col gap-2 items-center justify-center bg-white p-8 rounded-[8px]">
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, textAlign: "center" }}
                      >
                        Define turnos con hora de inicio y fin, y asigna cuántos
                        cupos hay para cada uno.
                      </Typography>
                      <Button
                        onClick={handleAppearForm}
                        variant="contained"
                        sx={{
                          backgroundColor: "primary.main",
                          "&:hover": { backgroundColor: "primary.dark" },
                          textTransform: "uppercase",
                        }}
                      >
                        Crear nuevo horario
                      </Button>
                    </div>
                  )}
                {formData.tipo_horario === "especifico" &&
                  (showFields || cronograma.length > 0) && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Hora de inicio
                        </Typography>
                        <TextField
                          fullWidth
                          required
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              hora_inicio: e.target.value,
                            }));
                            clearHoraInicioError();
                          }}
                          error={fieldErrors.hora_inicio}
                          helperText={
                            fieldErrors.hora_inicio
                              ? "Hora de inicio es requerida"
                              : ""
                          }
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Capacidad
                        </Typography>
                        <TextField
                          fullWidth
                          required
                          type="number"
                          value={formData.cupo}
                          onChange={(e) => {
                            handleCupoChange(e.target.value);
                          }}
                          error={fieldErrors.cupo}
                          helperText={
                            fieldErrors.cupo
                              ? "Capacidad debe ser un número positivo mayor a 0"
                              : ""
                          }
                          inputProps={{
                            min: 1,
                            step: 1,
                            pattern: "[0-9]*",
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                personas
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Días
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              color="primary"
                              checked={formData.dia_completo}
                              onChange={(e) => {
                                toggleAllDays(e.target.checked);
                                clearDiasError();
                              }}
                            />
                          }
                          label="Todos los días"
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {(Object.keys(daysMap) as DayKey[]).map((day) => (
                            <Chip
                              key={day}
                              label={day}
                              variant={
                                formData.dias.includes(daysMap[day])
                                  ? "filled"
                                  : "outlined"
                              }
                              color="primary"
                              onClick={() => {
                                toggleDay(day);
                                clearDiasError();
                              }}
                              sx={{
                                "&.MuiChip-filled": {
                                  backgroundColor: "primary.main",
                                  opacity: 1,
                                },
                                "&.MuiChip-outlined": {
                                  borderColor: "primary.main",
                                  color: "primary.main",
                                },
                              }}
                            />
                          ))}
                        </Box>
                        {fieldErrors.dias && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 1, display: "block" }}
                          >
                            Debe seleccionar al menos un día
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 2,
                          pt: 2,
                        }}
                      >
                        {cronograma?.length > 0 && (
                          <>
                            <Button variant="outlined" onClick={handleCancel}>
                              CANCELAR
                            </Button>
                            <Button
                              variant="contained"
                              onClick={handleSaveSchedule}
                              sx={{
                                backgroundColor: "primary.main",
                                "&:hover": { backgroundColor: "primary.dark" },
                                textTransform: "uppercase",
                              }}
                            >
                              Crear nuevo horario
                            </Button>
                          </>
                        )}
                        {cronograma?.length === 0 && (
                          <Button
                            variant="contained"
                            onClick={handleSaveSchedule}
                            sx={{
                              backgroundColor: "primary.main",
                              "&:hover": { backgroundColor: "primary.dark" },
                              textTransform: "uppercase",
                            }}
                          >
                            Crear horario
                          </Button>
                        )}
                      </Box>
                    </>
                  )}
              </Box>
            )}

            {/* Box para Rango de Horarios */}
            {(!tipoHorarioFijo || tipoHorarioFijo === "rango") && (
              <Box
                sx={{
                  maxWidth: "580px",
                  flex: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  p: 2,
                  bgcolor:
                    formData.tipo_horario === "rango"
                      ? "#FFF3E0"
                      : "transparent",
                }}
              >
                {cronograma.length === 0 && (
                  <FormControlLabel
                    control={
                      <Switch
                        color="primary"
                        checked={
                          formData.tipo_horario === ("rango" as TipoHorario)
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipo_horario: e.target.checked
                              ? "rango"
                              : "especifico",
                            hora_fin: e.target.checked ? prev.hora_fin : "",
                          }))
                        }
                      />
                    }
                    label="Rango de Horarios"
                    sx={{ mb: 2 }}
                  />
                )}

                {formData.tipo_horario === "rango" &&
                  cronograma.length === 0 &&
                  !showFieldsRango && (
                    <div className="flex flex-col gap-2 items-center justify-center bg-white p-8 rounded-[8px]">
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, textAlign: "center" }}
                      >
                        Los visitantes pueden llegar en cualquier momento entre
                        una hora de apertura y de cierre.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleAppearFormRango}
                        sx={{
                          backgroundColor: "primary.main",
                          "&:hover": { backgroundColor: "primary.dark" },
                          textTransform: "uppercase",
                        }}
                      >
                        Crear nuevo horario
                      </Button>
                    </div>
                  )}

                {formData.tipo_horario === "rango" &&
                  (showFieldsRango || cronograma.length > 0) && (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Hora de inicio
                        </Typography>
                        <TextField
                          fullWidth
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              hora_inicio: e.target.value,
                            }));
                            clearHoraInicioError();
                          }}
                          error={fieldErrors.hora_inicio}
                          helperText={
                            fieldErrors.hora_inicio
                              ? "Hora de inicio es requerida"
                              : ""
                          }
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Hora de fin
                        </Typography>
                        <TextField
                          fullWidth
                          type="time"
                          value={formData.hora_fin}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              hora_fin: e.target.value,
                            }));
                            clearHoraFinError();
                          }}
                          error={fieldErrors.hora_fin}
                          helperText={
                            fieldErrors.hora_fin
                              ? "Hora de fin es requerida para el rango"
                              : ""
                          }
                          InputProps={{
                            inputProps: {
                              min: formData.hora_inicio,
                            },
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Capacidad
                        </Typography>
                        <TextField
                          fullWidth
                          required
                          type="number"
                          value={formData.cupo}
                          onChange={(e) => {
                            handleCupoChange(e.target.value);
                          }}
                          error={fieldErrors.cupo}
                          helperText={
                            fieldErrors.cupo
                              ? "Capacidad debe ser un número positivo mayor a 0"
                              : ""
                          }
                          inputProps={{
                            min: 1,
                            step: 1,
                            pattern: "[0-9]*",
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                personas
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Días
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              color="primary"
                              checked={formData.dia_completo}
                              onChange={(e) => {
                                toggleAllDays(e.target.checked);
                                clearDiasError();
                              }}
                            />
                          }
                          label="Todos los días"
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {(Object.keys(daysMap) as DayKey[]).map((day) => (
                            <Chip
                              key={day}
                              label={day}
                              variant={
                                formData.dias.includes(daysMap[day])
                                  ? "filled"
                                  : "outlined"
                              }
                              color="primary"
                              onClick={() => {
                                toggleDay(day);
                                clearDiasError();
                              }}
                              sx={{
                                "&.MuiChip-filled": {
                                  backgroundColor: "primary.main",
                                  opacity: 1,
                                },
                                "&.MuiChip-outlined": {
                                  borderColor: "primary.main",
                                  color: "primary.main",
                                },
                              }}
                            />
                          ))}
                        </Box>
                        {fieldErrors.dias && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 1, display: "block" }}
                          >
                            Debe seleccionar al menos un día
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 2,
                          pt: 2,
                        }}
                      >
                        {cronograma?.length > 0 && (
                          <Button variant="outlined" onClick={handleCancel}>
                            CANCELAR
                          </Button>
                        )}

                        <Button
                          variant="contained"
                          onClick={handleSaveSchedule}
                          sx={{
                            backgroundColor: "primary.main",
                            "&:hover": { backgroundColor: "primary.dark" },
                            textTransform: "uppercase",
                          }}
                        >
                          Guardar Horario
                        </Button>
                      </Box>
                    </Box>
                  )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {!showForm && cronograma?.length > 0 && (
        <>
          <Button
            variant="contained"
            onClick={handleAddClick}
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
              px: 4,
              textTransform: "uppercase",
              fontWeight: 600,
              mt: 2,
            }}
          >
            Crear nuevo horario
          </Button>
        </>
      )}

      {!showForm && cronograma?.length === 0 && (
        <>
          <Button
            variant="contained"
            onClick={handleAddClick}
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
              px: 4,
              textTransform: "uppercase",
              fontWeight: 600,
              mt: 2,
            }}
          >
            Crear horario
          </Button>
        </>
      )}
    </>
  );
};

export default HorariosTab;
