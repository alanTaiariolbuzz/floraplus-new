import { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  CircularProgress,
  Autocomplete,
  Chip,
  Stack,
  Alert,
} from "@mui/material";

// Definir interface completa en un archivo compartido o tipo global
interface TransporteState {
  titulo: string;
  direccion: string;
  precio: number;
  actividad_ids: number[];
  cupo_maximo: number;
  limite_horario: boolean;
  limite_horas: number;
  horarios: Array<{ hora_salida: string; hora_llegada: string }>;
  mensaje: string;
  activo?: boolean;
}

interface InfoTabProps {
  transporteData: Pick<
    TransporteState,
    "titulo" | "direccion" | "precio" | "actividad_ids"
  >;
  setTransporteData: React.Dispatch<React.SetStateAction<TransporteState>>;
}

interface Actividad {
  id: number;
  titulo: string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const InfoTab = ({ transporteData, setTransporteData }: InfoTabProps) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const response = await fetch(`${siteUrl}/api/actividades`);
        if (!response.ok) throw new Error("Error al cargar actividades");
        const { data } = await response.json();
        setActividades(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Error cargando actividades. Intente recargar la página.");
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  const actividadesSeleccionadas = actividades.filter((a) =>
    transporteData.actividad_ids.includes(a.id)
  );

  const handleFieldChange = <K extends keyof typeof transporteData>(
    field: K,
    value: (typeof transporteData)[K]
  ) => {
    setTransporteData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Información del Transporte</Typography>

      <TextField
        fullWidth
        label="Título"
        value={transporteData.titulo}
        onChange={(e) => handleFieldChange("titulo", e.target.value)}
        required
      />

      <TextField
        fullWidth
        label="Dirección"
        value={transporteData.direccion}
        onChange={(e) => handleFieldChange("direccion", e.target.value)}
        required
      />

      <TextField
        fullWidth
        label="Precio"
        type="number"
        value={transporteData.precio}
        onChange={(e) =>
          handleFieldChange("precio", Math.max(0, Number(e.target.value)))
        }
        inputProps={{ min: 0 }}
        required
      />

      {error && <Alert severity="error">{error}</Alert>}
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
        disabled={loading || !!error}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            {option.titulo}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Actividades relacionadas"
            placeholder="Buscar actividades..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Stack>
  );
};

export default InfoTab;
