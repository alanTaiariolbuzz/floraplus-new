import {
  Button,
  Box,
  TextField,
  Typography,
  styled,
  CircularProgress,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useState, useEffect } from "react";
import { useUser } from "../../../../context/UserContext";

interface CorreoConfig {
  id?: number;
  agencia_id: number;
  email_from: string;
  email_reply_to: string;
  logo_url?: string;
  logo_filename?: string;
}

export default function MailsFormat() {
  const { customUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CorreoConfig>({
    agencia_id: customUser?.agencia_id || 0,
    email_from: "",
    email_reply_to: "",
    logo_url: "",
    logo_filename: "",
  });

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  });

  // Cargar configuración existente al montar el componente
  useEffect(() => {
    if (customUser?.agencia_id) {
      loadExistingConfig();
    }
  }, [customUser?.agencia_id]);

  const loadExistingConfig = async () => {
    if (!customUser?.agencia_id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/correos?agencia_id=${customUser.agencia_id}`
      );
      const result = await response.json();

      if (result.code === 200 && result.data) {
        setFormData({
          id: result.data.id,
          agencia_id: result.data.agencia_id,
          email_from: result.data.email_from || "",
          email_reply_to: result.data.email_reply_to || "",
          logo_url: result.data.logo_url || "",
          logo_filename: result.data.logo_filename || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!customUser?.agencia_id) {
      setError("No se pudo identificar la agencia");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("agencia_id", customUser.agencia_id.toString());

      const response = await fetch("/api/correos/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.code === 200) {
        setFormData({
          ...formData,
          logo_url: result.data.logo_url,
          logo_filename: result.data.logo_filename,
        });
        setSuccess("Logo subido exitosamente");
      } else {
        setError(result.message || "Error al subir el archivo");
      }
    } catch (error) {
      setError("Error al subir el archivo");
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!customUser?.agencia_id) {
      setError("No se pudo identificar la agencia");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Siempre usar PUT si ya existe configuración, POST si es nueva
      const method = formData.id ? "PUT" : "POST";
      const response = await fetch("/api/correos", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          agencia_id: customUser.agencia_id,
        }),
      });

      const result = await response.json();

      if (result.code === 200 || result.code === 201) {
        setSuccess(
          formData.id
            ? "Configuración actualizada exitosamente"
            : "Configuración guardada exitosamente"
        );
        if (result.data) {
          setFormData({
            ...formData,
            id: result.data.id,
          });
        }
      } else {
        setError(result.message || "Error al guardar la configuración");
      }
    } catch (error) {
      setError("Error al guardar la configuración");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="py-6 px-12 bg-white rounded-[8px] border border-[#E0E0E0]">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <div className="flex gap-4">
        <div className="w-1/2">
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
            Nombre del remitente:
          </Typography>
          <TextField
            fullWidth
            label="Nombre del remitente"
            name="email_from"
            value={formData.email_from}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
            helperText="Este nombre aparecerá como remitente en los emails (ej: Flora Plus)"
          />
        </div>
        <div className="w-1/2">
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
            Email de respuesta:
          </Typography>
          <TextField
            fullWidth
            label="Email de respuesta"
            name="email_reply_to"
            value={formData.email_reply_to}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
            helperText="Email donde los clientes pueden responder (ej: info@tuagencia.com)"
          />
        </div>
      </div>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
          Logo de la agencia
        </Typography>

        {/* Vista previa del logo actual */}
        {formData.logo_url && (
          <Box sx={{ mb: 2, p: 2, border: "1px solid #ddd", borderRadius: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              Así se verá el logo en los emails:
            </Typography>
            <img
              src={formData.logo_url}
              alt="Logo actual"
              style={{
                maxWidth: "100px",
                maxHeight: "100px",
                objectFit: "cover", // Cambiado a cover
                borderRadius: 999, // Hace el logo circular
                aspectRatio: "1/1", // Mantiene el círculo
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                setError(
                  "No se pudo cargar la imagen. Verifica que la URL sea correcta."
                );
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            border: "2px dashed #ddd",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            "&:hover": { borderColor: "#666" },
            position: "relative",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDrop}
        >
          {uploading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <UploadFileIcon sx={{ fontSize: 28, color: "primary.main", mb: 1 }} />

          <Box>
            {formData.logo_url ? (
              <>
                <Typography
                  variant="caption"
                  color="primary"
                  display="block"
                  sx={{ mb: 1 }}
                >
                  Logo cargado ✓
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Arrastra un nuevo archivo aquí para cambiar el logo
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="subtitle1" color="black">
                  Arrastra y suelta o
                  <Button component="label" variant="text" disabled={uploading}>
                    sube un logo
                    <VisuallyHiddenInput
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  PNG, JPG, GIF o SVG (máx. 100KB para optimizar emails)
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.email_from || !formData.email_reply_to}
        >
          {loading ? <CircularProgress size={20} /> : "Guardar configuración"}
        </Button>
      </Box>
    </div>
  );
}
