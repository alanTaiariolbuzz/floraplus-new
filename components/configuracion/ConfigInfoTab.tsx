import { Typography, TextField, Grid, Button, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

export const ConfigInfoTab = () => {
  const { agency, isLoading, refreshAgency } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for sales department fields
  const [formData, setFormData] = useState({
    nombre_departamento_reservas: "",
    email_departamento_reservas: "",
    telefono_departamento_reservas: "",
  });

  // Initialize form data when agency data is loaded
  useEffect(() => {
    if (agency) {
      setFormData({
        nombre_departamento_reservas: agency.nombre_departamento_reservas || "",
        email_departamento_reservas: agency.email_departamento_reservas || "",
        telefono_departamento_reservas:
          agency.telefono_departamento_reservas || "",
      });
    }
  }, [agency]);

  const handleSave = async () => {
    if (!agency) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/agencias?id=${agency.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_departamento_reservas: formData.nombre_departamento_reservas,
          email_departamento_reservas: formData.email_departamento_reservas,
          telefono_departamento_reservas:
            formData.telefono_departamento_reservas,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSaveSuccess(true);
        setIsEditing(false);
        // Refresh the agency data from the server
        await refreshAgency();
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setError(result.message || "Error al guardar los datos");
      }
    } catch (err) {
      setError("Error de conexión al guardar los datos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSaveSuccess(false);
    // Reset form data to original values
    if (agency) {
      setFormData({
        nombre_departamento_reservas: agency.nombre_departamento_reservas || "",
        email_departamento_reservas: agency.email_departamento_reservas || "",
        telefono_departamento_reservas:
          agency.telefono_departamento_reservas || "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Cargando datos de la organización...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "500", mb: 3, color: "error.main" }}
        >
          Error: {error}
        </Typography>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "500", mb: 3, color: "error.main" }}
        >
          No se encontraron datos de la agencia
        </Typography>
      </div>
    );
  }


  return (
    <>
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Organización
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de la sociedad"
              variant="outlined"
              value={agency?.nombre || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre comercial"
              variant="outlined"
              value={agency?.nombre_comercial || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cédula jurídica"
              variant="outlined"
              value={agency?.cedula || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="País"
              variant="outlined"
              value={agency?.pais || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Dirección"
              variant="outlined"
              value={agency?.direccion || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sitio web"
              variant="outlined"
              value={agency?.web || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
        </Grid>
        <small className="text-gray-500 mt-2">
          Si ves un error en los datos, contacta a soporte.
        </small>
      </div>
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0] mt-5">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Representante
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre colaborador"
              variant="outlined"
              value={agency?.nombre_representante || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Correo"
              variant="outlined"
              value={agency?.email_contacto || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              variant="outlined"
              value={agency?.telefono || ""}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black", // para evitar que Safari lo ponga gris
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
        </Grid>
      </div>

      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0] mt-5">
        <div className="flex justify-between items-center mb-3">
          <Typography variant="subtitle1" sx={{ fontWeight: "500" }}>
            Departamento de reservas
          </Typography>
          {!isEditing ? (
            <Button
              variant="outlined"
              onClick={() => setIsEditing(true)}
              size="small"
            >
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                size="small"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSaving}
                size="small"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Información guardada exitosamente
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre colaborador"
              variant="outlined"
              value={
                isEditing
                  ? formData.nombre_departamento_reservas
                  : agency?.nombre_departamento_reservas || ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nombre_departamento_reservas: e.target.value,
                }))
              }
              disabled={!isEditing}
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black",
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Correo"
              variant="outlined"
              value={
                isEditing
                  ? formData.email_departamento_reservas
                  : agency?.email_departamento_reservas || ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email_departamento_reservas: e.target.value,
                }))
              }
              disabled={!isEditing}
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black",
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              variant="outlined"
              value={
                isEditing
                  ? formData.telefono_departamento_reservas
                  : agency?.telefono_departamento_reservas || ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  telefono_departamento_reservas: e.target.value,
                }))
              }
              disabled={!isEditing}
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "black",
                  WebkitTextFillColor: "black",
                },
                "& .MuiInputLabel-root.Mui-disabled": {
                  color: "black",
                  opacity: 1,
                },
              }}
            />
          </Grid>
        </Grid>
      </div>
    </>
  );
};
