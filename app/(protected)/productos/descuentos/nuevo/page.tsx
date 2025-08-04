// app/(protected)/productos/descuentos/nuevo/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  ListItemText,
  OutlinedInput,
  Chip,
  BoxProps,
} from "@mui/material";

const CrearDescuentoPage = () => {
  const router = useRouter();
  const [actividades, setActividades] = useState<any[]>([]); // Lista de actividades
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<
    string[]
  >([]); // Actividades seleccionadas
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // Estado para controlar la apertura del dropdown

  // const [selectedActividades, setSelectedActividades] = useState<string[]>([]); // Actividades seleccionadas
  const [error, setError] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [tipoMonto, setTipoMonto] = useState<"fijo" | "variable">("fijo");
  const [monto, setMonto] = useState("");
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState("");
  const [montoFijoTipo, setMontoFijoTipo] = useState<"total" | "ticket">(
    "total"
  );
  const [alcance, setAlcance] = useState("actividad");
  const [validoDesde, setValidoDesde] = useState("");
  const [validoHasta, setValidoHasta] = useState("");
  const [activo, setActivo] = useState(true);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    // Llamada a la API para obtener las actividades
    const fetchActividades = async () => {
      try {
        const response = await fetch(`${siteUrl}/api/actividades`);
        const data = await response.json();
        // Acceder correctamente a la propiedad 'data' de la respuesta
        setActividades(Array.isArray(data.data) ? data.data : []); // Aquí accedemos a 'data'
      } catch (error) {
        console.error("Error al obtener las actividades:", error);
      }
    };
    fetchActividades();
  }, []);

  const handleToggle = (id: string) => {
    setActividadesSeleccionadas((prev) =>
      prev.includes(id)
        ? prev.filter((actividadId) => actividadId !== id)
        : [...prev, id]
    );
  };

  // Manejar apertura y cierre del dropdown
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const renderSelectedValues = (selectedIds: string[]) => {
    const selectedActividades = actividades.filter((actividad) =>
      selectedIds.includes(actividad.id)
    );
    return selectedActividades.map((actividad) => actividad.titulo).join(", ");
  };

  // Manejo del cambio de actividades seleccionadas
  const handleActividadesChange = (
    e: React.ChangeEvent<{ value: unknown }>
  ) => {
    // Asegúrate de que el valor sea un array de strings
    setActividadesSeleccionadas(e.target.value as string[]);
  };

  const handleSubmit = async () => {
    // Convierte monto y descuentoPorcentaje a número si es necesario
    const valor =
      tipoMonto === "variable"
        ? parseFloat(descuentoPorcentaje) // Se convierte el porcentaje a número
        : parseFloat(monto); // Se convierte el monto fijo a número

    // Verifica si la conversión fue exitosa
    if (isNaN(valor)) {
      console.error("El valor no es un número válido");
      return; // Salir si la conversión falla
    }

    const newDiscount = {
      titulo,
      tipo: tipoMonto === "variable" ? "porcentaje" : "monto",
      valor,
      alcance,
      valido_desde: validoDesde,
      valido_hasta: validoHasta,
      activo,
      uso_maximo: 0,
      usos_hechos: 0,
      actividad_ids: actividadesSeleccionadas, // Actividades seleccionadas
    };

    // Enviar la solicitud POST a la API para crear el descuento
    try {
      const response = await fetch(`${siteUrl}/api/descuentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDiscount),
      });

      if (!response.ok) {
        throw new Error("Error al crear el descuento");
      }

      const { data } = await response.json();

      router.push("/productos/descuentos"); // Redirigir a la página de descuentos
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Crear Nuevo Descuento
      </Typography>

      <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 3, mb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Sección Título */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Título del descuento
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </Box>

        {/* Sección Tipo de Descuento */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Tipo de descuento
          </Typography>
          <RadioGroup
            row
            value={tipoMonto}
            onChange={(e) =>
              setTipoMonto(e.target.value as "fijo" | "variable")
            }
          >
            <FormControlLabel
              value="fijo"
              control={<Radio />}
              label="Monto Fijo"
              sx={{ mr: 3 }}
            />
            <FormControlLabel
              value="variable"
              control={<Radio />}
              label="Porcentaje"
            />
          </RadioGroup>
        </Box>

        {/* Sección Monto */}
        {tipoMonto === "variable" ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Porcentaje de descuento
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={descuentoPorcentaje}
              onChange={(e) => setDescuentoPorcentaje(e.target.value)}
              InputProps={{
                endAdornment: <Typography>%</Typography>,
              }}
            />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Monto fijo
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>USD $</Typography>,
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Aplicación del monto fijo
              </Typography>
              <RadioGroup
                row
                value={montoFijoTipo}
                onChange={(e) =>
                  setMontoFijoTipo(e.target.value as "total" | "ticket")
                }
              >
                <FormControlLabel
                  value="total"
                  control={<Radio />}
                  label="Por total de compra"
                  sx={{ mr: 3 }}
                />
                <FormControlLabel
                  value="ticket"
                  control={<Radio />}
                  label="Por cada ticket"
                />
              </RadioGroup>
            </Box>
          </>
        )}

        {/* Sección Actividades */}
        <Box>
          {/* Dropdown de actividades */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            ¿A qué actividades aplica este descuento?
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ mb: 1 }}>Seleccionar Actividades</InputLabel>
            <Select
              multiple
              value={actividadesSeleccionadas}
              onChange={(e) =>
                setActividadesSeleccionadas(e.target.value as string[])
              }
              MenuProps={{ anchorEl }}
              renderValue={renderSelectedValues} // Usar la función para mostrar los nombres de las actividades
              onClick={handleClick}
            >
              {actividades?.map((actividad) => (
                <MenuItem key={actividad.id} value={actividad.id}>
                  <Checkbox
                    checked={actividadesSeleccionadas.includes(actividad.id)}
                    onChange={() => handleToggle(actividad.id)}
                  />
                  <ListItemText primary={actividad.titulo} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Sección Estado */}

        {/* Sección Fechas */}
        <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Vigencia desde
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={validoDesde}
              onChange={(e) => setValidoDesde(e.target.value)}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Vigencia hasta
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={validoHasta}
              onChange={(e) => setValidoHasta(e.target.value)}
            />
          </Box>
        </Box>

        {/* Sección Estado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox checked={activo} onChange={() => setActivo(!activo)} />
            }
            label="Activo"
          />
        </Box>

        {/* Botón de Envío */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ width: 200 }}
            onClick={handleSubmit}
          >
            Crear Descuento
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CrearDescuentoPage;
