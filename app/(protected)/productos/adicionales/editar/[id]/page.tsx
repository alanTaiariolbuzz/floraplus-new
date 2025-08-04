// app/(protected)/productos/adicionales/editar/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Alert,
  Autocomplete,
  Chip,
  Switch,
  Card,
} from "@mui/material";
// InputAdornment

//

interface Actividad {
  id: number;
  titulo: string;
}

interface SelectAllOption {
  id: string;
  titulo: string;
}

interface AdicionalState {
  id: number;
  titulo: string;
  titulo_en: string;
  descripcion: string;
  descripcion_en: string;
  precio: number;
  actividad_ids: number[];
  activo: boolean;
}

const EditarAdicionalPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [activo, setActivo] = useState(true);

  const [formData, setFormData] = useState<AdicionalState>({
    id: 0,
    titulo: "",
    titulo_en: "",
    descripcion: "",
    descripcion_en: "",
    precio: 0,
    actividad_ids: [],
    activo: true,
  });

  // En tu página de edición ([id]/page.tsx), modifica el useEffect:
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar actividades
        const resActs = await fetch("/api/actividades");
        const { data: acts } = await resActs.json();
        if (Array.isArray(acts)) {
          setActividades(acts.map((a) => ({ ...a, id: Number(a.id) })));
        } else {
          setError("No se pudieron cargar las actividades");
        }

        // Cargar adicional
        const resAdic = await fetch(`/api/adicionales?id=${id}`);
        const { data } = await resAdic.json();
        const adicional = data[0];

        setFormData({
          id: adicional.id,
          titulo: adicional.titulo,
          titulo_en: adicional.titulo_en,
          descripcion: adicional.descripcion,
          descripcion_en: adicional.descripcion_en,
          precio: Number(adicional.precio),
          actividad_ids: (adicional.actividad_ids as number[]).map((id) =>
            Number(id)
          ),
          activo: adicional.activo,
        });
        setActivo(adicional.activo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de carga");
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarDatos();
  }, [id]);

  const actividadesSeleccionadas = actividades.filter((a) =>
    formData.actividad_ids.includes(a.id)
  );

  const handleFieldChange = <K extends keyof AdicionalState>(
    field: K,
    value: AdicionalState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/adicionales?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          moneda: "USD",
          aplica_a_todas: false,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar");
      router.push("/productos/adicionales");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (loading)
    return (
      <>
        <div className="flex justify-center items-center h-screen">
          <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />{" "}
        </div>
      </>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 500, mb: 4 }}>
        Editar adicional
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
                    Título
                  </Typography>
                  <TextField
                    fullWidth
                    label="Título"
                    name="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      handleFieldChange("titulo", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleFieldChange("titulo_en", e.target.value)
                    }
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
                    Descripción
                  </Typography>
                  <TextField
                    fullWidth
                    label="Descripción"
                    name="descripcion"
                    multiline
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) =>
                      handleFieldChange("descripcion", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleFieldChange("descripcion_en", e.target.value)
                    }
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
                onChange={(e) =>
                  handleFieldChange("precio", Number(e.target.value))
                }
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
                        handleFieldChange("activo", e.target.checked);
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

          <FormControl fullWidth sx={{ mb: 2, mt: 4, width: "60%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
              ¿A que actividades pertenece?
            </Typography>

            <Autocomplete
              multiple
              options={actividades}
              getOptionLabel={(option) => option.titulo}
              value={actividadesSeleccionadas}
              onChange={(_, newValue) => {
                handleFieldChange(
                  "actividad_ids",
                  newValue.map((a) => a.id)
                );
              }}
              loading={loading}
              disabled={loading}
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
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Checkbox
                    checked={formData.actividad_ids.includes(option.id)}
                    sx={{ mr: 1 }}
                  />
                  {option.titulo}
                </li>
              )}
            />
            {/* Botón adicional para seleccionar todas */}
            {actividades.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const allIds = actividades.map((a) => a.id);
                  handleFieldChange(
                    "actividad_ids",
                    formData.actividad_ids.length === allIds.length
                      ? []
                      : allIds
                  );
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Card>
    </Box>
  );
};

export default EditarAdicionalPage;
