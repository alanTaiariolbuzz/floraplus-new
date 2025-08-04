"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress,
  Switch,
  Card,
  Autocomplete,
  Chip,
} from "@mui/material";

const CrearAdicional = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<{
    titulo: string;
    titulo_en: string;
    descripcion: string;
    descripcion_en: string;
    precio: string;
    actividad_ids: number[];
    activo: boolean;
  }>({
    titulo: "",
    titulo_en: "",
    descripcion: "",
    descripcion_en: "",
    precio: "",
    activo: true,
    actividad_ids: [],
  });
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activo, setActivo] = useState(true);

  const ADI_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/adicionales`;
  const ACTI_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/actividades`;

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const response = await fetch(ACTI_URL);
        if (!response.ok) throw new Error("Error al cargar actividades");

        const { data } = await response.json();
        setActividades(Array.isArray(data) ? data : []); // Siempre aseguramos que sea un array
      } catch (err) {
        setError("Error cargando actividades");
        setActividades([]); // Evitamos valores undefined
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  const handleActividadChange = (event: any) => {
    setFormData({
      ...formData,
      actividad_ids: event.target.value, // Guardamos los IDs seleccionados
    });
  };

  // Función para invalidar caché global de adicionales
  const invalidateAdicionalesCache = () => {
    // Limpiar cualquier caché en localStorage si existe
    if (typeof window !== "undefined") {
      localStorage.removeItem("adicionales_cache");
      localStorage.removeItem("adicionales_hasLoaded");
    }

    // También podemos enviar un evento personalizado para que otros componentes se enteren
    window.dispatchEvent(new CustomEvent("adicionales-cache-invalidated"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      titulo: formData.titulo,
      titulo_en: formData.titulo_en,
      descripcion: formData.descripcion,
      descripcion_en: formData.descripcion_en,
      precio: parseFloat(formData.precio),
      actividad_ids: formData.actividad_ids,
      moneda: "USD",
      activo: activo,
      aplica_a_todas: false,
    };


    // Agregar validación
    if (!payload.titulo.trim()) {
      setError("El título es requerido");
      return;
    }

    try {
      const response = await fetch(ADI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Invalidar caché antes de redirigir
        invalidateAdicionalesCache();
        router.push("/productos/adicionales");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Error al crear");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 500, mb: 4 }}>
        Crear adicional
      </Typography>
      <Card sx={{ maxWidth: 1200, margin: "auto", p: 4 }}>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-row gap-4 ">
            <div className="w-[60%] border border-gray-200 rounded-[8px] p-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Título en español
                  </Typography>
                  <TextField
                    fullWidth
                    label="Título en español"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                  />
                </div>
                <div className="w-1/2">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Título en inglés
                  </Typography>
                  <TextField
                    fullWidth
                    label="Título en inglés"
                    name="titulo_en"
                    value={formData.titulo_en}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Descripción en español
                  </Typography>
                  <TextField
                    fullWidth
                    label="Descripción en español"
                    name="descripcion"
                    multiline
                    rows={4}
                    value={formData.descripcion}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                  />
                </div>
                <div className="w-1/2">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Descripción en inglés
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Descripción en inglés"
                    name="descripcion_en"
                    value={formData.descripcion_en}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="ml-6">
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Precio
              </Typography>
              <TextField
                fullWidth
                label="Precio"
                name="precio"
                type="number"
                value={formData.precio}
                onChange={handleChange}
                sx={{ mb: 2 }}
                required
              />

              {typeof activo === "boolean" && (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Estado
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Switch
                      checked={activo}
                      onChange={(e) => {
                        setActivo(e.target.checked);
                        setFormData((prev) => ({
                          ...prev,
                          activo: e.target.checked,
                        }));
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {activo ? "Publicado" : "Borrador"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </div>
          </div>
          {/* Dropdown con checkboxes */}
          <FormControl fullWidth sx={{ mb: 2, mt: 4, width: "60%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
              ¿A que actividades pertenece?
            </Typography>
            <Autocomplete
              multiple
              options={actividades}
              getOptionLabel={(option) => option.titulo}
              value={actividades.filter((a) =>
                formData.actividad_ids.includes(a.id)
              )}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  actividad_ids: newValue.map((a) => a.id),
                }));
              }}
              loading={loading}
              disabled={loading || !!error}
              getOptionKey={(option) => option.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar actividades..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading && (
                          <CircularProgress color="inherit" size={20} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.titulo}
                    size="small"
                  />
                ))
              }
              renderOption={(props, option) => {
                // Si es la primera opción, renderizar "Seleccionar todas"
                if (option.id === "select-all") {
                  const allSelected =
                    formData.actividad_ids.length === actividades.length;
                  const someSelected = formData.actividad_ids.length > 0;

                  return (
                    <li {...props} key="select-all">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        sx={{ mr: 1 }}
                      />
                      <Typography
                        sx={{ fontWeight: 500, color: "primary.main" }}
                      >
                        Seleccionar todas
                      </Typography>
                    </li>
                  );
                }

                return (
                  <li {...props} key={option.id}>
                    <Checkbox
                      checked={formData.actividad_ids.includes(option.id)}
                      sx={{ mr: 1 }}
                    />
                    {option.titulo}
                  </li>
                );
              }}
              ListboxProps={{
                onMouseDown: (e) => {
                  // Prevenir que se cierre el dropdown al hacer clic en "Seleccionar todas"
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-option-index="0"]')) {
                    e.preventDefault();
                  }
                },
              }}
            />
            {/* Botón adicional para seleccionar todas */}
            {actividades.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const allIds = actividades.map((a) => a.id);
                  setFormData((prev) => ({
                    ...prev,
                    actividad_ids:
                      prev.actividad_ids.length === allIds.length ? [] : allIds,
                  }));
                }}
                sx={{ mt: 1, mb: 1 }}
              >
                {formData.actividad_ids.length === actividades.length
                  ? "Deseleccionar todas"
                  : "Seleccionar todas"}
              </Button>
            )}
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </FormControl>

          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 mr-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              onClick={() => router.push("/productos/adicionales")}
            >
              Cancelar
            </button>

            <Button type="submit" variant="contained" color="primary">
              Crear Adicional
            </Button>
          </div>
        </form>
      </Card>
    </Box>
  );
};

export default CrearAdicional;
